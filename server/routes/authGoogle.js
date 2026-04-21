// Google OAuth routes
//
// Passport redirect flow (primary):
//   GET  /api/auth/google          → redirect to Google OAuth consent screen
//   GET  /api/auth/google/callback → handle OAuth callback, issue JWT, redirect to frontend
//
// Firebase token flow (legacy — requires serviceAccountKey.json):
//   POST /api/auth/google-signup   → verify Firebase idToken, create new user
//   POST /api/auth/google-login    → verify Firebase idToken, login existing user

import { Router } from 'express'
import jwt        from 'jsonwebtoken'
import passport   from '../config/passport.js'
import User       from '../models/User.js'
import config     from '../config/index.js'
import admin      from '../config/firebaseAdmin.js'

const router = Router()

// ── Helpers ───────────────────────────────────────────────────────────────────

async function generateUniqueUsername(name) {
  const base = (name || 'user')
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

function signGoogleJwt(userId) {
  return jwt.sign({ id: userId, provider: 'google' }, config.jwtSecret, { expiresIn: '7d' })
}

function encodeState(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64')
}
function decodeState(str) {
  try { return JSON.parse(Buffer.from(str, 'base64').toString()) } catch { return {} }
}

// ── GET /api/auth/google ──────────────────────────────────────────────────────
router.get('/google', (req, res, next) => {
  if (!config.googleClientId || !config.googleClientSecret) {
    return res.status(503).json({
      error: 'Google login is not configured on the server. GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are missing.',
    })
  }

  const mode  = req.query.mode === 'signup' ? 'signup' : 'login'
  const state = encodeState({ mode })

  passport.authenticate('google', {
    scope:   ['profile', 'email'],
    state,
    session: false,
    prompt:  'select_account',
  })(req, res, next)
})

// ── GET /api/auth/google/callback ─────────────────────────────────────────────
router.get(
  '/google/callback',
  (req, res, next) => {
    passport.authenticate('google', {
      session:         false,
      failureRedirect: `${config.clientOrigin}/?google_error=auth_failed`,
    })(req, res, next)
  },
  async (req, res) => {
    try {
      const { googleId, name, email, avatar } = req.user
      const { mode } = decodeState(req.query.state || '')

      if (!email) {
        return res.redirect(`${config.clientOrigin}/?google_error=no_email`)
      }

      // Find existing user by Google UID or email
      let user = await User.findOne({ uid: googleId, authProvider: 'google' })
      if (!user) user = await User.findOne({ email, authProvider: 'google' })

      // ── Login mode ────────────────────────────────────────────────────────
      if (mode === 'login') {
        if (!user) {
          return res.redirect(`${config.clientOrigin}/?google_error=no_account`)
        }
        user.name   = name   || user.name
        user.avatar = avatar || user.avatar
        if (user.uid !== googleId) user.uid = googleId
        await user.save()

        const token     = signGoogleJwt(user._id.toString())
        const needsRole = !user.role
        return res.redirect(
          `${config.clientOrigin}/?google_token=${token}${needsRole ? '&google_new=true' : ''}`
        )
      }

      // ── Signup mode ───────────────────────────────────────────────────────
      if (user) {
        return res.redirect(`${config.clientOrigin}/?google_error=already_exists`)
      }

      const username = await generateUniqueUsername(name)
      user = await User.create({
        uid:          googleId,
        name:         name || 'Google User',
        username,
        email,
        avatar:       avatar || '',
        authProvider: 'google',
        // role intentionally omitted — frontend modal collects it
      })

      const token = signGoogleJwt(user._id.toString())
      return res.redirect(`${config.clientOrigin}/?google_token=${token}&google_new=true`)

    } catch (err) {
      console.error('[google/callback] Unexpected error:', err)
      return res.redirect(`${config.clientOrigin}/?google_error=server_error`)
    }
  }
)

// ── POST /api/auth/google-signup (Firebase flow — legacy) ─────────────────────
router.post('/google-signup', async (req, res) => {
  try {
    const { idToken, role } = req.body
    if (!idToken) return res.status(400).json({ error: 'idToken is required.' })

    const validRoles = ['seeker', 'listener', 'both']
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ error: 'Account type is required.' })
    }
    if (!admin.apps.length) {
      return res.status(503).json({ error: 'Firebase Google login is not configured on the server.' })
    }

    let decoded
    try { decoded = await admin.auth().verifyIdToken(idToken) }
    catch { return res.status(401).json({ error: 'Invalid or expired Google token.' }) }

    const { uid, name, email, picture: avatar } = decoded
    if (!email) return res.status(400).json({ error: 'Google account must have an email address.' })

    const existing = await User.findOne({
      authProvider: 'google',
      $or: [{ uid }, { email: email.toLowerCase() }],
    })
    if (existing) {
      return res.status(409).json({ error: 'An account with this Google account already exists. Please log in.' })
    }

    const username = await generateUniqueUsername(name)
    const user     = await User.create({
      uid, name: name || 'Google User', username,
      email: email.toLowerCase(), avatar: avatar || '',
      authProvider: 'google', role,
    })
    const token = signGoogleJwt(user._id.toString())
    return res.status(201).json({ success: true, token, user: user.toSafeObject() })
  } catch (err) {
    console.error('[google-signup]', err)
    return res.status(500).json({ error: 'Server error during Google sign-up.' })
  }
})

// ── POST /api/auth/google-login (Firebase flow — legacy) ──────────────────────
router.post('/google-login', async (req, res) => {
  try {
    const { idToken } = req.body
    if (!idToken) return res.status(400).json({ error: 'idToken is required.' })
    if (!admin.apps.length) {
      return res.status(503).json({ error: 'Firebase Google login is not configured on the server.' })
    }

    let decoded
    try { decoded = await admin.auth().verifyIdToken(idToken) }
    catch { return res.status(401).json({ error: 'Invalid or expired Google token.' }) }

    const { uid, name, email, picture: avatar } = decoded
    let user = await User.findOne({ uid, authProvider: 'google' })
    if (!user && email) user = await User.findOne({ email: email.toLowerCase(), authProvider: 'google' })
    if (!user) return res.status(404).json({ error: 'No account found. Please sign up first.' })

    user.name   = name   || user.name
    user.avatar = avatar || user.avatar
    if (uid !== user.uid) user.uid = uid
    await user.save()

    const token = signGoogleJwt(user._id.toString())
    return res.status(200).json({ success: true, token, user: user.toSafeObject() })
  } catch (err) {
    console.error('[google-login]', err)
    return res.status(500).json({ error: 'Server error during Google login.' })
  }
})

// ── POST /api/auth/google (Firebase flow — legacy) ────────────────────────────
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body
    if (!idToken) return res.status(400).json({ error: 'idToken is required.' })
    if (!admin.apps.length) {
      return res.status(503).json({ error: 'Firebase Google login is not configured on the server.' })
    }

    let decoded
    try { decoded = await admin.auth().verifyIdToken(idToken) }
    catch { return res.status(401).json({ error: 'Invalid or expired Google token.' }) }

    const { uid, name, email, picture: avatar } = decoded
    if (!email) return res.status(400).json({ error: 'Google account must have an email address.' })

    let user = await User.findOne({ uid, authProvider: 'google' })
    if (!user) {
      user = await User.findOne({ email: email.toLowerCase(), authProvider: 'google' })
      if (user) {
        user.uid    = uid
        user.avatar = avatar || user.avatar
        user.name   = name   || user.name
        await user.save()
      } else {
        const username = await generateUniqueUsername(name)
        user = await User.create({
          uid, name: name || 'Google User', username,
          email: email.toLowerCase(), avatar: avatar || '',
          authProvider: 'google',
        })
      }
    } else {
      user.name   = name   || user.name
      user.avatar = avatar || user.avatar
      await user.save()
    }

    const token = signGoogleJwt(user._id.toString())
    return res.status(200).json({ success: true, token, user: user.toSafeObject() })
  } catch (err) {
    console.error('[authGoogle]', err)
    return res.status(500).json({ error: 'Server error during Google authentication.' })
  }
})

export default router
