/**
 * Shared email-building and transport utilities.
 *
 * All templates are email-client-safe:
 *  - Table-based layout (Outlook compatible)
 *  - Fully inline styles (no external CSS blocks)
 *  - No animations, clip-path, SVG textures, or complex gradients
 *  - Simple border/background instead of box-shadow
 *  - Dancing Script loaded via @import with Georgia serif fallback
 *  - Responsive via max-width + fluid widths
 */
import crypto     from 'crypto'
import nodemailer from 'nodemailer'
import { Resend } from 'resend'
import config     from '../config/index.js'

// ── Brand palette ─────────────────────────────────────────────────────────────
const C = {
  bg:        '#f5f0e8',
  paper:     '#faf7f2',
  border:    '#e4ddd3',
  accentBorder: '#e8c9b3',
  ink:       '#2c2a27',
  inkSoft:   '#4a4540',
  inkMuted:  '#8c8478',
  accent:    '#c4633a',
  accentDark:'#a84e2a',
  cream:     '#f7f2ea',
  sage:      '#7a9e8e',
  white:     '#ffffff',
}

// ── Fonts ─────────────────────────────────────────────────────────────────────
// Dancing Script degrades to Georgia in Outlook; @import works in Gmail/Apple Mail
const FONT_IMPORT = `<style>@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;600;700&display=swap');</style>`
const SCRIPT = `'Dancing Script', Georgia, 'Times New Roman', serif`
const SERIF  = `Georgia, 'Times New Roman', serif`
const SANS   = `Arial, Helvetica, sans-serif`

// ── Content sanitization helpers ─────────────────────────────────────────────

// Escape the five dangerous HTML characters so raw user text can never inject
// tags or break attribute values.  Call this BEFORE any newline → <br/> step.
function escapeHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
}

// Format user-written letter body for safe HTML injection:
//   1. Escape HTML entities (prevents tag injection / layout break)
//   2. Convert newlines → <br/> (preserves paragraphs)
//   3. Return a non-empty fallback if the message is blank
export function formatLetterBody(text) {
  const escaped = escapeHtml(text)
  if (!escaped.trim()) return '<em style="color:#8c8478;">No message provided.</em>'
  return escaped.replace(/\n/g, '<br/>')
}

// Sanitize system-generated notification HTML.
// Notification messages are composed internally (never raw user text) but may
// include <br/>, <strong>, and <b> tags added by the worker.  Strip every other
// tag so nothing unexpected leaks through if a message string ever contains HTML.
function sanitizeNotificationHtml(html) {
  const safe = String(html ?? '')
  // Allow only: <br/> <br /> <strong> </strong> <b> </b>
  return safe
    .replace(/<[^>]*>/g, tag => /^<\/?(br|strong|b)\s*\/?>$/i.test(tag.trim()) ? tag : '')
    .replace(/\n/g, '<br/>')  // plain newlines in any remaining text → <br/>
    || '<em style="color:#8c8478;">No message provided.</em>'
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
    const redirect = `${base}/api/tracking/click?tid=${encodeURIComponent(trackingId)}&url=${encodeURIComponent(url)}`
    return `<a href="${redirect}" style="color:${C.accent};text-decoration:underline;font-family:${SERIF};">${url}</a>`
  })
}

// ── Reply URL ─────────────────────────────────────────────────────────────────
// Sends recipient to /login?reply=<id>&email=<to>
// AuthPage reads ?reply → shows login mode; AppContext reads it after auth → navigates to received
function buildReplyUrl(toEmail, letterId) {
  const params = new URLSearchParams()
  if (letterId) params.set('reply', letterId.toString())
  if (toEmail)  params.set('email', toEmail)
  return `${config.clientOrigin}/login?${params.toString()}`
}

// ── Base shell ────────────────────────────────────────────────────────────────
// All email templates share this outer wrapper.
// Uses table-based centering that works across all major clients including Outlook.
function emailShell(rawTitle, rawPreview, bodyRows) {
  const title   = escapeHtml(rawTitle   || 'Letter from Heart')
  const preview = escapeHtml(rawPreview || rawTitle || 'Letter from Heart')
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${title}</title>   <!-- escapeHtml applied above -->
  ${FONT_IMPORT}
  <!--[if mso]>
  <noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
  <style>table { border-collapse: collapse; } td { font-family: Georgia, serif; }</style>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; display: block; }
    a { color: ${C.accent}; }
    @media only screen and (max-width: 620px) {
      .outer-table { width: 100% !important; }
      .card-cell { padding: 28px 20px !important; }
      .logo-img  { width: 76px !important; height: auto !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${C.bg};" bgcolor="${C.bg}">

  <!-- Preview text (hidden in most clients but shows in inbox preview) -->
  <div style="display:none;font-size:1px;color:${C.bg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preview}</div>

  <!-- Outer wrapper -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${C.bg}" style="background-color:${C.bg};padding:40px 16px;">
    <tr>
      <td align="center" valign="top">

        <!-- Content container (560px centred) -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" class="outer-table" style="width:560px;max-width:560px;">

          <!-- Logo -->
          <tr>
            <td align="center" style="padding:0 0 20px 0;">
              <a href="${config.clientOrigin}" target="_blank" style="text-decoration:none;border:none;">
                <img
                  src="${config.clientOrigin}/auth-logo.png"
                  alt="Letter from Heart"
                  width="96"
                  class="logo-img"
                  style="width:96px;height:auto;border:0;outline:none;display:block;margin:0 auto;"
                />
              </a>
            </td>
          </tr>

          <!-- Body rows injected here -->
          ${bodyRows}

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:20px 0 0 0;">
              <p style="margin:0;font-size:11px;color:${C.inkMuted};font-family:${SANS};letter-spacing:0.3px;line-height:1.6;">
                Sent securely via
                <a href="${config.clientOrigin}" target="_blank" style="color:${C.inkMuted};text-decoration:none;">Letter from Heart</a>
                &middot; Your privacy is respected.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`
}

// ── Divider row ───────────────────────────────────────────────────────────────
function dividerRow(paddingTop = '0', paddingBottom = '24px') {
  return `
  <tr>
    <td style="padding:${paddingTop} 0 ${paddingBottom} 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="border-bottom:1px solid ${C.border};font-size:0;line-height:0;">&nbsp;</td>
        </tr>
      </table>
    </td>
  </tr>`
}

// ── CTA button (table-based for Outlook rounded corners) ──────────────────────
function ctaButton(href, label, bgColor = C.ink, textColor = C.cream) {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
    <tr>
      <td align="center" bgcolor="${bgColor}" style="background-color:${bgColor};border-radius:99px;mso-padding-alt:0;">
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"
          href="${href}"
          style="height:42px;v-text-anchor:middle;width:180px;"
          arcsize="50%"
          fillcolor="${bgColor}"
          strokecolor="${bgColor}">
          <w:anchorlock/>
          <center style="color:${textColor};font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:bold;letter-spacing:0.3px;">
            ${label}
          </center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-->
        <a href="${href}" target="_blank"
          style="display:inline-block;padding:11px 28px;font-family:${SANS};font-size:13px;font-weight:bold;color:${textColor};text-decoration:none;border-radius:99px;letter-spacing:0.2px;mso-hide:all;">
          ${label}
        </a>
        <!--<![endif]-->
      </td>
    </tr>
  </table>`
}

// ── Letter delivery email ─────────────────────────────────────────────────────

export function buildEmailHtml(message, trackingId, toEmail = '', letterId = '') {
  // 1. Escape HTML entities  →  2. preserve line breaks  →  3. wrap tracked links
  // Order matters: escape first so we never double-encode the <br/> tags we add,
  // and so URL-wrapping regex only sees plain-text URLs (no < > around them).
  const safeBody  = formatLetterBody(message)        // escape + \n→<br/>
  const withLinks = wrapLinksForClickTracking(safeBody, trackingId)
  const pixel     = generateTrackingPixel(trackingId)
  const replyUrl  = buildReplyUrl(toEmail, letterId)

  console.log(`[mailer] buildEmailHtml — to:${toEmail} letterId:${letterId} chars:${(message || '').length}`)

  const body = `
    <!-- ── Letter card ─────────────────────────────────────────────── -->
    <tr>
      <td class="card-cell"
        bgcolor="${C.paper}"
        style="background-color:${C.paper};border:1px solid ${C.accentBorder};border-radius:12px;padding:40px 44px;">

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">

          <!-- Tagline -->
          <tr>
            <td style="padding:0 0 20px 0;">
              <p style="margin:0;font-family:${SCRIPT};font-size:27px;font-weight:bold;color:${C.ink};line-height:1.3;">
                Someone took a quiet moment to write this for you.
              </p>
            </td>
          </tr>

          ${dividerRow('0', '20px')}

          <!-- Letter body — word-break prevents long words/URLs from overflowing -->
          <tr>
            <td style="padding:4px 0 28px;font-family:${SERIF};font-size:16px;line-height:2.05;color:${C.inkSoft};word-break:break-word;overflow-wrap:break-word;white-space:normal;max-width:100%;">
              ${withLinks}
            </td>
          </tr>

          ${dividerRow('0', '20px')}

          <!-- Closing -->
          <tr>
            <td style="padding:4px 0 20px;">
              <p style="margin:0 0 4px;font-family:${SCRIPT};font-size:21px;color:${C.ink};line-height:1.4;">
                With warmth,
              </p>
              <p style="margin:0;font-family:${SCRIPT};font-size:18px;color:${C.inkMuted};line-height:1.4;">
                A stranger who cared enough to write.
              </p>
            </td>
          </tr>

          <!-- Brand note -->
          <tr>
            <td align="center">
              <p style="margin:0;font-size:12px;color:${C.inkMuted};font-family:${SERIF};font-style:italic;line-height:1.6;">
                This letter was written with care and sent through Letter from Heart &mdash;<br/>
                a quiet space for words that matter.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>

    <!-- ── CTA row ─────────────────────────────────────────────────── -->
    <tr>
      <td align="center" style="padding:24px 0 8px;">
        <p style="margin:0 0 16px;font-size:11px;color:${C.inkMuted};font-family:${SANS};letter-spacing:0.3px;line-height:1.5;">
          You received this because someone chose to write to you.
        </p>
        ${ctaButton(replyUrl, 'Click here to reply &#128140;')}
        <p style="margin:10px 0 0;font-size:10px;color:${C.inkMuted};font-family:${SANS};">
          Already have an account? You&rsquo;ll be taken straight to the letter.
        </p>
      </td>
    </tr>`

  return emailShell('A letter for you', 'Someone took a quiet moment to write this for you.', body) + `\n${pixel}`
}

export function buildEmailText(message) {
  return `${message}\n\n---\nSent securely via Letter from Heart. Your privacy is respected.\n${config.clientOrigin}`
}

// ── Notification / reminder email ─────────────────────────────────────────────

const NOTIFICATION_HEADLINES = {
  reply:    'Someone replied to your letter',
  open:     'Someone opened your letter',
  claim:    'A listener picked up your letter',
  delivery: 'Your letter was delivered',
  general:  'You have a new update on Letter from Heart',
  system:   'A message from Letter from Heart',
}

const NOTIFICATION_EMOJI = {
  reply:    '&#x1F4AC;',  // 💬
  open:     '&#x1F48C;',  // 💌
  claim:    '&#x1F90D;',  // 🤍
  delivery: '&#x2709;&#xFE0F;', // ✉️
  general:  '&#x1F514;',  // 🔔
  system:   '&#x2699;&#xFE0F;', // ⚙️
}

export function buildNotificationEmail({ message, type, link }) {
  const headline   = NOTIFICATION_HEADLINES[type] || NOTIFICATION_HEADLINES.general
  const emoji      = NOTIFICATION_EMOJI[type]     || NOTIFICATION_EMOJI.general
  const safeMsg    = sanitizeNotificationHtml(message)  // strips unknown tags, converts \n→<br/>
  const ctaUrl     = link
    ? `${config.clientOrigin}${link.startsWith('/') ? '' : '/'}${link}`
    : config.clientOrigin

  console.log(`[mailer] buildNotificationEmail — type:${type} link:${link || '(none)'} chars:${(message || '').length}`)

  const body = `
    <!-- ── Notification card ───────────────────────────────────────── -->
    <tr>
      <td class="card-cell"
        bgcolor="${C.paper}"
        style="background-color:${C.paper};border:1px solid ${C.border};border-radius:12px;padding:36px 40px;">

        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">

          <!-- Headline -->
          <tr>
            <td style="padding:0 0 16px 0;">
              <p style="margin:0 0 8px;font-size:28px;line-height:1;">${emoji}</p>
              <h2 style="margin:0;font-family:${SCRIPT};font-size:27px;font-weight:bold;color:${C.ink};line-height:1.3;">
                ${headline}
              </h2>
            </td>
          </tr>

          ${dividerRow('0', '20px')}

          <!-- Body — word-break prevents long notification text from overflowing -->
          <tr>
            <td style="padding:4px 0 28px;font-family:${SERIF};font-size:15px;color:${C.inkSoft};line-height:1.75;word-break:break-word;overflow-wrap:break-word;white-space:normal;max-width:100%;">
              ${safeMsg}
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding:0 0 28px;">
              ${ctaButton(ctaUrl, 'View in app &rarr;', C.accent, C.white)}
            </td>
          </tr>

          ${dividerRow('0', '0')}

          <!-- Footer note -->
          <tr>
            <td align="center" style="padding:20px 0 0 0;">
              <p style="margin:0;font-size:11px;color:${C.inkMuted};font-family:${SERIF};font-style:italic;line-height:1.6;">
                You&rsquo;re receiving this because you haven&rsquo;t seen this notification yet.<br/>
                Visit <a href="${config.clientOrigin}" target="_blank" style="color:${C.inkMuted};text-decoration:underline;">Letter from Heart</a> to manage your preferences.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>`

  return emailShell(headline, headline, body)
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

export async function sendViaResend({ to, subject, html, text, replyTo }) {
  const resend  = new Resend(config.resendApiKey)
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
