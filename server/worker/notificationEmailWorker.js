/**
 * Notification email reminder worker.
 *
 * Polls for unread, un-emailed notifications older than NOTIFICATION_EMAIL_DELAY
 * minutes and sends a reminder email to the user.
 *
 * Start with:  node worker/notificationEmailWorker.js   (from inside server/)
 * Or add to your process manager / Procfile alongside emailWorker.
 */
import dotenv from 'dotenv'
dotenv.config()

import mongoose          from 'mongoose'
import { connectDB }     from '../config/db.js'
import config            from '../config/index.js'
import Notification      from '../models/Notification.js'
import User              from '../models/User.js'
import { buildNotificationEmail, sendViaResend } from '../utils/mailer.js'

await connectDB()

const DELAY_MS    = config.notificationEmailDelay * 60 * 1000
const POLL_MS     = 60 * 1000   // check every 60 seconds
const BATCH_LIMIT = 50           // max notifications per run

console.log(`📬 Notification email worker started`)
console.log(`   Delay  : ${config.notificationEmailDelay} min`)
console.log(`   Polling: every ${POLL_MS / 1000}s\n`)

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

  console.log(`[NotifWorker] Found ${pending.length} unread notification(s) to email`)

  // Group by userId so one user gets one email per run when multiple
  // notifications are pending (avoids inbox flooding)
  const byUser = new Map()
  for (const n of pending) {
    const uid = n.userId.toString()
    if (!byUser.has(uid)) byUser.set(uid, [])
    byUser.get(uid).push(n)
  }

  for (const [userId, notifications] of byUser) {
    // Re-check: skip the whole user if any notification was read since query
    const stillUnread = await Notification.find({
      _id:       { $in: notifications.map(n => n._id) },
      isRead:    false,
      emailSent: false,
    }).lean()

    if (stillUnread.length === 0) continue

    // Fetch user email
    let user
    try {
      user = await User.findById(userId).select('email name').lean()
    } catch (err) {
      console.error(`[NotifWorker] Failed to fetch user ${userId}:`, err.message)
      continue
    }
    if (!user?.email) {
      console.warn(`[NotifWorker] No email for userId ${userId} — skipping`)
      await Notification.updateMany(
        { _id: { $in: stillUnread.map(n => n._id) } },
        { emailSent: true }   // mark so we don't keep retrying
      )
      continue
    }

    // Build email — if multiple notifications, use the most recent one as the
    // primary message and list the rest in the body
    const primary = stillUnread[0]
    const extras  = stillUnread.slice(1)

    let bodyMessage = primary.message
    if (extras.length > 0) {
      bodyMessage += '<br/><br/>'
      bodyMessage += extras.map(n => `• ${n.message}`).join('<br/>')
    }

    const html = buildNotificationEmail({
      message: bodyMessage,
      type:    primary.type,
      link:    primary.link || '',
    })

    const subject = extras.length > 0
      ? `You have ${stillUnread.length} new updates on Letter from Heart 💌`
      : primary.message

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

      console.log(`[NotifWorker] ✅ Emailed ${user.email} — ${stillUnread.length} notification(s)`)
    } catch (err) {
      console.error(`[NotifWorker] ❌ Failed to email ${user.email}:`, err.message)
      // Do NOT mark emailSent=true so it retries next poll
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
