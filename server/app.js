import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import config from './config/index.js'
import authRoutes from './routes/authRoutes.js'
import emailAccountRoutes from './routes/emailAccountRoutes.js'
import sendEmailRoutes from './routes/sendEmailRoutes.js'
import letterRoutes from './routes/letterRoutes.js'
import trackingRoutes from './routes/trackingRoutes.js'
import { notFound, errorHandler } from './middlewares/errorHandler.js'

const app = express()

app.use(cors({ origin: config.clientOrigin, credentials: true }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

if (config.nodeEnv !== 'test') {
  app.use(morgan('dev'))
}

app.get('/api/health', (_req, res) => {
  res.json({ success: true, message: 'Letter from Heart API 💌', env: config.nodeEnv })
})

app.use('/api/auth', authRoutes)
app.use('/api/email-accounts', emailAccountRoutes)
app.use('/api/send-email', sendEmailRoutes)
app.use('/api/letters', letterRoutes)
app.use('/api/tracking', trackingRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
