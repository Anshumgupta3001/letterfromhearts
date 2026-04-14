import Reply  from '../models/Reply.js'
import Letter from '../models/Letter.js'
import { checkContentSafety } from '../utils/moderation.js'

// POST /api/replies
// Listener sends a reply to a stranger letter they have claimed.
export async function createReply(req, res) {
  const { parentLetterId, message } = req.body
  const userId = req.user._id
  const role   = req.user.role || 'both'

  // Seekers cannot reply (they are the ones who wrote the letter)
  if (role === 'seeker') {
    return res.status(403).json({ error: 'Only listeners can reply to stranger letters.' })
  }

  if (!parentLetterId)    return res.status(400).json({ error: 'parentLetterId is required.' })
  if (!message?.trim())   return res.status(400).json({ error: 'Reply message cannot be empty.' })
  if (message.trim().length > 3000)
    return res.status(400).json({ error: 'Reply must be under 3000 characters.' })

  // Verify the letter exists and is a stranger letter
  const letter = await Letter.findById(parentLetterId)
  if (!letter) return res.status(404).json({ error: 'Letter not found.' })
  if (letter.type !== 'stranger') {
    return res.status(400).json({ error: 'Replies are only supported for Caring Stranger letters.' })
  }

  // Verify this listener actually claimed the letter
  const claimedByThis =
    (letter.claimedBy?.userId && letter.claimedBy.userId.toString() === userId.toString()) ||
    (letter.readBy || []).some(id => id.toString() === userId.toString())

  if (!claimedByThis) {
    return res.status(403).json({ error: 'You can only reply to letters you have claimed.' })
  }

  // One reply per listener per letter (enforced by DB index + explicit check for clean error)
  const existing = await Reply.findOne({ parentLetterId, listenerId: userId })
  if (existing) {
    return res.status(409).json({ error: 'You have already replied to this letter.' })
  }

  // Content moderation
  try {
    await checkContentSafety(message.trim())
  } catch {
    return res.status(400).json({ error: 'Your reply contains restricted content. Please revise it.' })
  }

  const reply = await Reply.create({
    parentLetterId,
    listenerId: userId,
    message:    message.trim(),
  })

  res.status(201).json({ success: true, data: reply })
}

// GET /api/replies/my?parentLetterId=:id
// Returns the authenticated listener's own reply for a specific letter.
export async function getMyReply(req, res) {
  const { parentLetterId } = req.query
  if (!parentLetterId) return res.status(400).json({ error: 'parentLetterId is required.' })

  const reply = await Reply.findOne({ parentLetterId, listenerId: req.user._id }).lean()
  res.json({ success: true, data: reply || null })
}
