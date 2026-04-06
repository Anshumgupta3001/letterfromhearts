import jwt from 'jsonwebtoken'
import config from '../config/index.js'
import User from '../models/User.js'

export async function protect(req, res, next) {
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authorised — no token.' })
  }

  const token = auth.split(' ')[1]
  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    const user = await User.findById(decoded.id).select('-password -otp')
    if (!user) return res.status(401).json({ error: 'User no longer exists.' })
    req.user = user
    next()
  } catch {
    return res.status(401).json({ error: 'Token invalid or expired.' })
  }
}
