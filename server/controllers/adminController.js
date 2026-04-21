import mongoose from 'mongoose'
import User         from '../models/User.js'
import Letter       from '../models/Letter.js'
import EmailAccount from '../models/EmailAccount.js'
import Notification from '../models/Notification.js'
import Reply        from '../models/Reply.js'

// GET /api/admin/analytics?key=xxx&days=7
export async function getAdminAnalytics(req, res) {
  const days = Math.min(Math.max(parseInt(req.query.days) || 7, 1), 365)

  const since = new Date()
  since.setDate(since.getDate() - days)
  const base = { createdAt: { $gte: since } }

  // authProvider: 'google' for Google users; 'email' (or absent, for legacy docs) for email users
  const googleFilter = { authProvider: 'google' }
  const emailFilter  = { authProvider: { $ne: 'google' } }

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
    User.countDocuments(emailFilter),
    User.countDocuments(googleFilter),
    User.countDocuments({ ...emailFilter,  ...base }),
    User.countDocuments({ ...googleFilter, ...base }),
    Letter.countDocuments(base),
    Letter.countDocuments({ ...base, type: 'sent', status: { $ne: 'scheduled' } }),
    Letter.countDocuments({ ...base, type: 'sent', $or: [{ 'openedBy.0': { $exists: true } }, { status: { $in: ['opened', 'clicked'] } }, { clickCount: { $gt: 0 } }] }),
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
    // Role breakdown — single collection now, query by role directly
    seekerCount, listenerCount, bothCount,
    // Mood distribution
    moodAgg,
    // Notification stats
    totalNotifs, unreadNotifs, notifTypeAgg,
    // Conversation stats
    totalConversations, endedConversations,
    endedBySeekerCount, endedByListenerCount,
    msgAgg,
    // Signup source breakdown (email users only — Google users have no heardFrom)
    sourceAgg,
    // Daily trend — letters created in window
    letterTrendAgg,
    // Daily trend — user signups (single aggregation over unified collection)
    userTrendAgg,
  ] = await Promise.all([
    User.countDocuments({ role: 'seeker' }),
    User.countDocuments({ role: 'listener' }),
    User.countDocuments({ role: 'both' }),
    Letter.aggregate([
      { $match: { mood: { $exists: true, $ne: '' } } },
      { $group: { _id: '$mood', count: { $sum: 1 } } },
      { $sort:  { count: -1 } },
    ]),
    Notification.countDocuments(),
    Notification.countDocuments({ isRead: false }),
    Notification.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort:  { count: -1 } },
    ]),
    Reply.countDocuments(),
    Reply.countDocuments({ isEnded: true }),
    Reply.countDocuments({ isEnded: true, endedBy: 'seeker' }),
    Reply.countDocuments({ isEnded: true, endedBy: 'listener' }),
    Reply.aggregate([
      { $group: { _id: null, total: { $sum: { $size: '$messages' } } } },
    ]),
    User.aggregate([
      { $match: { heardFrom: { $exists: true, $ne: '' } } },
      { $group: { _id: '$heardFrom', count: { $sum: 1 } } },
      { $sort:  { count: -1 } },
    ]),
    Letter.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: {
        _id:     { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
        letters: { $sum: 1 },
        sent:    { $sum: { $cond: [{ $eq: ['$type', 'sent'] }, 1, 0] } },
      }},
      { $sort: { _id: 1 } },
    ]),
    User.aggregate([
      { $match: { createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ])

  const userTrend = userTrendAgg.map(r => ({ date: r._id, count: r.count }))
  const roles = { seeker: seekerCount, listener: listenerCount, both: bothCount }
  const totalRepliesSent = msgAgg[0]?.total || 0

  // ── Active users + all-time funnel + top listeners (parallel) ───────────────
  const [
    activeUserDistinct,
    allTimeLetters,
    allTimeSent,
    allTimeOpened,
    allTimeClaimed,
    allTimeEmailOpens,
    allTimePlatformOpens,
    topListenersAgg,
  ] = await Promise.all([
    Letter.distinct('userId', { createdAt: { $gte: since } }),
    Letter.countDocuments(),
    Letter.countDocuments({ type: 'sent', status: { $ne: 'scheduled' } }),
    Letter.countDocuments({ type: 'sent', $or: [{ 'openedBy.0': { $exists: true } }, { status: { $in: ['opened', 'clicked'] } }, { clickCount: { $gt: 0 } }] }),
    Letter.countDocuments({ type: 'stranger', $or: [{ isRead: true }, { isClaimed: true }] }),
    Letter.countDocuments({ 'openedBy.sources': 'email' }),
    Letter.countDocuments({ 'openedBy.sources': 'platform' }),
    Reply.aggregate([
      { $group: { _id: '$listenerId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]),
  ])

  const activeUsers   = activeUserDistinct.length
  const inactiveUsers = Math.max(0, totalUsers - activeUsers)

  // ── Per-user letter stats (single aggregation — no N+1) ──────────────────
  const letterAgg = await Letter.aggregate([
    { $group: {
      _id:       '$userId',
      written:   { $sum: 1 },
      sent:      { $sum: { $cond: [{ $and: [{ $eq: ['$type', 'sent'] }, { $ne: ['$status', 'scheduled'] }] }, 1, 0] } },
      opened:    { $sum: { $cond: [{ $or: [{ $gt: [{ $size: { $ifNull: ['$openedBy', []] } }, 0] }, { $in: ['$status', ['opened', 'clicked']] }, { $gt: ['$clickCount', 0] }] }, 1, 0] } },
      scheduled: { $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] } },
      personal:  { $sum: { $cond: [{ $eq: ['$type', 'personal'] }, 1, 0] } },
      stranger:  { $sum: { $cond: [{ $eq: ['$type', 'stranger'] }, 1, 0] } },
      lastActive:{ $max: '$createdAt' },
    }},
    { $sort: { written: -1 } },
    { $limit: 200 },
  ])

  const activityMap = {}
  for (const row of letterAgg) {
    if (row._id) activityMap[row._id.toString()] = row
  }

  // Single query for all users
  const allUsers = await User.find({}, 'name email role authProvider createdAt').lean()

  function mergeUser(u) {
    const stats = activityMap[u._id.toString()] || { written: 0, sent: 0, opened: 0, scheduled: 0, personal: 0, stranger: 0 }
    return {
      id:         u._id,
      name:       u.name || '—',
      email:      u.email,
      role:       u.role || 'both',
      provider:   u.authProvider || 'email',
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

  const userStats = allUsers.map(mergeUser).sort((a, b) => b.written - a.written)

  const userInfoMap = {}
  for (const u of allUsers) userInfoMap[u._id.toString()] = { name: u.name || '—', email: u.email }

  const topListeners = topListenersAgg.map(l => ({
    id:    l._id,
    name:  userInfoMap[l._id?.toString()]?.name  || '—',
    email: userInfoMap[l._id?.toString()]?.email || '—',
    count: l.count,
  }))

  // ── Recent letters ────────────────────────────────────────────────────────
  const recentLetters = await Letter.find({})
    .sort({ createdAt: -1 })
    .limit(20)
    .select('userId type status subject createdAt scheduledFor isScheduled toEmail')
    .lean()

  const userEmailMap = {}
  for (const u of allUsers) userEmailMap[u._id.toString()] = u.email

  const recentLettersOut = recentLetters.map(l => ({
    ...l,
    senderEmail: userEmailMap[l.userId?.toString()] || '—',
  }))

  res.json({
    success: true,
    data: {
      days,
      totalUsers,
      totalEmailUsers,
      totalGoogleUsers,
      newUsers,
      totalLetters,
      sentLetters,
      openedLetters,
      scheduledLetters,
      personalLetters,
      strangerLetters,
      claimedLetters,
      openRate,
      emailConnections,
      roles,
      moods: moodAgg,
      totalNotifs,
      unreadNotifs,
      notifByType: notifTypeAgg,
      activeUsers,
      inactiveUsers,
      letterFunnel: {
        total:   allTimeLetters,
        sent:    allTimeSent,
        opened:  allTimeOpened,
        replied: totalConversations,
        claimed: allTimeClaimed,
      },
      openSources: {
        email:    allTimeEmailOpens,
        platform: allTimePlatformOpens,
      },
      topSenders: userStats.slice(0, 5).map(u => ({ name: u.name, email: u.email, count: u.written })),
      topListeners,
      totalConversations,
      endedConversations,
      endedBySeeker:   endedBySeekerCount,
      endedByListener: endedByListenerCount,
      totalRepliesSent,
      activeConversations: totalConversations - endedConversations,
      sources: sourceAgg,
      letterTrend: letterTrendAgg,
      userTrend,
      userStats,
      recentLetters: recentLettersOut,
    },
  })
}
