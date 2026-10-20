/**
 * Shared email-building and transport utilities.
 *
 * Templates use the parchment-scroll design (emailTemp1):
 *  - Wooden rod top + bottom, parchment body
 *  - Table-based centering for Outlook compatibility
 *  - No animations (email-client safe)
 *  - Lora + Dancing Script via @import (degrades to Georgia)
 */
import crypto from "crypto";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import config from "../config/index.js";

// ── Brand palette (emailTemp1 tones) ──────────────────────────────────────────
const C = {
  bg: "#eae4da",
  paper: "#fdf9f4",
  ink: "#3d2b1c",
  inkSoft: "#4a4540",
  inkMuted: "#9a7060",
  accent: "#b05a35",
  accentDark: "#C4633A",
  white: "#ffffff",
};

// ── SVG background texture (data URI, same as emailTemp1) ─────────────────────
const BG_TEXTURE = `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c4b49a' fill-opacity='0.07'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`;

// ── Fonts ─────────────────────────────────────────────────────────────────────
const FONT_IMPORT = `<style>@import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;1,400;1,500&display=swap');</style>`;
const SCRIPT = `'Dancing Script', Georgia, 'Times New Roman', serif`;
const LORA = `'Lora', Georgia, 'Times New Roman', serif`;
const SERIF = `Georgia, 'Times New Roman', serif`;
const SANS = `Arial, Helvetica, sans-serif`;

// ── Wooden rod style (no animations) ──────────────────────────────────────────
const ROD_STYLE = `height:22px;background:linear-gradient(180deg,#e9d4b6 0%,#f5e5d0 25%,#dcc0a0 50%,#efd9bb 70%,#d4b895 100%);border-radius:11px;box-shadow:0 4px 12px rgba(80,50,20,0.35),inset 0 1px 3px rgba(255,255,255,0.3),inset 0 -2px 4px rgba(0,0,0,0.2);font-size:0;line-height:0;`;

// ── Content sanitization helpers ─────────────────────────────────────────────

// Escape the five dangerous HTML characters so raw user text can never inject
// tags or break attribute values.  Call this BEFORE any newline → <br/> step.
function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// Format user-written letter body for safe HTML injection:
//   1. Escape HTML entities (prevents tag injection / layout break)
//   2. Convert newlines → <br/> (preserves paragraphs)
//   3. Return a non-empty fallback if the message is blank
export function formatLetterBody(text) {
  const escaped = escapeHtml(text);
  if (!escaped.trim())
    return '<em style="color:#8c8478;">No message provided.</em>';
  return escaped.replace(/\n/g, "<br/>");
}

// Sanitize system-generated notification HTML.
// Notification messages are composed internally (never raw user text) but may
// include <br/>, <strong>, and <b> tags added by the worker.  Strip every other
// tag so nothing unexpected leaks through if a message string ever contains HTML.
function sanitizeNotificationHtml(html) {
  const safe = String(html ?? "");
  // Allow only: <br/> <br /> <strong> </strong> <b> </b>
  return (
    safe
      .replace(/<[^>]*>/g, (tag) =>
        /^<\/?(br|strong|b)\s*\/?>$/i.test(tag.trim()) ? tag : "",
      )
      .replace(/\n/g, "<br/>") || // plain newlines in any remaining text → <br/>
    '<em style="color:#8c8478;">No message provided.</em>'
  );
}

// ── Tracking helpers ──────────────────────────────────────────────────────────

export function generateTrackingId(userId) {
  const rand = crypto.randomBytes(6).toString("hex");
  return `${userId}_${Date.now()}_${rand}`;
}

export function generateTrackingPixel(trackingId) {
  const base = config.trackingBaseUrl;
  return `<img src="${base}/api/tracking/pixel?tid=${encodeURIComponent(trackingId)}" width="1" height="1" style="display:none;border:0;outline:none;" alt="" />`;
}

export function wrapLinksForClickTracking(html, trackingId) {
  const base = config.trackingBaseUrl;
  return html.replace(/(https?:\/\/[^\s<"']+)/g, (url) => {
    const redirect = `${base}/api/tracking/click?tid=${encodeURIComponent(trackingId)}&url=${encodeURIComponent(url)}`;
    return `<a href="${redirect}" style="color:${C.accent};text-decoration:underline;font-family:${SERIF};">${url}</a>`;
  });
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

// ── Parchment divider row ─────────────────────────────────────────────────────
function parchmentDivider() {
  return `
  <tr>
    <td style="padding:0 0 20px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td style="height:1px;background:linear-gradient(90deg,rgba(160,120,80,0.2),rgba(160,120,80,0.03));font-size:0;line-height:0;">&nbsp;</td>
        </tr>
      </table>
    </td>
  </tr>`;
}

// ── Base shell — parchment scroll structure ───────────────────────────────────
// bodyRows = table rows to inject inside the parchment.
// footerText = small italic line below the bottom rod (optional).
function emailShell(rawTitle, rawPreview, bodyRows, footerText) {
  const title = escapeHtml(rawTitle || "Letter from Heart");
  const preview = escapeHtml(rawPreview || rawTitle || "Letter from Heart");
  const footer =
    footerText ||
    `Sent securely via <a href="${config.clientOrigin}" target="_blank" style="color:#9a8060;text-decoration:none;">Letter from Heart</a> &middot; Your privacy is respected.`;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${title}</title>
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
    @media only screen and (max-width: 600px) {
      .outer-table    { width: 100% !important; }
      .parchment-cell { padding: 28px 20px !important; }
      .logo-img       { width: 46px !important; height: 46px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:${C.bg};background-image:${BG_TEXTURE};" bgcolor="${C.bg}">

  <!-- Preview text -->
  <div style="display:none;font-size:1px;color:${C.bg};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preview}</div>

  <!-- Outer wrapper -->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
    bgcolor="${C.bg}" style="background-color:${C.bg};padding:48px 20px 80px;">
    <tr>
      <td align="center" valign="top">

        <!-- 560px centred container -->
        <table role="presentation" cellpadding="0" cellspacing="0" border="0"
          width="560" class="outer-table" style="width:560px;max-width:560px;">

          <!-- Logo area -->
          <tr>
            <td align="center" style="padding:0 0 28px 0;">
              <a href="${config.clientOrigin}" target="_blank" style="text-decoration:none;border:none;">
                <img
                  src="${config.clientOrigin}/auth-logo.png"
                  alt="Letter from Heart"
                  width="46" height="46"
                  class="logo-img"
                  style="width:46px;height:46px;border-radius:50%;border:0;outline:none;display:block;margin:0 auto 10px;box-shadow:0 4px 16px rgba(139,62,34,0.35);"
                />
              </a>
              <p style="margin:0;font-family:${LORA};font-style:italic;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${C.inkMuted};">Letter from Heart</p>
            </td>
          </tr>

          <!-- Scroll: rod + parchment + rod -->
          <tr>
            <td style="padding:0;">

              <!-- Top wooden rod -->
              <div style="${ROD_STYLE}">&nbsp;</div>

              <!-- Parchment -->
              <div style="background-color:${C.paper};background-image:repeating-linear-gradient(transparent,transparent 31px,rgba(28,26,23,0.028) 31px,rgba(28,26,23,0.028) 32px);background-position:0 76px;margin:0 8px;box-shadow:0 8px 32px rgba(80,55,30,0.2),0 2px 4px rgba(80,55,30,0.1);">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  ${bodyRows}
                </table>
              </div>

              <!-- Bottom wooden rod -->
              <div style="${ROD_STYLE}">&nbsp;</div>

            </td>
          </tr>

          <!-- Email footer -->
          <tr>
            <td align="center" style="padding:24px 0 0 0;">
              <p style="margin:0;font-family:${LORA};font-style:italic;font-size:11.5px;color:#9a8060;line-height:1.6;">
                ${footer}
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;
}

// ── Letter delivery email ─────────────────────────────────────────────────────

export function buildEmailHtml(
  message,
  trackingId,
  toEmail = "",
  letterId = "",
) {
  // 1. Escape HTML entities  →  2. preserve line breaks  →  3. wrap tracked links
  // Order matters: escape first so we never double-encode the <br/> tags we add,
  // and so URL-wrapping regex only sees plain-text URLs (no < > around them).
  const safeBody = formatLetterBody(message); // escape + \n→<br/>
  const withLinks = wrapLinksForClickTracking(safeBody, trackingId);
  const pixel = generateTrackingPixel(trackingId);
  const replyUrl = buildReplyUrl(toEmail, letterId);

  console.log(
    `[mailer] buildEmailHtml — to:${toEmail} letterId:${letterId} chars:${(message || "").length}`,
  );

  const body = `
    <tr>
      <td class="parchment-cell" style="padding:36px 40px 32px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">

          <!-- Tagline -->
          <tr>
            <td style="padding:0 0 22px;text-align:center;">
              <p style="margin:0;font-family:${LORA};font-style:italic;font-size:14px;color:${C.accent};line-height:1.65;">
                Someone took a quiet moment to write this for you.
              </p>
            </td>
          </tr>

          ${parchmentDivider()}

          <!-- Letter body — word-break prevents long words/URLs from overflowing -->
          <tr>
            <td style="padding:4px 0 28px;font-family:${LORA};font-size:15.5px;line-height:1.95;color:${C.ink};word-break:break-word;overflow-wrap:break-word;white-space:normal;max-width:100%;">
              ${withLinks}
            </td>
          </tr>

          <!-- Signoff -->
          <tr>
            <td style="padding:0 0 24px;">
              <p style="margin:0 0 5px;font-family:${LORA};font-size:15px;font-weight:500;color:#2c1f14;">With warmth</p>
             
            </td>
          </tr>

          <!-- Reply block -->
          <tr>
            <td style="padding:0 0 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                style="background-color:rgba(192,112,74,0.06);border:1px solid rgba(180,118,75,0.28);border-radius:10px;">
                <tr>
                  <td style="padding:18px 22px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td valign="middle">
                          <p style="margin:0 0 3px;font-family:${LORA};font-style:italic;font-size:11.5px;color:#a07858;">This letter awaits your words too.</p>
                          <p style="margin:0;font-family:${LORA};font-style:italic;font-size:13.5px;color:#5a3820;line-height:1.5;">Write back — it only takes a moment.</p>
                        </td>
                        <td valign="middle" align="right" style="padding-left:16px;white-space:nowrap;">
                          <a href="${replyUrl}" target="_blank"
                            style="display:inline-block;background-color:${C.accentDark};color:#fdf9f4;font-family:${LORA};font-style:italic;font-size:13.5px;padding:12px 24px;border-radius:30px;text-decoration:none;letter-spacing:0.4px;white-space:nowrap;box-shadow:0 4px 14px rgba(144,63,32,0.32);">
                            Reply
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footnote -->
          <tr>
            <td align="center">
              <p style="margin:0 0 8px;font-family:${LORA};font-style:italic;font-size:11.5px;color:#9a7868;line-height:1.75;text-align:center;">
                This letter was written with care and sent through Letter from Heart &mdash;<br/>
                a quiet space for words that matter.
              </p>
              <p style="margin:0;font-family:${LORA};font-style:italic;font-size:10.5px;color:#b09080;">
                &#x1F512; Sent securely via Letter from Heart &middot; Your privacy is respected.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>`;

  return (
    emailShell(
      "A letter for you",
      "Someone took a quiet moment to write this for you.",
      body,
      "You received this because someone chose to write to you.",
    ) + `\n${pixel}`
  );
}

export function buildEmailText(message) {
  return `${message}\n\n---\nSent securely via Letter from Heart. Your privacy is respected.\n${config.clientOrigin}`;
}

// ── Notification / reminder email ─────────────────────────────────────────────

const NOTIFICATION_HEADLINES = {
  reply: "Someone replied to your letter",
  open: "Someone opened your letter",
  claim: "A listener picked up your letter",
  delivery: "Someone sent you a letter",
  general: "You have a new update on Letter from Heart",
  system: "A message from Letter from Heart",
};

const NOTIFICATION_EMOJI = {
  reply: "&#x1F4AC;", // 💬
  open: "&#x1F48C;", // 💌
  claim: "&#x1F90D;", // 🤍
  delivery: "&#x2709;&#xFE0F;", // ✉️
  general: "&#x1F514;", // 🔔
  system: "&#x2699;&#xFE0F;", // ⚙️
};

export function buildNotificationEmail({ message, type, link }) {
  const headline =
    NOTIFICATION_HEADLINES[type] || NOTIFICATION_HEADLINES.general;
  const emoji = NOTIFICATION_EMOJI[type] || NOTIFICATION_EMOJI.general;
  const safeMsg = sanitizeNotificationHtml(message); // strips unknown tags, converts \n→<br/>
  const ctaUrl = link
    ? `${config.clientOrigin}${link.startsWith("/") ? "" : "/"}${link}`
    : config.clientOrigin;

  console.log(
    `[mailer] buildNotificationEmail — type:${type} link:${link || "(none)"} chars:${(message || "").length}`,
  );

  const body = `
    <tr>
      <td class="parchment-cell" style="padding:36px 40px 32px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">

          <!-- Opener: emoji + headline (mirrors letter tagline style) -->
          <tr>
            <td style="padding:0 0 22px;text-align:center;">
              <p style="margin:0 0 10px;font-size:22px;line-height:1;">${emoji}</p>
              <p style="margin:0;font-family:${LORA};font-style:italic;font-size:14px;color:${C.accent};line-height:1.65;">${headline}</p>
            </td>
          </tr>

          ${parchmentDivider()}

          <!-- Body -->
          <tr>
            <td style="padding:4px 0 28px;font-family:${LORA};font-size:15px;color:${C.inkSoft};line-height:1.75;word-break:break-word;overflow-wrap:break-word;white-space:normal;max-width:100%;">
              ${safeMsg}
            </td>
          </tr>

          <!-- CTA in reply-block style (mirrors letter reply block) -->
          <tr>
            <td style="padding:0 0 24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%"
                style="background-color:rgba(192,112,74,0.06);border:1px solid rgba(180,118,75,0.28);border-radius:10px;">
                <tr>
                  <td style="padding:18px 22px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td valign="middle">
                          <p style="margin:0 0 3px;font-family:${LORA};font-style:italic;font-size:11.5px;color:#a07858;">A quiet update is waiting for you.</p>
                          <p style="margin:0;font-family:${LORA};font-style:italic;font-size:13.5px;color:#5a3820;line-height:1.5;">Take a moment — it only takes a second.</p>
                        </td>
                        <td valign="middle" align="right" style="padding-left:16px;white-space:nowrap;">
                          <a href="${ctaUrl}" target="_blank"
                            style="display:inline-block;background-color:${C.accentDark};color:#fdf9f4;font-family:${LORA};font-style:italic;font-size:13.5px;padding:12px 24px;border-radius:30px;text-decoration:none;letter-spacing:0.4px;white-space:nowrap;box-shadow:0 4px 14px rgba(144,63,32,0.32);">
                            View in app &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footnote (mirrors letter footnote style) -->
          <tr>
            <td align="center">
              <p style="margin:0 0 8px;font-family:${LORA};font-style:italic;font-size:11.5px;color:#9a7868;line-height:1.75;text-align:center;">
                You&rsquo;re receiving this because you haven&rsquo;t seen this notification yet.<br/>
                Visit <a href="${config.clientOrigin}" target="_blank" style="color:#9a7868;text-decoration:underline;">Letter from Heart</a> to manage your preferences.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>`;

  return emailShell(headline, headline, body);
}

// ── System SMTP transporter ───────────────────────────────────────────────────

export function createSystemTransporter() {
  return nodemailer.createTransport({
    host: config.systemEmailHost,
    port: config.systemEmailPort,
    secure: config.systemEmailPort === 465,
    auth: { user: config.systemEmail, pass: config.systemEmailPass },
  });
}

export function formatFromSystem() {
  return `"Letter from Heart" <${config.systemEmail}>`;
}

// ── Resend (system path) ──────────────────────────────────────────────────────

export async function sendViaResend({ to, subject, html, text, replyTo }) {
  const resend = new Resend(config.resendApiKey);
  const payload = {
    from: `Letter from Heart <${config.emailFrom}>`,
    to: [to],
    subject,
    html,
    text,
  };
  if (replyTo?.trim()) payload.reply_to = replyTo.trim();
  const { data, error } = await resend.emails.send(payload);
  if (error) throw new Error(error.message || "Resend send failed");
  return data.id;
}
