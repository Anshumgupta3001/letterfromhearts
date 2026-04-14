import Letter        from '../models/Letter.js'
import EmailAccount   from '../models/EmailAccount.js'
import config         from '../config/index.js'
import { checkContentSafety } from '../utils/moderation.js'
import { generateTrackingId } from '../utils/mailer.js'
import { emailQueue }         from '../queues/emailQueue.js'

// POST /api/schedule-email
//
// Saves the letter with status:'scheduled' and enqueues a Bull job.
// The worker (emailWorker.js) picks it up at the right time and sends it.
export async function scheduleEmail(req, res) {
  const { from, to, subject, message, sendAt, useSystem } = req.body
  const userId = req.user._id

  // ── Validation ────────────────────────────────────────────────────────────
  if (!to?.trim() || !to.includes('@'))
    return res.status(400).json({ success: false, error: 'Valid recipient email is required.' })
  if (!message?.trim())
    return res.status(400).json({ success: false, error: 'Message body is required.' })
  if (!sendAt)
    return res.status(400).json({ success: false, error: 'Schedule time is required.' })

  const scheduledDate = new Date(sendAt)  // sendAt must be a UTC ISO string from the client
  const now           = new Date()
  const delay         = scheduledDate - now
  console.log('[schedule] sendAt received:', sendAt)
  console.log('[schedule] parsedDate (UTC):', scheduledDate.toISOString())
  console.log('[schedule] server now (UTC):', now.toISOString())
  console.log('[schedule] delay (ms):', delay, '→', Math.round(delay / 60000), 'min')
  if (isNaN(delay) || delay <= 0)
    return res.status(400).json({ success: false, error: 'Schedule time must be in the future.' })

  // Max 1 year ahead
  if (delay > 365 * 24 * 60 * 60 * 1000)
    return res.status(400).json({ success: false, error: 'Cannot schedule more than 1 year in advance.' })

  // Content moderation
  try {
    await checkContentSafety(message.trim())
  } catch {
    return res.status(400).json({ success: false, error: 'You have written restricted content. Please revise your message before saving or sending.' })
  }

  // ── Resolve sender ────────────────────────────────────────────────────────
  let useSystemFinal    = Boolean(useSystem)
  let fromEmailAddress  = null   // only set for custom accounts

  if (!useSystemFinal && from?.trim()) {
    const account = await EmailAccount.findOne({
      userId,
      emailAddress: from.toLowerCase().trim(),
    })
    if (account?.smtp?.password) {
      fromEmailAddress = account.emailAddress
    } else {
      useSystemFinal = true
    }
  } else {
    useSystemFinal = true
  }

  if (useSystemFinal && (!config.systemEmail || !config.systemEmailPass)) {
    return res.status(500).json({ success: false, error: 'System email is not configured on this server.' })
  }

  // ── Create Letter (status: scheduled) ────────────────────────────────────
  const trackingId  = generateTrackingId(userId.toString())
  const subjectLine = subject?.trim() || 'A letter from my heart 💌'
  const fromEmail   = useSystemFinal ? config.systemEmail : fromEmailAddress

  const letter = await Letter.create({
    userId,
    type:         'sent',
    fromEmail,
    toEmail:      to.trim(),
    subject:      subjectLine,
    message:      message.trim(),
    trackingId,
    status:       'scheduled',
    isScheduled:  true,
    scheduledFor: scheduledDate,
  })

  // ── Enqueue job ───────────────────────────────────────────────────────────
  await emailQueue.add(
    {
      letterId:         letter._id.toString(),
      userId:           userId.toString(),
      useSystem:        useSystemFinal,
      fromEmailAddress: fromEmailAddress || null,
      to:               to.trim(),
      subject:          subjectLine,
      message:          message.trim(),
      trackingId,
    },
    {
      delay,
      attempts:  3,
      backoff:   { type: 'exponential', delay: 60_000 },
      removeOnComplete: true,
    }
  )

  res.json({
    success:      true,
    letterId:     letter._id,
    scheduledFor: scheduledDate,
  })
}
