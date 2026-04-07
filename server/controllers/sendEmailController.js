import crypto from 'crypto'
import nodemailer from 'nodemailer'
import EmailAccount from '../models/EmailAccount.js'
import Letter from '../models/Letter.js'
import config from '../config/index.js'
import { decrypt } from './emailAccountController.js'

// ── Tracking helpers ──────────────────────────────────────────────────────────

function generateTrackingId(userId) {
  // userId + timestamp + random bytes → compact hex
  const rand = crypto.randomBytes(6).toString('hex')
  return `${userId}_${Date.now()}_${rand}`
}

function generateTrackingPixel(trackingId) {
  const base = config.trackingBaseUrl
  return `<img src="${base}/api/tracking/pixel?tid=${encodeURIComponent(trackingId)}" width="1" height="1" style="display:none;border:0;outline:none;" alt="" />`
}

function wrapLinksForClickTracking(html, trackingId) {
  const base = config.trackingBaseUrl
  // Replace bare URLs not already inside an href/src attribute
  return html.replace(/(https?:\/\/[^\s<"']+)/g, (url) => {
    const redirectUrl = `${base}/api/tracking/click?tid=${encodeURIComponent(trackingId)}&url=${encodeURIComponent(url)}`
    return `<a href="${redirectUrl}" style="color:inherit;">${url}</a>`
  })
}

function buildEmailHtml(message, trackingId) {
  // Convert plain newlines → <br> and wrap links, then append pixel
  const withBreaks   = message.replace(/\n/g, '<br/>')
  const withLinks    = wrapLinksForClickTracking(withBreaks, trackingId)
  const pixel        = generateTrackingPixel(trackingId)

  return `<div style="font-family:Georgia,serif;max-width:600px;line-height:1.9;color:#1c1a17;padding:48px 40px;">
  ${withLinks}
  <br/><br/>
  <hr style="border:none;border-top:1px solid rgba(28,26,23,0.1);margin:32px 0;"/>
  <p style="font-size:11px;color:#8c8478;margin:0;">Sent via <em>Letter from Heart</em></p>
  ${pixel}
</div>`
}

// ── Handler ───────────────────────────────────────────────────────────────────

// POST /api/send-email
export async function sendEmail(req, res) {
  const { from, to, subject, message, useSystem } = req.body
  const userId = req.user._id

  if (!to?.trim() || !to.includes('@')) return res.status(400).json({ error: 'Valid recipient email is required.' })
  if (!message?.trim())                return res.status(400).json({ error: 'Message body is required.' })

  const trackingId = generateTrackingId(userId.toString())
  const html       = buildEmailHtml(message.trim(), trackingId)

  let transporter, fromEmail

  if (useSystem) {
    // ── Use platform system SMTP ─────────────────────────────────────────────
    if (!config.systemEmail || !config.systemEmailPass) {
      return res.status(500).json({ error: 'System email is not configured. Contact support.' })
    }
    fromEmail   = config.systemEmail
    transporter = nodemailer.createTransport({
      host:   config.systemEmailHost,
      port:   config.systemEmailPort,
      secure: false,
      auth:   { user: config.systemEmail, pass: config.systemEmailPass },
    })
  } else {
    // ── Use user's connected account ─────────────────────────────────────────
    if (!from?.trim()) return res.status(400).json({ error: '"from" email is required when not using system email.' })

    const account = await EmailAccount.findOne({ userId, emailAddress: from.toLowerCase().trim() })
    if (!account) {
      return res.status(404).json({
        error: `No connected account found for "${from}". Please connect it in Connections.`,
      })
    }
    if (!account.smtp?.password) {
      return res.status(400).json({ error: 'Account has no SMTP credentials. Please reconnect.' })
    }

    let password
    try {
      password = decrypt(account.smtp.password)
    } catch {
      return res.status(500).json({ error: 'Failed to read credentials. Please reconnect this account.' })
    }

    fromEmail   = account.emailAddress
    transporter = nodemailer.createTransport({
      host:   account.smtp.host,
      port:   account.smtp.port,
      secure: account.smtp.secure,
      auth:   { user: account.smtp.username, pass: password },
    })
  }

  try {
    await transporter.sendMail({
      from:    fromEmail,
      to:      to.trim(),
      subject: subject?.trim() || 'A letter from my heart',
      html,
    })
  } catch (err) {
    return res.status(500).json({ error: `Failed to send: ${err.message}` })
  }

  const letter = await Letter.create({
    userId,
    type:      'sent',
    fromEmail,
    toEmail:   to.trim(),
    subject:   subject?.trim() || 'A letter from my heart',
    message:   message.trim(),
    trackingId,
    status:    'sent',
  })

  res.json({ success: true, letterId: letter._id })
}
