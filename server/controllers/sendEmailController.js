import crypto from 'crypto'
import nodemailer from 'nodemailer'
import EmailAccount from '../models/EmailAccount.js'
import Letter from '../models/Letter.js'
import config from '../config/index.js'
import { decrypt } from './emailAccountController.js'
import { checkContentSafety } from '../utils/moderation.js'

// ── Tracking helpers ──────────────────────────────────────────────────────────

function generateTrackingId(userId) {
  const rand = crypto.randomBytes(6).toString('hex')
  return `${userId}_${Date.now()}_${rand}`
}

function generateTrackingPixel(trackingId) {
  const base = config.trackingBaseUrl
  return `<img src="${base}/api/tracking/pixel?tid=${encodeURIComponent(trackingId)}" width="1" height="1" style="display:none;border:0;outline:none;" alt="" />`
}

function wrapLinksForClickTracking(html, trackingId) {
  const base = config.trackingBaseUrl
  return html.replace(/(https?:\/\/[^\s<"']+)/g, (url) => {
    const redirectUrl = `${base}/api/tracking/click?tid=${encodeURIComponent(trackingId)}&url=${encodeURIComponent(url)}`
    return `<a href="${redirectUrl}" style="color:inherit;">${url}</a>`
  })
}

function buildEmailHtml(message, trackingId) {
  const withBreaks = message.replace(/\n/g, '<br/>')
  const withLinks  = wrapLinksForClickTracking(withBreaks, trackingId)
  const pixel      = generateTrackingPixel(trackingId)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>A letter for you</title>
</head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:'DM Sans',Helvetica,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f0e8;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">

          <!-- Header -->
          <tr>
            <td style="padding:0 0 20px 0;text-align:center;">
              <p style="margin:0;font-size:22px;letter-spacing:2px;">💌</p>
              <p style="margin:6px 0 0;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#9c8e80;">Letter from Heart</p>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;padding:40px 44px;box-shadow:0 4px 24px rgba(28,26,23,0.07);border:1px solid rgba(28,26,23,0.06);">

              <!-- Intro line -->
              <p style="margin:0 0 28px;font-family:Georgia,serif;font-size:15px;font-style:italic;color:#8c8478;line-height:1.6;">
                Someone took a quiet moment to write this for you.
              </p>

              <!-- Divider -->
              <div style="height:1px;background:linear-gradient(to right,transparent,rgba(196,99,58,0.2),transparent);margin-bottom:28px;"></div>

              <!-- Letter body -->
              <div style="font-family:Georgia,serif;font-size:16px;line-height:2;color:#2c2a27;">
                ${withLinks}
              </div>

              <!-- Divider -->
              <div style="height:1px;background:linear-gradient(to right,transparent,rgba(28,26,23,0.1),transparent);margin:32px 0;"></div>

              <!-- Footer note -->
              <p style="margin:0;font-size:12px;color:#b0a89c;font-family:Georgia,serif;font-style:italic;line-height:1.6;text-align:center;">
                This letter was written with care and sent through Letter from Heart —<br/>
                a quiet space for words that matter.
              </p>

            </td>
          </tr>

          <!-- Bottom spacer + unsubscribe-style note -->
          <tr>
            <td style="padding:20px 0;text-align:center;">
              <p style="margin:0;font-size:11px;color:#b0a89c;font-family:Helvetica,Arial,sans-serif;letter-spacing:0.3px;">
                You received this because someone chose to write to you.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

  ${pixel}
</body>
</html>`
}

function buildEmailText(message) {
  // Plain-text fallback — improves deliverability and renders in all clients
  return `${message}\n\n---\nSent via Letter from Heart — a quiet space for words that matter.\nhttps://letterfromheart.com`
}

// ── System SMTP transporter factory ───────────────────────────────────────────
function createSystemTransporter() {
  return nodemailer.createTransport({
    host:   config.systemEmailHost,
    port:   config.systemEmailPort,
    secure: config.systemEmailPort === 465,
    auth:   { user: config.systemEmail, pass: config.systemEmailPass },
  })
}

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
