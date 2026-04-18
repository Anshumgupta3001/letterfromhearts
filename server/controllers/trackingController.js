import Letter     from '../models/Letter.js'
import User       from '../models/User.js'
import GoogleUser from '../models/GoogleUser.js'

// 1×1 transparent GIF — 35 bytes
const TRANSPARENT_GIF = Buffer.from(
  'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
  'base64'
)

// GET /api/tracking/pixel?tid=<trackingId>
// Called when the email client loads the tracking image.
// No auth required — this is hit by the recipient's mail client.
export async function trackOpen(req, res) {
  const { tid } = req.query

  if (tid) {
    // Fire-and-forget: never block the pixel response on DB work
    ;(async () => {
      try {
        const letter = await Letter.findOne({ trackingId: tid })
        if (!letter) return

        // Try to resolve recipient userId from toEmail
        const recipientEmail = letter.toEmail?.toLowerCase()
        let recipientId = null
        if (recipientEmail) {
          const user = await User.findOne({ email: recipientEmail }, '_id').lean()
            || await GoogleUser.findOne({ email: recipientEmail }, '_id').lean()
          if (user) recipientId = user._id
        }

        if (recipientId) {
          // Deduplicated openedBy entry — one per user
          const existing = letter.openedBy?.find(
            o => o.userId.toString() === recipientId.toString()
          )
          if (!existing) {
            letter.openedBy.push({ userId: recipientId, sources: ['email'], openedAt: new Date() })
          } else if (!existing.sources.includes('email')) {
            existing.sources.push('email')
          }
        }

        // Keep legacy status fields updated for backward compat
        if (letter.status === 'sent') letter.status = 'opened'
        if (!letter.openedAt) letter.openedAt = new Date()

        await letter.save()
      } catch { /* never break the pixel */ }
    })()
  }

  // Always respond with the pixel immediately
  res
    .status(200)
    .set({
      'Content-Type':   'image/gif',
      'Content-Length': TRANSPARENT_GIF.length,
      'Cache-Control':  'no-store, no-cache, must-revalidate',
      'Pragma':         'no-cache',
      'Expires':        '0',
    })
    .end(TRANSPARENT_GIF)
}

// GET /api/tracking/click?tid=<trackingId>&url=<encodedUrl>
// Called when the recipient clicks a tracked link.
// No auth required — increments clickCount on every click.
export async function trackClick(req, res) {
  const { tid, url } = req.query

  if (tid) {
    // Aggregation pipeline update: preserves existing openedAt if already set,
    // otherwise sets it to now — so a click always implies the email was opened.
    Letter.updateOne(
      { trackingId: tid },
      [
        {
          $set: {
            status:     'clicked',
            clickedAt:  '$$NOW',
            // Keep the earliest openedAt; set it now only if never opened before
            openedAt:   { $ifNull: ['$openedAt', '$$NOW'] },
            clickCount: { $add: [{ $ifNull: ['$clickCount', 0] }, 1] },
          },
        },
      ]
    ).catch(() => {})
  }

  // Decode and redirect to the original URL
  const destination = url ? decodeURIComponent(url) : '/'
  res.redirect(302, destination)
}
