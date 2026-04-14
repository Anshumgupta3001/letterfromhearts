import mongoose    from 'mongoose'
import User         from '../models/User.js'
import GoogleUser   from '../models/GoogleUser.js'
import Letter       from '../models/Letter.js'
import EmailAccount from '../models/EmailAccount.js'

// GET /api/admin/analytics?key=xxx&days=7
export async function getAdminAnalytics(req, res) {
  const days = Math.min(Math.max(parseInt(req.query.days) || 7, 1), 365)

  const since = new Date()
  since.setDate(since.getDate() - days)
  const base = { createdAt: { $gte: since } }

  // ── System-wide totals (parallel) ────────────────────────────────────────
  const [
    totalEmailUsers,
    totalGoogleUsers,
    newEmailUsers,
    newGoogleUsers,
    totalLetters,
    sentLetters,
    openedLetters,
    scheduledLetters,
    personalLetters,
    strangerLetters,
    claimedLetters,
    emailConnections,
  ] = await Promise.all([
    User.countDocuments(),
    GoogleUser.countDocuments(),
    User.countDocuments(base),
    GoogleUser.countDocuments(base),
    Letter.countDocuments(base),
    Letter.countDocuments({ ...base, type: 'sent', status: { $ne: 'scheduled' } }),
    Letter.countDocuments({ ...base, type: 'sent', $or: [{ status: { $in: ['opened', 'clicked'] } }, { clickCount: { $gt: 0 } }] }),
    Letter.countDocuments({ ...base, status: 'scheduled' }),
    Letter.countDocuments({ ...base, type: 'personal' }),
    Letter.countDocuments({ ...base, type: 'stranger' }),
    Letter.countDocuments({ ...base, type: 'stranger', $or: [{ isRead: true }, { isClaimed: true }] }),
    EmailAccount.countDocuments(),
  ])

  const totalUsers = totalEmailUsers + totalGoogleUsers
  const newUsers   = newEmailUsers + newGoogleUsers
  const openRate   = sentLetters > 0 ? Math.round((openedLetters / sentLetters) * 100) : 0

  // ── Per-user letter stats via aggregation (single query, no N+1) ──────────
  const letterAgg = await Letter.aggregate([
    { $group: {
      _id:       '$userId',
      written:   { $sum: 1 },
      sent:      { $sum: { $cond: [{ $and: [{ $eq: ['$type', 'sent'] }, { $ne: ['$status', 'scheduled'] }] }, 1, 0] } },
      opened:    { $sum: { $cond: [{ $or: [{ $in: ['$status', ['opened', 'clicked']] }, { $gt: ['$clickCount', 0] }] }, 1, 0] } },
      scheduled: { $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] } },
      personal:  { $sum: { $cond: [{ $eq: ['$type', 'personal'] }, 1, 0] } },
      stranger:  { $sum: { $cond: [{ $eq: ['$type', 'stranger'] }, 1, 0] } },
      lastActive:{ $max: '$createdAt' },
    }},
    { $sort: { written: -1 } },
    { $limit: 200 },
  ])

  // Build a map for quick lookup
  const activityMap = {}
  for (const row of letterAgg) {
    if (row._id) activityMap[row._id.toString()] = row
  }

  // Fetch all users from both collections
  const [emailUsers, googleUsers] = await Promise.all([
    User.find({}, 'name email role createdAt').lean(),
    GoogleUser.find({}, 'name email role createdAt').lean(),
  ])

  function mergeUser(u, provider) {
    const stats = activityMap[u._id.toString()] || { written: 0, sent: 0, opened: 0, scheduled: 0, personal: 0, stranger: 0 }
    return {
      id:         u._id,
      name:       u.name || '—',
      email:      u.email,
      role:       u.role || 'both',
      provider,
      joinedAt:   u.createdAt,
      lastActive: stats.lastActive || null,
      written:    stats.written,
      sent:       stats.sent,
      opened:     stats.opened,
      scheduled:  stats.scheduled,
      personal:   stats.personal,
      stranger:   stats.stranger,
    }
  }

  const userStats = [
    ...emailUsers.map(u => mergeUser(u, 'email')),
    ...googleUsers.map(u => mergeUser(u, 'google')),
  ].sort((a, b) => b.written - a.written)

  // ── Recent letters (last 20 across all users) ─────────────────────────────
  const recentLetters = await Letter.find({})
    .sort({ createdAt: -1 })
    .limit(20)
    .select('userId type status subject createdAt scheduledFor isScheduled toEmail')
    .lean()

  // Attach sender email to recent letters
  const allUserIds   = [...new Set(recentLetters.map(l => l.userId?.toString()).filter(Boolean))]
  const allUsersFlat = [...emailUsers, ...googleUsers]
  const userEmailMap = {}
  for (const u of allUsersFlat) userEmailMap[u._id.toString()] = u.email

  const recentLettersOut = recentLetters.map(l => ({
    ...l,
    senderEmail: userEmailMap[l.userId?.toString()] || '—',
  }))

  res.json({
    success: true,
    data: {
      days,
      // Totals
      totalUsers,
      totalEmailUsers,
      totalGoogleUsers,
      newUsers,
      // Letter counts
      totalLetters,
      sentLetters,
      openedLetters,
      scheduledLetters,
      personalLetters,
      strangerLetters,
      claimedLetters,
      openRate,
      // Infrastructure
      emailConnections,
      // Tables
      userStats,
      recentLetters: recentLettersOut,
    },
  })
}
