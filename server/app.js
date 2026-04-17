import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import config from './config/index.js'
import passport from './config/passport.js'             // ← Passport (initialises Google Strategy)
import authRoutes from './routes/authRoutes.js'
import authGoogleRoutes from './routes/authGoogle.js'   // ← Google OAuth
import emailAccountRoutes from './routes/emailAccountRoutes.js'
import sendEmailRoutes from './routes/sendEmailRoutes.js'
import letterRoutes from './routes/letterRoutes.js'
import trackingRoutes from './routes/trackingRoutes.js'
import reportIssueRoutes    from './routes/reportIssueRoutes.js'
import scheduleEmailRoutes  from './routes/scheduleEmailRoutes.js'
import adminRoutes          from './routes/adminRoutes.js'
import replyRoutes          from './routes/replyRoutes.js'
import resendWebhookRoutes  from './routes/resendWebhookRoutes.js'
import notificationRoutes   from './routes/notificationRoutes.js'
import { notFound, errorHandler } from './middlewares/errorHandler.js'

const app = express()

const allowedOrigins = [
  'http://localhost:3000',
  'https://letterfromheart.com',
  'https://www.letterfromheart.com',
]
app.use(cors({
  origin: (origin, cb) => {
    // allow requests with no origin (curl, mobile apps, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))

// Webhook route must be registered BEFORE express.json() to receive raw body for HMAC verification
app.use('/api/webhooks/resend', express.raw({ type: 'application/json' }), resendWebhookRoutes)

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(passport.initialize())   // no sessions — JWT only

if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'))
}

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Letter from Heart API 💌', env: config.nodeEnv })
})

app.use('/api/auth', authRoutes)
app.use('/api/auth', authGoogleRoutes)   // ← POST /api/auth/google (new)
app.use('/api/email-accounts', emailAccountRoutes)
app.use('/api/send-email', sendEmailRoutes)
app.use('/api/letters', letterRoutes)
app.use('/api/tracking', trackingRoutes)
app.use('/api/report-issue',   reportIssueRoutes)
app.use('/api/schedule-email', scheduleEmailRoutes)
app.use('/api/admin',          adminRoutes)
app.use('/api/replies',        replyRoutes)
app.use('/api/notifications',  notificationRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
