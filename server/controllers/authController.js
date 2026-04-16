import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import config from '../config/index.js'

function signToken(id) {
  return jwt.sign({ id }, config.jwtSecret, { expiresIn: config.jwtExpiresIn })
}

function validatePassword(password) {
  if (!password || password.length < 6) return 'Password must be at least 6 characters.'
  return null
}

// POST /api/auth/signup
export async function signup(req, res) {
  const { name, email, password, role, source, otherSource } = req.body

  if (!name?.trim())  return res.status(400).json({ error: 'Name is required.' })
  if (!email?.trim()) return res.status(400).json({ error: 'Email is required.' })
  if (!password)      return res.status(400).json({ error: 'Password is required.' })

  const pwErr = validatePassword(password)
  if (pwErr) return res.status(400).json({ error: pwErr })

  const validRoles = ['seeker', 'listener', 'both']
  if (!role || !validRoles.includes(role)) {
    return res.status(400).json({ error: 'Account type is required.' })
  }

  if (!source?.trim()) return res.status(400).json({ error: 'Please tell us where you heard about us.' })
  if (source === 'Other' && !otherSource?.trim()) {
    return res.status(400).json({ error: 'Please specify where you heard about us.' })
  }

  const heardFrom = source === 'Other' ? otherSource.trim() : source.trim()

  const exists = await User.findOne({ email: email.toLowerCase().trim() })
  if (exists) return res.status(409).json({ error: 'An account with this email already exists.' })

  const user = await User.create({ name: name.trim(), email, password, role, heardFrom })
  const token = signToken(user._id)

  res.status(201).json({ success: true, token, user: user.toSafeObject() })
}

// POST /api/auth/login
export async function login(req, res) {
  const { email, password } = req.body

  if (!email?.trim()) return res.status(400).json({ error: 'Email is required.' })
  if (!password)      return res.status(400).json({ error: 'Password is required.' })

  const user = await User.findOne({ email: email.toLowerCase().trim() })
  if (!user) return res.status(401).json({ error: 'Invalid email or password.' })

  const match = await user.matchPassword(password)
  if (!match) return res.status(401).json({ error: 'Invalid email or password.' })

  const token = signToken(user._id)
  res.json({ success: true, token, user: user.toSafeObject() })
}

// GET /api/auth/me
export async function getMe(req, res) {
  res.json({ success: true, user: req.user.toSafeObject() })
}

// PATCH /api/auth/me  — update mutable profile fields (emailMode, role)
export async function updateMe(req, res) {
  const allowed = ['emailMode', 'role']
  const updates = {}

  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key]
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update.' })
  }

  // Validate enums
  if (updates.role && !['seeker', 'listener', 'both'].includes(updates.role)) {
    return res.status(400).json({ error: 'Invalid role value.' })
  }
  if (updates.emailMode && !['custom', 'system'].includes(updates.emailMode)) {
    return res.status(400).json({ error: 'Invalid emailMode value.' })
  }

  // Use req.user directly so this works for both User and GoogleUser models.
  // The protect middleware already fetched and attached the correct document.
  const user = req.user
  Object.assign(user, updates)
  await user.save()
  res.json({ success: true, user: user.toSafeObject() })
}
