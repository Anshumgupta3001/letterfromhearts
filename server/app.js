import express        from 'express'
import cors           from 'cors'
import morgan         from 'morgan'
import helmet         from 'helmet'
import mongoSanitize  from 'express-mongo-sanitize'
import config         from './config/index.js'
import passport       from './config/passport.js'
import { apiLimiter, sendEmailLimiter, reportReadLimiter, reportWriteLimiter } from './middlewares/rateLimiters.js'
import authRoutes          from './routes/authRoutes.js'
import authGoogleRoutes    from './routes/authGoogle.js'
import emailAccountRoutes  from './routes/emailAccountRoutes.js'
import sendEmailRoutes     from './routes/sendEmailRoutes.js'
import letterRoutes        from './routes/letterRoutes.js'
import trackingRoutes      from './routes/trackingRoutes.js'
import reportIssueRoutes   from './routes/reportIssueRoutes.js'
import scheduleEmailRoutes from './routes/scheduleEmailRoutes.js'
import adminRoutes         from './routes/adminRoutes.js'
import replyRoutes         from './routes/replyRoutes.js'
import resendWebhookRoutes from './routes/resendWebhookRoutes.js'
import notificationRoutes  from './routes/notificationRoutes.js'
import reportRoutes        from './routes/reportRoutes.js'
import onboardingRoutes    from './routes/onboardingRoutes.js'
import { notFound, errorHandler } from './middlewares/errorHandler.js'
import { guardMaliciousInput }    from './middlewares/sanitize.js'

const app = express()

// ── Trust proxy — must be set before rate limiters ────────────────────────────
// Without this, all users behind Nginx/a load balancer appear to share the same
// IP (the proxy's IP) and hit a single rate-limit bucket.  Setting to 1 trusts
// one hop (the immediate Nginx proxy) and uses X-Forwarded-For as the real IP.
app.set('trust proxy', 1)

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet())

// ── CORS ──────────────────────────────────────────────────────────────────────
// CLIENT_ORIGIN is the canonical production origin; always include it dynamically
// so a single env change is enough to update CORS without touching code.
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://letterfromheart.com',
  'https://www.letterfromheart.com',
  'https://app.letterfromheart.com',
  'https://my.letterfromheart.com',
  // Always honour whatever CLIENT_ORIGIN env var says (catches future renames)
  ...(process.env.CLIENT_ORIGIN ? [process.env.CLIENT_ORIGIN] : []),
]
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    console.warn('[CORS] Blocked origin:', origin)
    cb(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))

// ── Webhook — raw body BEFORE json parser (HMAC verification requirement) ─────
app.use('/api/webhooks/resend', express.raw({ type: 'application/json' }), resendWebhookRoutes)

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '50kb' }))
app.use(express.urlencoded({ extended: true, limit: '50kb' }))

// ── NoSQL injection prevention + malicious pattern guard ─────────────────────
app.use(mongoSanitize())
app.use(guardMaliciousInput)

app.use(passport.initialize())

if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'))
}

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Letter from Heart API 💌', env: config.nodeEnv })
})

// ── Per-route rate limiters ───────────────────────────────────────────────────
//
//  authLimiter      — applied inside authRoutes on POST /login and POST /signup only
//  sendEmailLimiter — email sending: strict (15/15min) to prevent spam
//  apiLimiter       — general authenticated traffic: generous (600/15min)
//
//  No limiter on:
//    /api/tracking  — hit by email clients automatically (pixel opens, clicks)
//    /api/admin     — protected by x-admin-key secret header
//    /api/webhooks  — Resend webhook with HMAC signature verification

// authLimiter is applied per-route inside authRoutes (POST /signup, POST /login only)
// authGoogleRoutes has no extra limiter — OAuth redirects must flow freely
app.use('/api/auth',          authRoutes)
app.use('/api/auth',          authGoogleRoutes)

// Email sending — strict limiter (spam prevention)
app.use('/api/send-email',     sendEmailLimiter, sendEmailRoutes)
app.use('/api/schedule-email', sendEmailLimiter, scheduleEmailRoutes)

// General authenticated routes — generous limiter
app.use('/api/email-accounts', apiLimiter, emailAccountRoutes)
app.use('/api/letters',        apiLimiter, letterRoutes)
app.use('/api/replies',        apiLimiter, replyRoutes)
app.use('/api/notifications',  apiLimiter, notificationRoutes)
app.use('/api/onboarding',     apiLimiter, onboardingRoutes)
app.use('/api/report-issue',   apiLimiter, reportIssueRoutes)

// Tracking — no rate limiter (email clients trigger opens/clicks automatically)
app.use('/api/tracking', trackingRoutes)

// Admin — no rate limiter (protected by x-admin-key header in verifyAdminKey middleware)
app.use('/api/admin', adminRoutes)

// Reports — read generous, write strict
app.get('/api/reports',  reportReadLimiter,  (req, res, next) => next())
app.post('/api/reports', reportWriteLimiter, (req, res, next) => next())
app.use('/api/reports',  reportRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
