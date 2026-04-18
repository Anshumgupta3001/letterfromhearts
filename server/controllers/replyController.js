import Reply  from '../models/Reply.js'
import Letter from '../models/Letter.js'
import { checkContentSafety } from '../utils/moderation.js'
import { createNotification } from './notificationController.js'

const MAX_MESSAGES = 10

// POST /api/replies/message
// Send a message in a conversation.
// Supports two letter types:
//   type:'stranger' — listener must have claimed the letter; seeker replies once started.
//   type:'sent'     — recipient (matched by toEmail) starts; sender replies once started.
export async function sendMessage(req, res) {
  const { parentLetterId, content } = req.body
  const userId    = req.user._id
  const userEmail = req.user.email?.toLowerCase()

  if (!parentLetterId)  return res.status(400).json({ error: 'parentLetterId is required.' })
  if (!content?.trim()) return res.status(400).json({ error: 'Message cannot be empty.' })
  if (content.trim().length > 1000)
    return res.status(400).json({ error: 'Message must be under 1000 characters.' })

  const letter = await Letter.findById(parentLetterId)
  if (!letter) return res.status(404).json({ error: 'Letter not found.' })
  if (letter.type !== 'stranger' && letter.type !== 'sent')
    return res.status(400).json({ error: 'Only Caring Stranger or known letters support conversations.' })

  const isLetterOwner = letter.userId.toString() === userId.toString()

  let conv
  if (isLetterOwner) {
    // Writer replying — find the existing conversation on their letter
    conv = await Reply.findOne({ parentLetterId })
    if (!conv) {
      return res.status(404).json({ error: 'No conversation started yet. The other person must write first.' })
    }
  } else if (letter.type === 'sent') {
    // Known letter: validate the sender is the actual email recipient
    if (!userEmail || userEmail !== letter.toEmail?.toLowerCase()) {
      return res.status(403).json({ error: 'You are not the recipient of this letter.' })
    }
    // Find or create conversation for this recipient
    conv = await Reply.findOne({ parentLetterId, listenerId: userId })
    if (!conv) conv = new Reply({ parentLetterId, listenerId: userId, messages: [] })
  } else {
    // Stranger letter: listener must have claimed it
    const claimed =
      (letter.claimedBy?.userId && letter.claimedBy.userId.toString() === userId.toString()) ||
      (letter.readBy || []).some(id => id.toString() === userId.toString())

    if (!claimed) {
      return res.status(403).json({ error: 'You can only message in letters you have claimed.' })
    }

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

  try {
    const senderDisplay = userEmail || 'Someone'
    if (isLetterOwner) {
      // Writer replied back → notify the other person (listener/recipient)
      if (conv.listenerId.toString() !== userId.toString()) {
        const notifMessage = letter.type === 'sent'
          ? `The letter writer replied to you 💬`
          : 'The letter writer replied to you 💬'
        await createNotification({
          userId:   conv.listenerId,
          senderId: userId,
          letterId: letter._id,
          message:  notifMessage,
          type:     'reply',
          link:     `/letters/${letter._id}`,
        })
      }
    } else if (isFirstMessage) {
      // Recipient / listener's first message → notify the writer
      if (letter.userId.toString() !== userId.toString()) {
        const notifMessage = letter.type === 'sent'
          ? `${senderDisplay} replied to your letter 💬`
          : 'You received a reply to your letter 💬'
        await createNotification({
          userId:   letter.userId,
          senderId: userId,
          letterId: letter._id,
          message:  notifMessage,
          type:     'reply',
          link:     `/letters/${letter._id}`,
        })
      }
    }
  } catch (err) {
    console.error('[Notification] trigger failed:', err.message)
  }

  res.status(201).json({ success: true, data: conv })
}

// POST /api/replies/end
// End the conversation. Both parties can close it.
// Works for type:'stranger' and type:'sent' letters.
export async function endConversation(req, res) {
  const { parentLetterId } = req.body
  const userId    = req.user._id
  const userEmail = req.user.email?.toLowerCase()

  if (!parentLetterId) return res.status(400).json({ error: 'parentLetterId is required.' })

  const letter = await Letter.findById(parentLetterId)
  if (!letter) return res.status(404).json({ error: 'Letter not found.' })

  const isWriter = letter.userId.toString() === userId.toString()

  // For known letters: also allow recipient to end (they act as 'listener')
  const isKnownRecipient = !isWriter
    && letter.type === 'sent'
    && userEmail
    && userEmail === letter.toEmail?.toLowerCase()

  if (!isWriter && !isKnownRecipient) {
    // Stranger letter: listener closes their own conv
    const conv = await Reply.findOne({ parentLetterId, listenerId: userId })
    if (!conv) return res.status(404).json({ error: 'Conversation not found.' })
    if (conv.isEnded) return res.json({ success: true, data: conv })
    conv.isEnded = true
    conv.endedBy = 'listener'
    await conv.save()
    return res.json({ success: true, data: conv })
  }

  const conv = isWriter
    ? await Reply.findOne({ parentLetterId })           // writer sees the one conversation
    : await Reply.findOne({ parentLetterId, listenerId: userId })

  if (!conv) return res.status(404).json({ error: 'Conversation not found.' })
  if (conv.isEnded) return res.json({ success: true, data: conv })  // idempotent

  conv.isEnded = true
  conv.endedBy = isWriter ? 'seeker' : 'listener'
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
