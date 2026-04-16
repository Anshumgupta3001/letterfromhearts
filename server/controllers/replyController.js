import Reply  from '../models/Reply.js'
import Letter from '../models/Letter.js'
import { checkContentSafety } from '../utils/moderation.js'
import { createNotification } from './notificationController.js'

const MAX_MESSAGES = 10

// POST /api/replies/message
// Send a message in a conversation.
// - Listener: must have claimed the letter; creates conversation on first message.
// - Seeker (letter owner): can reply once a listener has started the conversation.
export async function sendMessage(req, res) {
  const { parentLetterId, content } = req.body
  const userId = req.user._id

  if (!parentLetterId)  return res.status(400).json({ error: 'parentLetterId is required.' })
  if (!content?.trim()) return res.status(400).json({ error: 'Message cannot be empty.' })
  if (content.trim().length > 1000)
    return res.status(400).json({ error: 'Message must be under 1000 characters.' })

  const letter = await Letter.findById(parentLetterId)
  if (!letter) return res.status(404).json({ error: 'Letter not found.' })
  if (letter.type !== 'stranger')
    return res.status(400).json({ error: 'Only Caring Stranger letters support conversations.' })

  const isLetterOwner = letter.userId.toString() === userId.toString()

  let conv
  if (isLetterOwner) {
    // Seeker replying — find the existing conversation on their letter
    conv = await Reply.findOne({ parentLetterId })
    if (!conv) {
      return res.status(404).json({ error: 'No conversation started yet. A listener must write first.' })
    }
  } else {
    // Listener sending — verify they claimed the letter
    const claimed =
      (letter.claimedBy?.userId && letter.claimedBy.userId.toString() === userId.toString()) ||
      (letter.readBy || []).some(id => id.toString() === userId.toString())

    if (!claimed) {
      return res.status(403).json({ error: 'You can only message in letters you have claimed.' })
    }

    // Find or create conversation for this listener
    conv = await Reply.findOne({ parentLetterId, listenerId: userId })
    if (!conv) conv = new Reply({ parentLetterId, listenerId: userId, messages: [] })
  }

  if (conv.isEnded) {
    return res.status(400).json({ error: 'This conversation has ended.' })
  }
  if (conv.messages.length >= MAX_MESSAGES) {
    return res.status(400).json({ error: `Maximum ${MAX_MESSAGES} messages per conversation.` })
  }

  try {
    await checkContentSafety(content.trim())
  } catch {
    return res.status(400).json({ error: 'Your message contains restricted content. Please revise it.' })
  }

  const isFirstMessage = conv.messages.length === 0
  conv.messages.push({ sender: userId, content: content.trim(), createdAt: new Date() })
  await conv.save()

  // Await notification so it's in DB before response is sent.
  // reply notifications are NOT deduped — every new message deserves a ping.
  console.log(`[Notification] reply check — isLetterOwner:${isLetterOwner} isFirstMessage:${isFirstMessage} letterOwner:${letter.userId} sender:${userId}`)
  try {
    if (isLetterOwner) {
      // Seeker replied back → notify the listener
      if (conv.listenerId.toString() !== userId.toString()) {
        await createNotification({
          userId:   conv.listenerId,
          senderId: userId,
          letterId: letter._id,
          message:  'The letter writer replied to you 💬',
          type:     'reply',
          link:     `/letters/${letter._id}`,
        })
      }
    } else if (isFirstMessage) {
      // Listener's first message → notify the letter owner (seeker), once per conversation
      if (letter.userId.toString() !== userId.toString()) {
        await createNotification({
          userId:   letter.userId,
          senderId: userId,
          letterId: letter._id,
          message:  'You received a reply to your letter 💬',
          type:     'reply',
          link:     `/letters/${letter._id}`,
        })
      }
    }
  } catch (err) {
    console.error('[Notification] trigger failed:', err.message)
    // Notification failure must never block the message response
  }

  res.status(201).json({ success: true, data: conv })
}

// POST /api/replies/end
// End the conversation. Only the listener (conversation owner) can do this.
export async function endConversation(req, res) {
  const { parentLetterId } = req.body
  const userId = req.user._id

  if (!parentLetterId) return res.status(400).json({ error: 'parentLetterId is required.' })

  const conv = await Reply.findOne({ parentLetterId, listenerId: userId })
  if (!conv) return res.status(404).json({ error: 'Conversation not found.' })
  if (conv.isEnded) return res.json({ success: true, data: conv }) // idempotent

  conv.isEnded = true
  await conv.save()

  res.json({ success: true, data: conv })
}

// GET /api/replies/my?parentLetterId=:id
// Returns the authenticated listener's conversation for a specific letter (or null).
export async function getMyReply(req, res) {
  const { parentLetterId } = req.query
  if (!parentLetterId) return res.status(400).json({ error: 'parentLetterId is required.' })

  const conv = await Reply.findOne({ parentLetterId, listenerId: req.user._id }).lean()
  res.json({ success: true, data: conv || null })
}
