import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import config from '../config/index.js'

const VALID_ROLES = ['seeker', 'listener', 'both']

function signToken(id) {
  return jwt.sign({ id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn })
}

function validatePassword(password) {
  if (!password || password.length < 6) return 'Password must be at least 6 characters.'
  return null
}

// Derives a unique username from a display name — users never see or enter this.
async function generateUniqueUsername(name) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 14) || 'user'

  for (let i = 0; i < 10; i++) {
    const suffix    = Math.random().toString(36).slice(2, 6)
    const candidate = `${base}_${suffix}`
    const exists    = await User.findOne({ username: candidate })
    if (!exists) return candidate
  }
  return `user_${Date.now().toString(36)}`
}

// POST /api/auth/signup
export async function signup(req, res) {
  try {
    const { name, email, password, role, source, otherSource } = req.body

    if (!name?.trim())  return res.status(400).json({ error: 'Name is required.' })
    if (!email?.trim()) return res.status(400).json({ error: 'Email is required.' })
    if (!password)      return res.status(400).json({ error: 'Password is required.' })

    const pwErr = validatePassword(password)
    if (pwErr) return res.status(400).json({ error: pwErr })

    if (!role || !VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: 'Account type is required.' })
    }

    if (!source?.trim()) return res.status(400).json({ error: 'Please tell us where you heard about us.' })
    if (source === 'Other' && !otherSource?.trim()) {
      return res.status(400).json({ error: 'Please specify where you heard about us.' })
    }

    const normalEmail = email.toLowerCase().trim()
    const heardFrom   = source === 'Other' ? otherSource.trim() : source.trim()

    const emailExists = await User.findOne({ email: normalEmail })
    if (emailExists) return res.status(409).json({ error: 'An account with this email already exists.' })

    const username = await generateUniqueUsername(name.trim())
    const user     = await User.create({ name: name.trim(), email: normalEmail, username, password, role, heardFrom })
    const token    = signToken(user._id)

    console.log('[Auth] New signup —', normalEmail, '— username:', username)
    res.status(201).json({ success: true, token, user: user.toSafeObject() })

  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0]
      const msg   = field === 'email' ? 'An account with this email already exists.' : 'Signup failed. Please try again.'
      return res.status(409).json({ error: msg })
    }
    throw err
  }
}

// POST /api/auth/login
export async function login(req, res) {
  const { email, password } = req.body

  if (!email?.trim()) return res.status(400).json({ error: 'Email is required.' })
  if (!password)      return res.status(400).json({ error: 'Password is required.' })

  const normalEmail = email.toLowerCase().trim()
  const user = await User.findOne({ email: normalEmail })

  if (!user) {
    console.warn('[Auth] Failed login — unknown email:', normalEmail, '— IP:', req.ip)
    return res.status(401).json({ error: 'Invalid email or password.' })
  }

  const match = await user.matchPassword(password)
  if (!match) {
    console.warn('[Auth] Failed login — wrong password for:', normalEmail, '— IP:', req.ip)
    return res.status(401).json({ error: 'Invalid email or password.' })
  }

  const token = signToken(user._id)
  res.json({ success: true, token, user: user.toSafeObject() })
}

// GET /api/auth/me
export async function getMe(req, res) {
  res.json({ success: true, user: req.user.toSafeObject() })
}

// PATCH /api/auth/me  — update mutable profile fields
export async function updateMe(req, res) {
  const allowed = ['emailMode', 'role']
  const updates = {}

  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key]
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update.' })
  }

  if (updates.role && !VALID_ROLES.includes(updates.role)) {
    return res.status(400).json({ error: 'Invalid role value.' })
  }
  if (updates.emailMode && !['custom', 'system'].includes(updates.emailMode)) {
    return res.status(400).json({ error: 'Invalid emailMode value.' })
  }

  const user = req.user
  Object.assign(user, updates)
  await user.save()
  res.json({ success: true, user: user.toSafeObject() })
}
