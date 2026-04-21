/**
 * Notification email reminder worker.
 *
 * Polls for unread, un-emailed notifications older than NOTIFICATION_EMAIL_DELAY
 * minutes and sends a reminder email to the user.
 *
 * Start with:  node worker/notificationEmailWorker.js   (from inside server/)
 */
import dotenv from 'dotenv'
dotenv.config()

import { connectDB }     from '../config/db.js'
import config            from '../config/index.js'
import Notification      from '../models/Notification.js'
import User from '../models/User.js'
import { buildNotificationEmail, sendViaResend } from '../utils/mailer.js'

await connectDB()

const DELAY_MS    = config.notificationEmailDelay * 60 * 1000
const POLL_MS     = 60 * 1000  // check every 60 seconds
const BATCH_LIMIT = 50          // max notifications per run

console.log(`📬 Notification email worker started`)
console.log(`   Delay  : ${config.notificationEmailDelay} min`)
console.log(`   Polling: every ${POLL_MS / 1000}s\n`)

// ── Resolve email for any user (single User collection for all providers) ────
async function resolveUser(userId) {
  const user = await User.findById(userId).select('email name').lean()
  if (user?.email) return { email: user.email, name: user.name }
  return null
}

// ── Main batch processor ──────────────────────────────────────────────────────
async function processBatch() {
  const cutoff = new Date(Date.now() - DELAY_MS)

  let pending
  try {
    pending = await Notification.find({
      isRead:    false,
      emailSent: false,
      createdAt: { $lte: cutoff },
    })
      .limit(BATCH_LIMIT)
      .lean()
  } catch (err) {
    console.error('[NotifWorker] DB query failed:', err.message)
    return
  }

  if (pending.length === 0) return

  console.log(`[NotifWorker] Found ${pending.length} unread notification(s) past delay threshold`)

  // Group by userId — one email per user per run to avoid inbox spam
  const byUser = new Map()
  for (const n of pending) {
    const uid = n.userId.toString()
    if (!byUser.has(uid)) byUser.set(uid, [])
    byUser.get(uid).push(n)
  }

  for (const [userId, notifications] of byUser) {
    // Re-check read/emailSent status (user may have opened the app since we queried)
    const stillUnread = await Notification.find({
      _id:       { $in: notifications.map(n => n._id) },
      isRead:    false,
      emailSent: false,
    }).lean()

    if (stillUnread.length === 0) {
      console.log(`[NotifWorker] userId:${userId} — all notifications now read, skipping`)
      continue
    }

    // Resolve user email
    let user
    try {
      user = await resolveUser(userId)
    } catch (err) {
      console.error(`[NotifWorker] Failed to fetch user ${userId}:`, err.message)
      continue  // retry next poll — do NOT mark emailSent
    }

    if (!user?.email) {
      // User has no resolvable email — log and skip WITHOUT marking emailSent
      // so that if the account is ever updated we retry
      console.warn(`[NotifWorker] No email found for userId:${userId} — will retry next poll`)
      continue
    }

    // Build email body — first notification is primary; extras listed below
    const primary = stillUnread[0]
    const extras  = stillUnread.slice(1)

    let bodyMessage = primary.message
    if (extras.length > 0) {
      bodyMessage += '<br/><br/><strong>Other updates:</strong><br/>'
      bodyMessage += extras.map(n => `• ${n.message}`).join('<br/>')
    }

    const html = buildNotificationEmail({
      message: bodyMessage,
      type:    primary.type,
      link:    primary.link || '',
    })

    const subject = stillUnread.length > 1
      ? `You have ${stillUnread.length} new updates on Letter from Heart 💌`
      : primary.message

    console.log(`[NotifWorker] Sending notification email to: ${user.email} (${stillUnread.length} notification(s))`)

    try {
      await sendViaResend({
        to:      user.email,
        subject,
        html,
        text:    `${bodyMessage.replace(/<[^>]+>/g, '')}\n\nVisit https://letterfromheart.com to view your updates.`,
      })

      await Notification.updateMany(
        { _id: { $in: stillUnread.map(n => n._id) } },
        { emailSent: true }
      )

      console.log(`[NotifWorker] ✅ Email sent to ${user.email} — ${stillUnread.length} notification(s) marked`)
    } catch (err) {
      console.error(`[NotifWorker] ❌ Resend failed for ${user.email}:`, err.message)
      // Do NOT mark emailSent — will retry on next poll
    }
  }
}

// ── Poll loop ─────────────────────────────────────────────────────────────────
async function poll() {
  try {
    await processBatch()
  } catch (err) {
    console.error('[NotifWorker] Unexpected error in processBatch:', err.message)
  } finally {
    setTimeout(poll, POLL_MS)
  }
}

poll()
