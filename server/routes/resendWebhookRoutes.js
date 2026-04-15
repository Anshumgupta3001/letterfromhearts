import { Router }  from 'express'
import crypto       from 'crypto'
import config       from '../config/index.js'
import Letter       from '../models/Letter.js'

const router = Router()

// POST /api/webhooks/resend
// Resend sends raw JSON with signature header — must be registered BEFORE express.json()
// so this route uses express.raw() to verify the HMAC signature.
router.post('/', async (req, res) => {
  // ── Signature verification ────────────────────────────────────────────────
  const signature = req.headers['svix-signature'] || req.headers['resend-signature']
  const msgId     = req.headers['svix-id']
  const timestamp = req.headers['svix-timestamp']

  if (config.resendWebhookSecret && signature) {
    try {
      const secret = config.resendWebhookSecret.startsWith('whsec_')
        ? Buffer.from(config.resendWebhookSecret.slice(6), 'base64')
        : Buffer.from(config.resendWebhookSecret)

      const toSign   = `${msgId}.${timestamp}.${req.body.toString()}`
      const expected = crypto.createHmac('sha256', secret).update(toSign).digest('base64')
      const sigs     = signature.split(' ').map(s => s.split(',')[1]).filter(Boolean)

      const valid = sigs.some(sig => {
        try {
          return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
        } catch { return false }
      })

      if (!valid) return res.status(401).json({ error: 'Invalid signature' })
    } catch {
      return res.status(401).json({ error: 'Signature verification failed' })
    }
  }

  // ── Parse event ───────────────────────────────────────────────────────────
  let event
  try {
    event = JSON.parse(req.body.toString())
  } catch {
    return res.status(400).json({ error: 'Invalid JSON' })
  }

  const { type, data } = event
  const emailId = data?.email_id || data?.id

  if (!emailId) return res.sendStatus(200)

  // ── Handle delivery event ─────────────────────────────────────────────────
  if (type === 'email.delivered') {
    await Letter.findOneAndUpdate(
      { resendEmailId: emailId },
      { isDelivered: true, deliveredAt: new Date() }
    ).catch(() => {})
  }

  // ── Handle open event (redundant with pixel, but recorded here too) ───────
  if (type === 'email.opened') {
    await Letter.findOneAndUpdate(
      { resendEmailId: emailId, status: { $nin: ['opened', 'clicked'] } },
      { status: 'opened', openedAt: new Date() }
    ).catch(() => {})
  }

  res.sendStatus(200)
})

export default router
