/**
 * Shared email-building and transport utilities.
 * Used by both sendEmailController (instant send) and emailWorker (scheduled send).
 */
import crypto      from 'crypto'
import nodemailer  from 'nodemailer'
import { Resend }  from 'resend'
import config      from '../config/index.js'

// ── Shared brand constants ────────────────────────────────────────────────────

const BRAND_LOGO = `
  <tr>
    <td style="padding:0 0 28px 0;text-align:center;">
      <img
        src="https://letterfromheart.com/auth-logo.png"
        alt="Letter from Heart"
        width="120"
        style="display:block;margin:0 auto;border:0;outline:none;max-width:120px;height:auto;"
      />
    </td>
  </tr>`

const BRAND_FOOTER = `
  <tr>
    <td style="padding:20px 0;text-align:center;">
      <p style="margin:0;font-size:11px;color:#b0a89c;font-family:Helvetica,Arial,sans-serif;letter-spacing:0.3px;">
        Letter from Heart · A quiet space for words that matter.
      </p>
    </td>
  </tr>`

function emailShell(title, bodyRows) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f0e8;padding:40px 0;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
        ${BRAND_LOGO}
        ${bodyRows}
        ${BRAND_FOOTER}
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

// ── Tracking helpers ──────────────────────────────────────────────────────────

export function generateTrackingId(userId) {
  const rand = crypto.randomBytes(6).toString('hex')
  return `${userId}_${Date.now()}_${rand}`
}

export function generateTrackingPixel(trackingId) {
  const base = config.trackingBaseUrl
  return `<img src="${base}/api/tracking/pixel?tid=${encodeURIComponent(trackingId)}" width="1" height="1" style="display:none;border:0;outline:none;" alt="" />`
}

export function wrapLinksForClickTracking(html, trackingId) {
  const base = config.trackingBaseUrl
  return html.replace(/(https?:\/\/[^\s<"']+)/g, (url) => {
    const redirectUrl = `${base}/api/tracking/click?tid=${encodeURIComponent(trackingId)}&url=${encodeURIComponent(url)}`
    return `<a href="${redirectUrl}" style="color:inherit;">${url}</a>`
  })
}

// ── Letter delivery email ─────────────────────────────────────────────────────

export function buildEmailHtml(message, trackingId, toEmail = '') {
  const withBreaks = message.replace(/\n/g, '<br/>')
  const withLinks  = wrapLinksForClickTracking(withBreaks, trackingId)
  const pixel      = generateTrackingPixel(trackingId)

  const body = `
    <tr>
      <td style="background:#ffffff;border-radius:16px;padding:40px 44px;box-shadow:0 4px 24px rgba(28,26,23,0.07);border:1px solid rgba(28,26,23,0.06);">
        <p style="margin:0 0 28px;font-family:Georgia,serif;font-size:15px;font-style:italic;color:#8c8478;line-height:1.6;">
          Someone took a quiet moment to write this for you.
        </p>
        <div style="height:1px;background:linear-gradient(to right,transparent,rgba(196,99,58,0.2),transparent);margin-bottom:28px;"></div>
        <div style="font-family:Georgia,serif;font-size:16px;line-height:2;color:#2c2a27;">
          ${withLinks}
        </div>
        <div style="height:1px;background:linear-gradient(to right,transparent,rgba(28,26,23,0.1),transparent);margin:32px 0;"></div>
        <p style="margin:0;font-size:12px;color:#b0a89c;font-family:Georgia,serif;font-style:italic;line-height:1.6;text-align:center;">
          This letter was written with care and sent through Letter from Heart —<br/>
          a quiet space for words that matter.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 0;text-align:center;">
        <p style="margin:0;font-size:11px;color:#b0a89c;font-family:Helvetica,Arial,sans-serif;letter-spacing:0.3px;">
          You received this because someone chose to write to you.
        </p>
        <div style="margin-top:16px;">
          <a href="https://letterfromheart.com/signup${toEmail ? `?email=${encodeURIComponent(toEmail)}` : ''}" target="_blank"
            style="display:inline-block;padding:10px 22px;background:#1C1A17;color:#F7F2EA;text-decoration:none;border-radius:99px;font-size:13px;font-family:Helvetica,Arial,sans-serif;letter-spacing:0.2px;">
            Click here to reply 💌
          </a>
        </div>
      </td>
    </tr>`

  return emailShell('A letter for you', body) + `\n${pixel}`
}

export function buildEmailText(message) {
  return `${message}\n\n---\nSent via Letter from Heart — a quiet space for words that matter.\nhttps://letterfromheart.com`
}

// ── Notification reminder email ───────────────────────────────────────────────

const NOTIFICATION_MESSAGES = {
  reply:    'Someone replied to your letter 💬',
  open:     'Someone opened your letter 💌',
  claim:    'A listener picked up your letter 🤍',
  delivery: 'Your letter was delivered successfully ✉️',
  general:  'You have a new update on Letter from Heart',
  system:   'A message from Letter from Heart',
}

export function buildNotificationEmail({ message, type, link }) {
  const headline = NOTIFICATION_MESSAGES[type] || NOTIFICATION_MESSAGES.general
  const ctaUrl   = link
    ? `https://letterfromheart.com${link.startsWith('/') ? '' : '/'}${link}`
    : 'https://letterfromheart.com'

  const body = `
    <tr>
      <td style="background:#ffffff;border-radius:16px;padding:36px 40px;box-shadow:0 4px 24px rgba(28,26,23,0.07);border:1px solid rgba(28,26,23,0.06);">
        <h2 style="margin:0 0 12px;font-family:Georgia,serif;font-size:20px;font-weight:600;color:#1c1a17;line-height:1.3;">
          ${headline}
        </h2>
        <div style="height:1px;background:linear-gradient(to right,transparent,rgba(196,99,58,0.2),transparent);margin:16px 0 20px;"></div>
        <p style="margin:0 0 28px;font-family:Georgia,serif;font-size:15px;color:#4a4540;line-height:1.7;">
          ${message}
        </p>
        <div style="text-align:center;">
          <a href="${ctaUrl}" target="_blank"
            style="display:inline-block;padding:12px 28px;background:#c4633a;color:#ffffff;text-decoration:none;border-radius:99px;font-size:13px;font-family:Helvetica,Arial,sans-serif;font-weight:600;letter-spacing:0.3px;">
            View in app →
          </a>
        </div>
        <div style="height:1px;background:linear-gradient(to right,transparent,rgba(28,26,23,0.08),transparent);margin:28px 0 20px;"></div>
        <p style="margin:0;font-size:11px;color:#b0a89c;font-family:Georgia,serif;font-style:italic;line-height:1.6;text-align:center;">
          You're receiving this because you haven't seen this notification yet.<br/>
          Visit <a href="https://letterfromheart.com" style="color:#b0a89c;">letterfromheart.com</a> to manage your preferences.
        </p>
      </td>
    </tr>`

  return emailShell(headline, body)
}

// ── System SMTP transporter ───────────────────────────────────────────────────

export function createSystemTransporter() {
  return nodemailer.createTransport({
    host:   config.systemEmailHost,
    port:   config.systemEmailPort,
    secure: config.systemEmailPort === 465,
    auth:   { user: config.systemEmail, pass: config.systemEmailPass },
  })
}

export function formatFromSystem() {
  return `"Letter from Heart" <${config.systemEmail}>`
}

// ── Resend (system path) ──────────────────────────────────────────────────────

/**
 * Send an email via Resend and return the Resend message ID.
 * Only used for the system (useSystem=true) path.
 * @returns {Promise<string>} Resend email ID
 */
export async function sendViaResend({ to, subject, html, text, replyTo }) {
  const resend = new Resend(config.resendApiKey)
  const payload = {
    from:    `Letter from Heart <${config.emailFrom}>`,
    to:      [to],
    subject,
    html,
    text,
  }
  if (replyTo?.trim()) payload.reply_to = replyTo.trim()
  const { data, error } = await resend.emails.send(payload)
  if (error) throw new Error(error.message || 'Resend send failed')
  return data.id
}
