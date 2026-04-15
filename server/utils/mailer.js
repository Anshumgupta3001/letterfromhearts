/**
 * Shared email-building and transport utilities.
 * Used by both sendEmailController (instant send) and emailWorker (scheduled send).
 */
import crypto      from 'crypto'
import nodemailer  from 'nodemailer'
import { Resend }  from 'resend'
import config      from '../config/index.js'

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

export function buildEmailHtml(message, trackingId) {
  const withBreaks = message.replace(/\n/g, '<br/>')
  const withLinks  = wrapLinksForClickTracking(withBreaks, trackingId)
  const pixel      = generateTrackingPixel(trackingId)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>A letter for you</title>
</head>
<body style="margin:0;padding:0;background:#f5f0e8;font-family:'DM Sans',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f0e8;padding:40px 0;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">
        <tr>
          <td style="padding:0 0 20px 0;text-align:center;">
            <img
              src="https://letterfromheart.com/favicon.png"
              alt="Letter from Heart"
              width="44"
              height="44"
              style="display:block;margin:0 auto 8px;object-fit:contain;border:0;outline:none;"
            />
            <p style="margin:0;font-family:Georgia,serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#9c8e80;">Letter from Heart</p>
          </td>
        </tr>
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
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
  ${pixel}
</body>
</html>`
}

export function buildEmailText(message) {
  return `${message}\n\n---\nSent via Letter from Heart — a quiet space for words that matter.\nhttps://letterfromheart.com`
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
export async function sendViaResend({ to, subject, html, text }) {
  const resend = new Resend(config.resendApiKey)
  const { data, error } = await resend.emails.send({
    from:    `Letter from Heart <${config.emailFrom}>`,
    to:      [to],
    subject,
    html,
    text,
  })
  if (error) throw new Error(error.message || 'Resend send failed')
  return data.id
}
