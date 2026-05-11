import express        from 'express'
import cors           from 'cors'
import morgan         from 'morgan'
import helmet         from 'helmet'
import mongoSanitize  from 'express-mongo-sanitize'
import config         from './config/index.js'
import passport       from './config/passport.js'
import { globalLimiter, reportReadLimiter, reportWriteLimiter } from './middlewares/rateLimiters.js'
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
import { notFound, errorHandler } from './middlewares/errorHandler.js'
import { guardMaliciousInput }    from './middlewares/sanitize.js'

const app = express()

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

// ── Global rate limiter ───────────────────────────────────────────────────────
app.use(globalLimiter)

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

// authLimiter is applied per-route inside authRoutes (POST /signup, POST /login only)
// authGoogleRoutes has no extra limiter — OAuth redirects must flow freely
app.use('/api/auth',          authRoutes)
app.use('/api/auth',          authGoogleRoutes)
app.use('/api/email-accounts',            emailAccountRoutes)
app.use('/api/send-email',                sendEmailRoutes)
app.use('/api/letters',                   letterRoutes)
app.use('/api/tracking',                  trackingRoutes)
app.use('/api/report-issue',              reportIssueRoutes)
app.use('/api/schedule-email',            scheduleEmailRoutes)
app.use('/api/admin',                     adminRoutes)
app.use('/api/replies',                   replyRoutes)
app.use('/api/notifications',             notificationRoutes)
app.get('/api/reports',       reportReadLimiter,  (req, res, next) => next())  // read — generous
app.post('/api/reports',      reportWriteLimiter, (req, res, next) => next())  // write — strict
app.use('/api/reports',       reportRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
