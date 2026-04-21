import nodemailer from 'nodemailer'
import EmailAccount from '../models/EmailAccount.js'
import Letter from '../models/Letter.js'
import User from '../models/User.js'
import config from '../config/index.js'
import { decrypt } from './emailAccountController.js'
import { checkContentSafety } from '../utils/moderation.js'
import { createNotification } from './notificationController.js'
import {
  generateTrackingId,
  buildEmailHtml,
  buildEmailText,
  sendViaResend,
} from '../utils/mailer.js'

// ── Main handler ──────────────────────────────────────────────────────────────
// POST /api/send-email
//
// Logic:
//   1. If useSystem=true  → always use system SMTP (no account needed)
//   2. If useSystem=false AND user has a valid connected account for `from` → use it
//   3. If useSystem=false AND no valid account found → silently fall back to system SMTP
//   4. If system SMTP is also not configured → return 500
//
// The user is NEVER blocked from sending.
export async function sendEmail(req, res) {
  const { from, to, subject, message, useSystem, replyTo } = req.body
  const userId = req.user._id

  if (!to?.trim() || !to.includes('@')) return res.status(400).json({ error: 'Valid recipient email is required.' })
  if (!message?.trim())                 return res.status(400).json({ error: 'Message body is required.' })

  try {
    await checkContentSafety(message.trim())
  } catch {
    return res.status(400).json({ success: false, error: 'You have written restricted content. Please revise your message before saving or sending.' })
  }

  const trackingId = generateTrackingId(userId.toString())
  const html       = buildEmailHtml(message.trim(), trackingId, to.trim())
  const text       = buildEmailText(message.trim())

  let transporter, fromEmail
  let resendEmailId = null

  // ── Decide which transport to use ────────────────────────────────────────
  let useSystemFinal = Boolean(useSystem)

  if (!useSystemFinal && from?.trim()) {
    // Try to use the user's custom SMTP account
    try {
      const account = await EmailAccount.findOne({ userId, emailAddress: from.toLowerCase().trim() })

      if (account && account.smtp?.password) {
        const password = decrypt(account.smtp.password)
        fromEmail   = account.emailAddress
        transporter = nodemailer.createTransport({
          host:   account.smtp.host,
          port:   account.smtp.port,
          secure: account.smtp.secure,
          auth:   { user: account.smtp.username, pass: password },
        })
      } else {
        // Account not found or credentials missing → fall back to system
        useSystemFinal = true
      }
    } catch {
      // Decryption or DB error → fall back to system
      useSystemFinal = true
    }
  } else {
    useSystemFinal = true
  }

  const subjectLine = subject?.trim() || 'A letter from my heart 💌'

  // ── System path: Resend ───────────────────────────────────────────────────
  if (useSystemFinal) {
    if (!config.resendApiKey) {
      return res.status(500).json({
        error: 'System email is not configured on this server. Please connect your own email account in Connections.',
      })
    }
    try {
      resendEmailId = await sendViaResend({ to: to.trim(), subject: subjectLine, html, text, replyTo })
      fromEmail = config.emailFrom
    } catch (err) {
      return res.status(500).json({ error: `Failed to send: ${err.message}` })
    }
  } else {
    // ── Custom SMTP send ──────────────────────────────────────────────────
    try {
      await transporter.sendMail({
        from:    fromEmail,
        to:      to.trim(),
        subject: subjectLine,
        text,
        html,
      })
    } catch (err) {
      // Custom SMTP failed — fall back to Resend as last resort
      if (config.resendApiKey) {
        try {
          resendEmailId = await sendViaResend({ to: to.trim(), subject: subjectLine, html, text, replyTo })
          fromEmail = config.emailFrom
        } catch (sysErr) {
          return res.status(500).json({ error: `Failed to send: ${sysErr.message}` })
        }
      } else {
        return res.status(500).json({ error: `Failed to send: ${err.message}` })
      }
    }
  }

  // ── Record sent letter ────────────────────────────────────────────────────
  const letterData = {
    userId,
    type:      'sent',
    fromEmail,
    toEmail:   to.trim(),
    subject:   subjectLine,
    message:   message.trim(),
    trackingId,
    status:    'sent',
  }
  if (resendEmailId) letterData.resendEmailId = resendEmailId

  const letter = await Letter.create(letterData)

  // ── Notify the recipient if they have a registered account ───────────────
  try {
    const recipientEmail = to.trim().toLowerCase()
    const recipientUser  = await User.findOne({ email: recipientEmail }, '_id').lean()
    if (recipientUser) {
      await createNotification({
        userId:   recipientUser._id,
        senderId: userId,
        letterId: letter._id,
        message:  `Someone sent you a letter 💌`,
        type:     'delivery',
        link:     `/myspace`,
      })
    }
  } catch (err) {
    console.error('[Notification] recipient notify failed:', err.message)
  }

  res.json({ success: true, letterId: letter._id })
}
