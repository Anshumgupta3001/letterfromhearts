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

// GET /api/admin/known-connections?key=xxx&page=1&limit=50&search=xxx&accountFilter=all|with_account|no_account
// Returns all "Someone I Know" (type:'sent') letters with sender + recipient account status.
// accountFilter is applied server-side before pagination so page counts stay correct.
// Summary counts are always all-time, independent of search/filter.
export async function getAdminKnownConnections(req, res) {
  const page          = Math.max(1, parseInt(req.query.page)  || 1)
  const limit         = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50))
  const skip          = (page - 1) * limit
  const search        = (req.query.search || '').trim()
  const accountFilter = ['with_account', 'no_account'].includes(req.query.accountFilter)
    ? req.query.accountFilter : 'all'

  // Base: all delivered "Someone I Know" letters (exclude still-queued scheduled ones)
  const baseFilter = { type: 'sent', status: { $ne: 'scheduled' } }
  let filter = { ...baseFilter }

  // ── Account-existence filter — must be computed before pagination ─────────
  // Strategy: get all distinct toEmails → check which have accounts →
  // build an $in/$nin list and push it into the Mongo filter.
  // This keeps pagination row counts correct (not possible to do this post-hoc).
  if (accountFilter !== 'all') {
    const allToEmails = await Letter.distinct('toEmail', baseFilter)
    const validEmails = allToEmails.filter(Boolean)
    // Lowercase for User lookup; keep a map back to original casing for the $in filter
    const lcToOrigMap = {}
    for (const e of validEmails) lcToOrigMap[e.toLowerCase()] = e

    const lcEmails    = Object.keys(lcToOrigMap)
    const usersFound  = lcEmails.length > 0
      ? await User.find({ email: { $in: lcEmails } }, 'email').lean()
      : []
    const lcWithAcct  = new Set(usersFound.map(u => u.email.toLowerCase()))

    if (accountFilter === 'with_account') {
      const matchEmails = validEmails.filter(e => lcWithAcct.has(e.toLowerCase()))
      if (matchEmails.length === 0) {
        // No recipients with accounts — short-circuit with empty result
        const allRecipEmails2 = await Letter.distinct('toEmail', baseFilter)
        const uq2             = [...new Set(allRecipEmails2.filter(Boolean).map(e => e.toLowerCase()))]
        const [tc2, wac2]     = await Promise.all([
          Letter.countDocuments(baseFilter),
          uq2.length > 0 ? User.countDocuments({ email: { $in: uq2 } }) : Promise.resolve(0),
        ])
        return res.json({
          success: true, data: [], total: 0, page: 1, pages: 0,
          summary: { totalConnections: tc2, uniqueRecipients: uq2.length, withAccount: wac2, withoutAccount: Math.max(0, uq2.length - wac2), conversionRate: uq2.length > 0 ? Math.round((wac2 / uq2.length) * 100) : 0 },
        })
      }
      filter.toEmail = { $in: matchEmails }
    } else {
      // no_account
      const noAcctEmails = validEmails.filter(e => !lcWithAcct.has(e.toLowerCase()))
      if (noAcctEmails.length === 0) {
        const allRecipEmails2 = await Letter.distinct('toEmail', baseFilter)
        const uq2             = [...new Set(allRecipEmails2.filter(Boolean).map(e => e.toLowerCase()))]
        const [tc2, wac2]     = await Promise.all([
          Letter.countDocuments(baseFilter),
          uq2.length > 0 ? User.countDocuments({ email: { $in: uq2 } }) : Promise.resolve(0),
        ])
        return res.json({
          success: true, data: [], total: 0, page: 1, pages: 0,
          summary: { totalConnections: tc2, uniqueRecipients: uq2.length, withAccount: wac2, withoutAccount: Math.max(0, uq2.length - wac2), conversionRate: uq2.length > 0 ? Math.round((wac2 / uq2.length) * 100) : 0 },
        })
      }
      filter.toEmail = { $in: noAcctEmails }
    }
  }

  // ── Text search (combines with accountFilter via AND) ─────────────────────
  if (search) {
    const senderMatches = await User.distinct('_id', {
      $or: [
        { name:  { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ],
    })
    const searchOr = [
      { toEmail: { $regex: search, $options: 'i' } },
      ...(senderMatches.length > 0 ? [{ userId: { $in: senderMatches } }] : []),
    ]
    // If an accountFilter toEmail constraint already exists, AND it with the search
    if (filter.toEmail) {
      filter.$and = [{ toEmail: filter.toEmail }, { $or: searchOr }]
      delete filter.toEmail
    } else {
      filter.$or = searchOr
    }
  }

  const [letters, total] = await Promise.all([
    Letter.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('userId toEmail fromEmail subject createdAt status')
      .lean(),
    Letter.countDocuments(filter),
  ])

  // Batch-resolve sender info
  const senderIds = [...new Set(letters.map(l => l.userId?.toString()).filter(Boolean))]
  const senders   = await User.find({ _id: { $in: senderIds } }, 'name email').lean()
  const senderMap = {}
  for (const u of senders) senderMap[u._id.toString()] = { name: u.name || '—', email: u.email }

  // Batch-check which recipient emails have registered accounts
  const recipientEmails = [...new Set(letters.map(l => (l.toEmail || '').toLowerCase()).filter(Boolean))]
  const existingRecipients = recipientEmails.length > 0
    ? await User.find({ email: { $in: recipientEmails } }, 'email authProvider').lean()
    : []
  const recipientMap = {}
  for (const u of existingRecipients) {
    if (u.email) recipientMap[u.email.toLowerCase()] = {
      exists: true, userId: u._id, accountType: u.authProvider || 'email',
    }
  }

  // All-time summary (ignores current search/page filter)
  const allRecipientEmails = await Letter.distinct('toEmail', baseFilter)
  const uniqueEmails       = [...new Set(allRecipientEmails.filter(Boolean).map(e => e.toLowerCase()))]
  const [totalCount, withAccountCount] = await Promise.all([
    Letter.countDocuments(baseFilter),
    uniqueEmails.length > 0 ? User.countDocuments({ email: { $in: uniqueEmails } }) : Promise.resolve(0),
  ])
  const conversionRate = uniqueEmails.length > 0
    ? Math.round((withAccountCount / uniqueEmails.length) * 100)
    : 0

  const out = letters.map(l => {
    const re = (l.toEmail || '').toLowerCase()
    const rc = recipientMap[re] || { exists: false, userId: null, accountType: null }
    const sn = senderMap[l.userId?.toString()] || { name: '—', email: l.fromEmail || '—' }
    return {
      letterId:             l._id,
      senderName:           sn.name,
      senderEmail:          sn.email,
      recipientEmail:       l.toEmail || '—',
      subject:              l.subject || '—',
      status:               l.status,
      createdAt:            l.createdAt,
      recipientExists:      rc.exists,
      recipientUserId:      rc.userId       || null,
      recipientAccountType: rc.accountType  || null,
    }
  })

  res.json({
    success: true,
    data:    out,
    total,
    page,
    pages:   Math.ceil(total / limit),
    summary: {
      totalConnections: totalCount,
      uniqueRecipients: uniqueEmails.length,
      withAccount:      withAccountCount,
      withoutAccount:   Math.max(0, uniqueEmails.length - withAccountCount),
      conversionRate,
    },
  })
}

// GET /api/admin/letters?key=xxx&page=1&limit=50&search=xxx&type=xxx
export async function getAdminLetters(req, res) {
  const page  = Math.max(1, parseInt(req.query.page)  || 1)
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50))
  const skip  = (page - 1) * limit
  const search = (req.query.search || '').trim()
  const type   = req.query.type || ''

  const filter = {}
  if (type && ['sent', 'personal', 'stranger'].includes(type)) filter.type = type

  // Text search across subject and message
  if (search) {
    filter.$or = [
      { subject:  { $regex: search, $options: 'i' } },
      { message:  { $regex: search, $options: 'i' } },
      { toEmail:  { $regex: search, $options: 'i' } },
      { fromEmail:{ $regex: search, $options: 'i' } },
    ]
  }

  const [letters, total] = await Promise.all([
    Letter.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('userId fromEmail toEmail subject message type status createdAt trackingId openedAt clickCount')
      .lean(),
    Letter.countDocuments(filter),
  ])

  // Resolve sender names in one query
  const userIds = [...new Set(letters.map(l => l.userId?.toString()).filter(Boolean))]
  const users   = await User.find({ _id: { $in: userIds } }, 'name email').lean()
  const userMap = {}
  for (const u of users) userMap[u._id.toString()] = { name: u.name || '—', email: u.email }

  const out = letters.map(l => ({
    ...l,
    senderName:  userMap[l.userId?.toString()]?.name  || '—',
    senderEmail: userMap[l.userId?.toString()]?.email || l.fromEmail || '—',
  }))

  res.json({ success: true, data: out, total, page, pages: Math.ceil(total / limit) })
}
