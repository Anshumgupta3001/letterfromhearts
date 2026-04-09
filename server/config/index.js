import dotenv from 'dotenv'
dotenv.config()

export default {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  mongoUri: process.env.MONGO_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'lfh_jwt_secret_change_in_prod',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30d',
  encryptionKey:   process.env.ENCRYPTION_KEY || 'letterfromheart_secret_key_32chr',
  trackingBaseUrl: process.env.TRACKING_BASE_URL || 'http://localhost:5000',
  systemEmail:     process.env.SYSTEM_EMAIL || '',
  systemEmailPass: process.env.SYSTEM_EMAIL_PASS || '',
  systemEmailHost: process.env.SYSTEM_EMAIL_HOST || 'smtp.gmail.com',
  systemEmailPort: Number(process.env.SYSTEM_EMAIL_PORT) || 587,
  // Google OAuth (Passport)
  googleClientId:     process.env.GOOGLE_CLIENT_ID || '',
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
  googleCallbackUrl:  process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
}
