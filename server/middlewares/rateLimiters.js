import rateLimit from 'express-rate-limit'

// Local `npm run dev` sets LFH_LOCAL_DEV=1, so limits never block you while testing.
// Production runs `npm start`, which keeps every limit on.
const skip = () => process.env.LFH_LOCAL_DEV === '1'

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      200,
  standardHeaders: true,
  legacyHeaders:   false,
  skip,
  message: { error: 'Too many requests. Please try again later.' },
})

// Applied only to POST /signup and POST /login — not to Google OAuth redirects
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  standardHeaders: true,
  legacyHeaders:   false,
  skip,
  message: { error: 'Too many authentication attempts. Please wait before trying again.' },
})

// GET /api/reports — admin dashboard polling; generous limit
export const reportReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      300,
  standardHeaders: true,
  legacyHeaders:   false,
  skip,
  message: { error: 'Too many requests. Please try again later.' },
})

// POST /api/reports — user submissions; strict to prevent spam
export const reportWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  standardHeaders: true,
  legacyHeaders:   false,
  skip,
  message: { error: 'Too many report submissions. Please slow down.' },
})
