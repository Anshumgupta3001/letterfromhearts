import Queue  from 'bull'
import config from '../config/index.js'

// Redis Cloud (RedisLabs) standard ports use plain-text connections, not TLS.
// Remove `tls` entirely — adding it causes "packet length too long" errors
// because the server responds in plain-text while the client expects TLS frames.
const redisOpts = {
  host:     config.redisHost,
  port:     config.redisPort,
  username: config.redisUsername,
  password: config.redisPassword,
  enableReadyCheck:     false,
  maxRetriesPerRequest: null,
}

export const emailQueue = new Queue('lfh-email-queue', {
  redis: redisOpts,
})

emailQueue.on('ready', () => console.log('📬 Email queue ready'))
emailQueue.on('error', (err) => console.error('📬 Queue error:', err.message))
