import jwt from 'jsonwebtoken'
import config from '../config/index.js'
import User from '../models/User.js'
import GoogleUser from '../models/GoogleUser.js'   // ← added for Google auth

export async function protect(req, res, next) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authorised — no token.' })
  }

  const token = auth.split(' ')[1]
  try {
    const decoded = jwt.verify(token, config.jwtSecret)

    // ── Google users are stored in a separate model ────────────────────────
    if (decoded.provider === 'google') {
      const googleUser = await GoogleUser.findById(decoded.id)
      if (!googleUser) return res.status(401).json({ error: 'User no longer exists.' })
      req.user = googleUser
      return next()
    }

    // ── Standard email/password users (existing behaviour — unchanged) ─────
    const user = await User.findById(decoded.id).select('-password -otp')
    if (!user) return res.status(401).json({ error: 'User no longer exists.' })
    req.user = user
    next()
  } catch {
    return res.status(401).json({ error: 'Token invalid or expired.' })
  }
}
