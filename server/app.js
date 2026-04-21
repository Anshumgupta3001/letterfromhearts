import express        from 'express'
import cors           from 'cors'
import morgan         from 'morgan'
import helmet         from 'helmet'
import rateLimit      from 'express-rate-limit'
import mongoSanitize  from 'express-mongo-sanitize'
import config         from './config/index.js'
import passport       from './config/passport.js'
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
import { notFound, errorHandler }    from './middlewares/errorHandler.js'
import { guardMaliciousInput }       from './middlewares/sanitize.js'

const app = express()

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet())

// ── CORS ──────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:3000',
  'https://letterfromheart.com',
  'https://www.letterfromheart.com',
]
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    console.warn('[CORS] Blocked origin:', origin)
    cb(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))

// ── Rate limiters ─────────────────────────────────────────────────────────────

// Global: 200 req / 15 min per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      200,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests. Please try again later.' },
})

// Auth: 10 req / 15 min — covers signup, login, Google OAuth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      10,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many authentication attempts. Please wait before trying again.' },
})

// Reports (user-facing submit): 20 req / 15 min
const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max:      20,
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many report submissions. Please slow down.' },
})

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

app.use('/api/auth',          authLimiter, authRoutes)
app.use('/api/auth',          authLimiter, authGoogleRoutes)
app.use('/api/email-accounts',            emailAccountRoutes)
app.use('/api/send-email',                sendEmailRoutes)
app.use('/api/letters',                   letterRoutes)
app.use('/api/tracking',                  trackingRoutes)
app.use('/api/report-issue',              reportIssueRoutes)
app.use('/api/schedule-email',            scheduleEmailRoutes)
app.use('/api/admin',                     adminRoutes)
app.use('/api/replies',                   replyRoutes)
app.use('/api/notifications',             notificationRoutes)
app.use('/api/reports',       reportLimiter, reportRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
