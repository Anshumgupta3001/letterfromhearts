/**
 * Email worker — runs as a separate Node process.
 * Picks up scheduled email jobs from the Bull queue and delivers them.
 *
 * Start with:  node worker/emailWorker.js   (from inside server/)
 */
import dotenv from 'dotenv'
dotenv.config()                                  // load .env from server/ CWD

import mongoose    from 'mongoose'
import nodemailer  from 'nodemailer'
import { connectDB }  from '../config/db.js'
import { emailQueue } from '../queues/emailQueue.js'
import Letter         from '../models/Letter.js'
import EmailAccount   from '../models/EmailAccount.js'
import { decrypt }    from '../controllers/emailAccountController.js'
import {
  buildEmailHtml,
  buildEmailText,
  sendViaResend,
} from '../utils/mailer.js'

// ── Connect to MongoDB ────────────────────────────────────────────────────────
await connectDB()
console.log('📬 Email worker started — waiting for jobs…')

// ── Job processor ─────────────────────────────────────────────────────────────
emailQueue.process(async (job) => {
  const { letterId, userId, useSystem, fromEmailAddress, to, subject, message, trackingId, replyTo } = job.data

  // Build HTML + plain-text (tracking pixel baked in)
  const html = buildEmailHtml(message, trackingId)
  const text = buildEmailText(message)

  const subjectLine = subject || 'A letter from my heart 💌'

  // ── Decide transport ──────────────────────────────────────────────────────
  let transporter, fromField
  let resendEmailId = null

  if (!useSystem && fromEmailAddress) {
    try {
      const account = await EmailAccount.findOne({
        userId,
        emailAddress: fromEmailAddress.toLowerCase(),
      })
      if (account?.smtp?.password) {
        const password = decrypt(account.smtp.password)
        fromField   = account.emailAddress
        transporter = nodemailer.createTransport({
          host:   account.smtp.host,
          port:   account.smtp.port,
          secure: account.smtp.secure,
          auth:   { user: account.smtp.username, pass: password },
        })
      }
    } catch { /* fall through to system */ }
  }

  // ── Send ──────────────────────────────────────────────────────────────────
  if (transporter) {
    // Custom SMTP path
    try {
      await transporter.sendMail({ from: fromField, to: to.trim(), subject: subjectLine, text, html })
    } catch {
      // Fall back to Resend on failure
      resendEmailId = await sendViaResend({ to: to.trim(), subject: subjectLine, html, text, replyTo })
    }
  } else {
    // System path → Resend
    resendEmailId = await sendViaResend({ to: to.trim(), subject: subjectLine, html, text, replyTo })
  }

  // ── Mark letter as sent ───────────────────────────────────────────────────
  const updateData = { status: 'sent', isScheduled: false }
  if (resendEmailId) updateData.resendEmailId = resendEmailId

  await Letter.findByIdAndUpdate(letterId, updateData)

  console.log(`📬 Scheduled letter ${letterId} delivered to ${to}`)
})

// ── Failed job logging ────────────────────────────────────────────────────────
emailQueue.on('failed', async (job, err) => {
  console.error(`📬 Job ${job.id} failed (attempt ${job.attemptsMade}):`, err.message)
  // After all retries exhausted, mark letter as failed
  if (job.attemptsMade >= job.opts.attempts) {
    await Letter.findByIdAndUpdate(job.data.letterId, { status: 'failed' }).catch(() => {})
  }
})
