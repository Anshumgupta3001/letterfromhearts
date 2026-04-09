import Letter from '../models/Letter.js'
import { checkContentSafety } from '../utils/moderation.js'

// GET /api/letters?type=personal|sent|stranger  — current user's letters, filtered by type
export async function getLetters(req, res) {
  const filter = { userId: req.user._id }
  if (req.query.type) filter.type = req.query.type

  const letters = await Letter.find(filter).sort({ createdAt: -1 })
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

  const data = letters
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
        // isClaimed is safe to expose — it's a boolean, no PII
      }
    })
    // 'both' role cannot see their own stranger letters in the feed
    .filter(l => role !== 'both' || !l.isOwner)

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
  ] = await Promise.all([
    Letter.countDocuments(base),
    Letter.countDocuments({ ...base, type: 'sent' }),
    Letter.countDocuments({ ...base, type: 'sent', status: { $in: ['opened', 'clicked'] } }),
    Letter.countDocuments({ ...base, type: 'personal' }),
    Letter.countDocuments({ ...base, type: 'stranger' }),
    // Stranger letters this user WROTE that were claimed by a listener
    Letter.countDocuments({ ...base, type: 'stranger', $or: [{ isRead: true }, { isClaimed: true }] }),
  ])

  const openRate = totalSent > 0 ? Math.round((totalOpened / totalSent) * 100) : 0

  res.json({
    success: true,
    data: {
      days,
      totalWritten,
      totalSent,
      totalOpened,
      totalPersonal,
      totalStranger,
      claimedLetters,  // stranger letters the seeker wrote that got claimed
      openRate,
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
