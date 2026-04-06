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
}
