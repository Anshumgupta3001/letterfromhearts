import nodemailer from 'nodemailer'
import EmailAccount from '../models/EmailAccount.js'
import Letter from '../models/Letter.js'
import config from '../config/index.js'
import { decrypt } from './emailAccountController.js'
import { checkContentSafety } from '../utils/moderation.js'
import {
  generateTrackingId,
  buildEmailHtml,
  buildEmailText,
  createSystemTransporter,
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
  const { from, to, subject, message, useSystem } = req.body
  const userId = req.user._id

  if (!to?.trim() || !to.includes('@')) return res.status(400).json({ error: 'Valid recipient email is required.' })
  if (!message?.trim())                 return res.status(400).json({ error: 'Message body is required.' })

  try {
    await checkContentSafety(message.trim())
  } catch {
    return res.status(400).json({ success: false, error: 'You have written restricted content. Please revise your message before saving or sending.' })
  }

  const trackingId = generateTrackingId(userId.toString())
  const html       = buildEmailHtml(message.trim(), trackingId)
  const text       = buildEmailText(message.trim())

  let transporter, fromEmail

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

  // ── System SMTP (fallback or explicit) ───────────────────────────────────
  if (useSystemFinal) {
    if (!config.systemEmail || !config.systemEmailPass) {
      return res.status(500).json({
        error: 'System email is not configured on this server. Please connect your own email account in Connections.',
      })
    }
    fromEmail   = config.systemEmail
    transporter = createSystemTransporter()
  }

  // ── Compose mail options ──────────────────────────────────────────────────
  // Use a display name "Letter from Heart" on the from address to improve
  // inbox placement and trust signals. Fall back to bare address for custom accounts.
  function formatFrom(addr) {
    // Only add display name for the system email — custom accounts keep their own identity
    return addr === config.systemEmail
      ? `"Letter from Heart" <${addr}>`
      : addr
  }

  const subjectLine = subject?.trim() || 'A letter from my heart 💌'

  // ── Send ──────────────────────────────────────────────────────────────────
  try {
    await transporter.sendMail({
      from:    formatFrom(fromEmail),
      to:      to.trim(),
      subject: subjectLine,
      text,
      html,
    })
  } catch (err) {
    // If custom SMTP failed at send-time, retry with system as last resort
    if (!useSystemFinal && config.systemEmail && config.systemEmailPass) {
      try {
        const systemTransporter = createSystemTransporter()
        await systemTransporter.sendMail({
          from:    formatFrom(config.systemEmail),
          to:      to.trim(),
          subject: subjectLine,
          text,
          html,
        })
        fromEmail = config.systemEmail // record actual sender
      } catch (sysErr) {
        return res.status(500).json({ error: `Failed to send: ${sysErr.message}` })
      }
    } else {
      return res.status(500).json({ error: `Failed to send: ${err.message}` })
    }
  }

  // ── Record sent letter ────────────────────────────────────────────────────
  const letter = await Letter.create({
    userId,
    type:      'sent',
    fromEmail,
    toEmail:   to.trim(),
    subject:   subjectLine,
    message:   message.trim(),
    trackingId,
    status:    'sent',
  })

  res.json({ success: true, letterId: letter._id })
}
