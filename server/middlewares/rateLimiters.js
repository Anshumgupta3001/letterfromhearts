import rateLimit from 'express-rate-limit'

// ── Auth — strict ─────────────────────────────────────────────────────────────
// Applied only to POST /signup and POST /login (not Google OAuth redirects).
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many authentication attempts. Please wait before trying again.' },
})

// ── Standard API — generous ───────────────────────────────────────────────────
// Applied to general authenticated routes: letters, notifications, analytics,
// email accounts, replies, onboarding.  600 req / 15 min = 40 req/min — well
// above what a normal active user generates even with polling.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      600,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please try again in a moment.' },
})

// ── Email sending — strict ────────────────────────────────────────────────────
// Applied to /api/send-email and /api/schedule-email to prevent spam.
export const sendEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      15,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many emails sent. Please wait before sending more.' },
})

// ── Report read — generous ────────────────────────────────────────────────────
export const reportReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      300,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please try again later.' },
})

// ── Report write — strict ─────────────────────────────────────────────────────
export const reportWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many report submissions. Please slow down.' },
})
