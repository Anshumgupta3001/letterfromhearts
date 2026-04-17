import mongoose      from 'mongoose'
import User           from '../models/User.js'
import GoogleUser     from '../models/GoogleUser.js'
import Letter         from '../models/Letter.js'
import EmailAccount   from '../models/EmailAccount.js'
import Notification   from '../models/Notification.js'
import Reply          from '../models/Reply.js'

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

  // ── Extended metrics (parallel) ───────────────────────────────────────────
  const [
    // Role breakdown
    seekerEmail, listenerEmail, bothEmail,
    seekerGoogle, listenerGoogle, bothGoogle,
    // Mood distribution (all letters with a mood)
    moodAgg,
    // Notification stats
    totalNotifs, unreadNotifs, notifTypeAgg,
    // Conversation (Reply) stats
    totalConversations, endedConversations,
    endedBySeekerCount, endedByListenerCount,
    msgAgg,
    // Signup source breakdown (email users only — GoogleUser has no heardFrom)
    sourceAgg,
    // Daily trend — letters created in window
    letterTrendAgg,
    // Daily trend — user signups
    userTrendEmailAgg, userTrendGoogleAgg,
  ] = await Promise.all([
    // Roles
    User.countDocuments({ role: 'seeker' }),
    User.countDocuments({ role: 'listener' }),
    User.countDocuments({ role: 'both' }),
    GoogleUser.countDocuments({ role: 'seeker' }),
    GoogleUser.countDocuments({ role: 'listener' }),
    GoogleUser.countDocuments({ role: 'both' }),
    // Moods
    Letter.aggregate([
      { $match: { mood: { $exists: true, $ne: '' } } },
      { $group: { _id: '$mood', count: { $sum: 1 } } },
      { $sort:  { count: -1 } },
    ]),
    // Notifications
    Notification.countDocuments(),
    Notification.countDocuments({ isRead: false }),
    Notification.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort:  { count: -1 } },
    ]),
    // Conversations
    Reply.countDocuments(),
    Reply.countDocuments({ isEnded: true }),
    Reply.countDocuments({ isEnded: true, endedBy: 'seeker' }),
    Reply.countDocuments({ isEnded: true, endedBy: 'listener' }),
    Reply.aggregate([
      { $group: { _id: null, total: { $sum: { $size: '$messages' } } } },
    ]),
    // Signup sources
    User.aggregate([
      { $match: { heardFrom: { $exists: true, $ne: '' } } },
      { $group: { _id: '$heardFrom', count: { $sum: 1 } } },
      { $sort:  { count: -1 } },
    ]),
    // Daily letter trend
    Letter.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: {
        _id:     { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        letters: { $sum: 1 },
        sent:    { $sum: { $cond: [{ $eq: ['$type', 'sent'] }, 1, 0] } },
      }},
      { $sort: { _id: 1 } },
    ]),
    // Daily signup trend
    User.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    ]),
    GoogleUser.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
    ]),
  ])

  // Merge user-trend data
  const userTrendMap = {}
  for (const r of [...userTrendEmailAgg, ...userTrendGoogleAgg]) {
    userTrendMap[r._id] = (userTrendMap[r._id] || 0) + r.count
  }
  const userTrend = Object.entries(userTrendMap).sort(([a], [b]) => a.localeCompare(b)).map(([date, count]) => ({ date, count }))

  const roles = {
    seeker:   seekerEmail   + seekerGoogle,
    listener: listenerEmail + listenerGoogle,
    both:     bothEmail     + bothGoogle,
  }
  const totalRepliesSent = msgAgg[0]?.total || 0

  // ── Active users + all-time funnel + top listeners (parallel) ───────────────
  const [
    activeUserDistinct,
    allTimeLetters,
    allTimeSent,
    allTimeOpened,
    allTimeClaimed,
    topListenersAgg,
  ] = await Promise.all([
    Letter.distinct('userId', { createdAt: { $gte: since } }),
    Letter.countDocuments(),
    Letter.countDocuments({ type: 'sent', status: { $ne: 'scheduled' } }),
    Letter.countDocuments({ type: 'sent', $or: [{ status: { $in: ['opened', 'clicked'] } }, { clickCount: { $gt: 0 } }] }),
    Letter.countDocuments({ type: 'stranger', $or: [{ isRead: true }, { isClaimed: true }] }),
    Reply.aggregate([
      { $group: { _id: '$listenerId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
  ])

  const activeUsers   = activeUserDistinct.length
  const inactiveUsers = Math.max(0, totalUsers - activeUsers)

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

  // Build name+email maps for enriching top listeners
  const allUsersFlat  = [...emailUsers, ...googleUsers]
  const userInfoMap   = {}
  for (const u of allUsersFlat) {
    userInfoMap[u._id.toString()] = { name: u.name || '—', email: u.email }
  }

  const topListeners = topListenersAgg.map(l => ({
    id:    l._id,
    name:  userInfoMap[l._id?.toString()]?.name  || '—',
    email: userInfoMap[l._id?.toString()]?.email || '—',
    count: l.count,
  }))

  // ── Recent letters (last 20 across all users) ─────────────────────────────
  const recentLetters = await Letter.find({})
    .sort({ createdAt: -1 })
    .limit(20)
    .select('userId type status subject createdAt scheduledFor isScheduled toEmail')
    .lean()

  // Attach sender email to recent letters
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
      // Roles
      roles,
      // Moods: [{ _id: 'joy', count: 12 }, ...]
      moods: moodAgg,
      // Notifications
      totalNotifs,
      unreadNotifs,
      notifByType: notifTypeAgg,
      // Active / inactive users (within selected period)
      activeUsers,
      inactiveUsers,
      // All-time letter lifecycle funnel
      letterFunnel: {
        total:   allTimeLetters,
        sent:    allTimeSent,
        opened:  allTimeOpened,
        replied: totalConversations,
        claimed: allTimeClaimed,
      },
      // Top senders (by letters written, already sorted)
      topSenders: userStats.slice(0, 5).map(u => ({ name: u.name, email: u.email, count: u.written })),
      // Top listeners (by conversations handled)
      topListeners,
      // Conversations
      totalConversations,
      endedConversations,
      endedBySeeker:   endedBySeekerCount,
      endedByListener: endedByListenerCount,
      totalRepliesSent,
      activeConversations: totalConversations - endedConversations,
      // Signup sources
      sources: sourceAgg,
      // Trends
      letterTrend: letterTrendAgg,
      userTrend,
      // Tables
      userStats,
      recentLetters: recentLettersOut,
    },
  })
}
