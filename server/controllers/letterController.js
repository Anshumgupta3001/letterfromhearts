import Letter from '../models/Letter.js'
import Reply  from '../models/Reply.js'
import { checkContentSafety } from '../utils/moderation.js'
import { createNotification } from './notificationController.js'

// GET /api/letters?type=personal|sent|stranger  — current user's letters, filtered by type
export async function getLetters(req, res) {
  const filter = { userId: req.user._id }
  if (req.query.type) filter.type = req.query.type

  const letters = await Letter.find(filter).sort({ createdAt: -1 })

  // For stranger letters, attach reply count so the seeker can see how many replies they got
  if (req.query.type === 'stranger' && letters.length > 0) {
    const ids      = letters.map(l => l._id)
    const counts   = await Reply.aggregate([
      { $match: { parentLetterId: { $in: ids }, 'messages.0': { $exists: true } } },
      { $group: { _id: '$parentLetterId', count: { $sum: 1 } } },
    ])
    const countMap = {}
    for (const row of counts) countMap[row._id.toString()] = row.count

    const data = letters.map(l => ({
      ...l.toObject(),
      replyCount: countMap[l._id.toString()] || 0,
    }))
    return res.json({ success: true, data })
  }

  res.json({ success: true, data: letters })
}

// GET /api/letters/stranger-feed  — community feed for listeners/both
// - Seeker role: returns empty (they can't read the feed)
// - Listener/Both: returns unread letters OR letters already read by this user
// - Both role: also filters out own letters
export async function getStrangerFeed(req, res) {
  const userId = req.user._id
  const role   = req.user.role || 'both'

  // Seekers cannot read the stranger feed
  if (role === 'seeker') {
    return res.json({ success: true, data: [] })
  }

  // Fetch: unclaimed letters OR letters this user has already claimed
  // Supports both legacy (isRead/readBy) and new (isClaimed/claimedBy) fields.
  const letters = await Letter.find({
    type: 'stranger',
    $or: [
      // Unclaimed (neither legacy nor new claim flag set)
      { isRead: false, isClaimed: { $ne: true } },
      // Claimed by this specific user (new field)
      { 'claimedBy.userId': userId },
      // Claimed by this specific user (legacy field — existing data)
      { readBy: userId },
    ],
  })
    .sort({ createdAt: -1 })
    .select('-fromEmail -toEmail')

  const baseData = letters
    .map(l => {
      const obj     = l.toObject()
      const hasRead = (l.readBy || []).some(id => id.toString() === userId.toString())
        || (l.claimedBy?.userId && l.claimedBy.userId.toString() === userId.toString())
      delete obj.readBy      // never expose the full read list
      delete obj.claimedBy   // never expose who claimed it to others
      return {
        ...obj,
        isOwner: l.userId.toString() === userId.toString(),
        hasRead,
      }
    })
    // 'both' role cannot see their own stranger letters in the feed
    .filter(l => role !== 'both' || !l.isOwner)

  // For letters this listener has claimed, add hasReplied flag
  const heldIds = baseData.filter(l => l.hasRead).map(l => l._id)
  let repliedSet = new Set()
  if (heldIds.length > 0) {
    const myReplies = await Reply.find(
      { parentLetterId: { $in: heldIds }, listenerId: userId, 'messages.0': { $exists: true } },
      'parentLetterId'
    ).lean()
    repliedSet = new Set(myReplies.map(r => r.parentLetterId.toString()))
  }

  const data = baseData.map(l => ({
    ...l,
    hasReplied: repliedSet.has(l._id.toString()),
  }))

  res.json({ success: true, data })
}

// GET /api/letters/:id
// Owner can always access. A listener who claimed a stranger letter can also access it.
export async function getLetterById(req, res) {
  const userId = req.user._id
  const letter = await Letter.findOne({
    _id: req.params.id,
    $or: [
      { userId },                             // owner
      { 'claimedBy.userId': userId },         // listener who claimed it (new field)
      { readBy: userId },                     // listener who claimed it (legacy field)
    ],
  }).select('-claimedBy -readBy')             // never expose claim metadata

  if (!letter) return res.status(404).json({ error: 'Letter not found.' })
  res.json({ success: true, data: letter })
}

// POST /api/letters  — save a personal or stranger letter
export async function createLetter(req, res) {
  const { type, subject, message, mood } = req.body
  const role = req.user.role || 'both'

  // Listeners cannot write stranger letters
  if (type === 'stranger' && role === 'listener') {
    return res.status(403).json({ error: 'Listeners cannot write Caring Stranger letters.' })
  }

  const allowedTypes = ['personal', 'stranger']
  const letterType   = allowedTypes.includes(type) ? type : 'personal'

  if (!message?.trim()) return res.status(400).json({ error: 'Message cannot be empty.' })

  try {
    await checkContentSafety(message.trim())
  } catch {
    return res.status(400).json({ success: false, error: 'You have written restricted content. Please revise your message before saving or sending.' })
  }

  const defaults = {
    personal: { subject: 'A personal letter',      status: 'saved' },
    stranger: { subject: 'A letter from my heart', status: 'saved' },
  }

  const letter = await Letter.create({
    userId:  req.user._id,
    type:    letterType,
    subject: subject?.trim() || defaults[letterType].subject,
    message: message.trim(),
    status:  defaults[letterType].status,
    mood:    mood?.trim() || '',
  })

  res.status(201).json({ success: true, data: letter })
}

// POST /api/letters/:id/read  — one-time global claim
// First listener to open claims the letter; it disappears from everyone else's feed.
// The claiming listener can always reopen it.
export async function markLetterRead(req, res) {
  const userId = req.user._id
  const letter = await Letter.findById(req.params.id)

  if (!letter) return res.status(404).json({ error: 'Letter not found.' })
  if (letter.type !== 'stranger') return res.status(400).json({ error: 'Only stranger letters support read tracking.' })

  const alreadyReadByUser = (letter.readBy || []).some(id => id.toString() === userId.toString())

  // Already claimed by this exact user — idempotent success (let them reopen)
  if (alreadyReadByUser) {
    return res.json({ success: true, alreadyRead: true })
  }

  // Claimed by a different listener — unavailable
  if (letter.isRead || letter.isClaimed) {
    const claimedByOther =
      letter.claimedBy?.userId && letter.claimedBy.userId.toString() !== userId.toString()
    if (claimedByOther || (!alreadyReadByUser && letter.isRead)) {
      return res.status(403).json({
        error: 'This letter has already been claimed by another listener.',
        alreadyRead: true,
      })
    }
  }

  const now = new Date()

  // Claim: set both legacy fields (isRead / readBy) and new fields (isClaimed / claimedBy / readCount)
  letter.isRead   = true
  letter.readBy.push(userId)
  letter.isClaimed  = true
  letter.claimedBy  = { userId, claimedAt: now }
  letter.readCount  = (letter.readCount || 0) + 1
  await letter.save()

  // Notify the letter owner that someone opened their letter.
  // Guard: never notify if the claimer IS the owner.
  // dedup:true ensures reopening the same letter never fires a second notification.
  console.log(`[Notification] claim check — letterOwner:${letter.userId} claimer:${userId} same:${letter.userId.toString() === userId.toString()}`)
  if (letter.userId.toString() !== userId.toString()) {
    try {
      await createNotification({
        userId:    letter.userId,
        senderId:  userId,
        letterId:  letter._id,
        message:   'Someone opened your letter 💌',
        type:      'claim',
        link:      `/letters/${letter._id}`,
        dedup:     true,
      })
    } catch (err) {
      console.error('[Notification] claim trigger failed:', err.message)
    }
  }

  res.json({ success: true })
}

// PUT /api/letters/:id  — edit own PERSONAL letters only
export async function updateLetter(req, res) {
  const { subject, message } = req.body

  if (!message?.trim()) return res.status(400).json({ error: 'Message cannot be empty.' })

  try {
    await checkContentSafety(message.trim())
  } catch {
    return res.status(400).json({ success: false, error: 'You have written restricted content. Please revise your message before saving or sending.' })
  }

  // Only allow editing personal letters
  const letter = await Letter.findOne({ _id: req.params.id, userId: req.user._id })
  if (!letter) return res.status(404).json({ error: 'Letter not found.' })
  if (letter.type !== 'personal') return res.status(403).json({ error: 'Only personal letters can be edited.' })

  letter.subject = subject?.trim() || 'A personal letter'
  letter.message = message.trim()
  await letter.save()

  res.json({ success: true, data: letter })
}

// GET /api/letters/:id/replies  — letter owner fetches all replies to their stranger letter
export async function getLetterReplies(req, res) {
  const userId = req.user._id

  // Allow access to both the letter owner (seeker) and the listener who has the conversation
  const letter = await Letter.findOne({
    _id: req.params.id,
    $or: [
      { userId },
      { 'claimedBy.userId': userId },
      { readBy: userId },
    ],
  })
  if (!letter) return res.status(404).json({ error: 'Letter not found.' })
  if (letter.type !== 'stranger')
    return res.status(400).json({ error: 'Replies are only available for Caring Stranger letters.' })

  const isOwner = letter.userId.toString() === userId.toString()

  if (isOwner) {
    // Seeker: return all conversations on their letter, each with its messages + isEnded
    const conversations = await Reply.find({ parentLetterId: letter._id })
      .sort({ createdAt: 1 })
      .lean()
    return res.json({ success: true, data: conversations })
  } else {
    // Listener: return only their own conversation
    const conv = await Reply.findOne({ parentLetterId: letter._id, listenerId: userId }).lean()
    return res.json({ success: true, data: conv ? [conv] : [] })
  }
}

// GET /api/letters/analytics?days=7|15|30
// Returns aggregate stats for the requesting user, filtered by date window.
export async function getAnalytics(req, res) {
  const userId = req.user._id
  const days   = Math.min(Math.max(Number(req.query.days) || 30, 1), 365)

  const since = new Date()
  since.setDate(since.getDate() - days)

  const base = { userId, createdAt: { $gte: since } }

  const [
    totalWritten,
    totalSent,
    totalOpened,
    totalPersonal,
    totalStranger,
    claimedLetters,
    totalScheduled,
  ] = await Promise.all([
    Letter.countDocuments(base),
    // Exclude letters still waiting to be delivered (status:'scheduled')
    Letter.countDocuments({ ...base, type: 'sent', status: { $ne: 'scheduled' } }),
    // "Opened" = opened OR clicked
    Letter.countDocuments({ ...base, type: 'sent', $or: [{ status: { $in: ['opened', 'clicked'] } }, { clickCount: { $gt: 0 } }] }),
    Letter.countDocuments({ ...base, type: 'personal' }),
    Letter.countDocuments({ ...base, type: 'stranger' }),
    // Stranger letters this user WROTE that were claimed by a listener
    Letter.countDocuments({ ...base, type: 'stranger', $or: [{ isRead: true }, { isClaimed: true }] }),
    // Currently queued / awaiting delivery
    Letter.countDocuments({ ...base, type: 'sent', status: 'scheduled' }),
  ])

  const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0

  // Count replies received on this user's stranger letters (separate from the parallel block
  // because it depends on knowing the user's stranger letter IDs first)
  const myStrangerIds   = await Letter.distinct('_id', { userId, type: 'stranger' })
  const repliesReceived = myStrangerIds.length > 0
    ? await Reply.countDocuments({ parentLetterId: { $in: myStrangerIds } })
    : 0

  res.json({
    success: true,
    data: {
      days,
      totalWritten,
      totalSent,
      totalOpened,
      totalPersonal,
      totalStranger,
      claimedLetters,
      totalScheduled,
      openRate,
      repliesReceived,
    },
  })
}

// DELETE /api/letters/:id  — owner only, personal letters only
export async function deleteLetter(req, res) {
  const letter = await Letter.findOne({ _id: req.params.id, userId: req.user._id })
  if (!letter) return res.status(404).json({ error: 'Letter not found.' })
  if (letter.type !== 'personal') return res.status(403).json({ error: 'Only personal letters can be deleted.' })

  await letter.deleteOne()
  res.json({ success: true })
}
