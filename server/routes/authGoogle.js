// Google OAuth routes
//
// Passport redirect flow (primary — no Firebase needed):
//   GET  /api/auth/google          → redirect to Google OAuth consent screen
//   GET  /api/auth/google/callback → handle OAuth callback, issue JWT, redirect to frontend
//
// Firebase token flow (legacy — requires serviceAccountKey.json):
//   POST /api/auth/google-signup   → verify Firebase idToken, create new user
//   POST /api/auth/google-login    → verify Firebase idToken, login existing user

import { Router } from 'express'
import jwt        from 'jsonwebtoken'
import passport   from '../config/passport.js'
import GoogleUser from '../models/GoogleUser.js'
import config     from '../config/index.js'
import admin      from '../config/firebaseAdmin.js'   // legacy Firebase routes

const router = Router()

// ── Helpers ───────────────────────────────────────────────────────────────────

async function generateUniqueUsername(name) {
  const base = (name || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 14) || 'user'

  // Try up to 10 candidates before falling back to a longer random suffix
  for (let i = 0; i < 10; i++) {
    const suffix   = Math.random().toString(36).slice(2, 6)
    const candidate = `${base}_${suffix}`
    const exists   = await GoogleUser.findOne({ username: candidate })
    if (!exists) return candidate
  }
  return `user_${Date.now().toString(36)}`
}

// ── Helper: sign a JWT for a GoogleUser ──────────────────────────────────────
function signGoogleJwt(userId) {
  return jwt.sign({ id: userId, provider: 'google' }, config.jwtSecret, { expiresIn: '7d' })
}

// ── Helper: encode mode in OAuth state param ──────────────────────────────────
function encodeState(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64')
}
function decodeState(str) {
  try { return JSON.parse(Buffer.from(str, 'base64').toString()) } catch { return {} }
}

// ── GET /api/auth/google ──────────────────────────────────────────────────────
// Initiates Google OAuth. Accepts ?mode=signup|login (default: login).
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
// Google redirects here after the user grants (or denies) permission.
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
      const { googleId, name, email, avatar } = req.user   // set by Passport strategy
      const { mode } = decodeState(req.query.state || '')

      if (!email) {
        return res.redirect(`${config.clientOrigin}/?google_error=no_email`)
      }

      // ── Find existing GoogleUser by uid or email ─────────────────────────
      let googleUser = await GoogleUser.findOne({ uid: googleId })
      if (!googleUser) googleUser = await GoogleUser.findOne({ email })

      // ── Login mode: existing users only ──────────────────────────────────
      if (mode === 'login') {
        if (!googleUser) {
          return res.redirect(`${config.clientOrigin}/?google_error=no_account`)
        }
        // Refresh profile data from Google
        googleUser.name   = name   || googleUser.name
        googleUser.avatar = avatar || googleUser.avatar
        if (googleUser.uid !== googleId) googleUser.uid = googleId
        await googleUser.save()

        const token = signGoogleJwt(googleUser._id.toString())
        // If this user never set a role, treat them the same as a new signup
        const needsRole = !googleUser.role
        return res.redirect(
          `${config.clientOrigin}/?google_token=${token}${needsRole ? '&google_new=true' : ''}`
        )
      }

      // ── Signup mode ───────────────────────────────────────────────────────
      if (googleUser) {
        // Account already exists — redirect with error
        return res.redirect(`${config.clientOrigin}/?google_error=already_exists`)
      }

      // Create new user WITHOUT a role — the frontend modal will collect it
      const username = await generateUniqueUsername(name)
      googleUser = await GoogleUser.create({
        uid:    googleId,
        name:   name   || 'Google User',
        email,
        username,
        avatar: avatar || '',
        // role intentionally omitted — null until user selects one
      })

      const token = signGoogleJwt(googleUser._id.toString())
      return res.redirect(`${config.clientOrigin}/?google_token=${token}&google_new=true`)

    } catch (err) {
      console.error('[google/callback] Unexpected error:', err)
      return res.redirect(`${config.clientOrigin}/?google_error=server_error`)
    }
  }
)

// ── POST /api/auth/google-signup (Firebase flow — legacy) ─────────────────────
// Kept for backward compat. Requires Firebase Admin (serviceAccountKey.json).
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

    const existing = await GoogleUser.findOne({ $or: [{ uid }, { email: email.toLowerCase() }] })
    if (existing) {
      return res.status(409).json({ error: 'An account with this Google account already exists. Please log in.' })
    }

    const usernameForNew = await generateUniqueUsername(name)
    const googleUser = await GoogleUser.create({ uid, name: name || 'Google User', email: email.toLowerCase(), username: usernameForNew, avatar: avatar || '', role })
    const token = signGoogleJwt(googleUser._id.toString())
    return res.status(201).json({ success: true, token, user: googleUser.toSafeObject() })
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
    let googleUser = await GoogleUser.findOne({ uid })
    if (!googleUser && email) googleUser = await GoogleUser.findOne({ email: email.toLowerCase() })
    if (!googleUser) return res.status(404).json({ error: 'No account found. Please sign up first.' })

    googleUser.name   = name   || googleUser.name
    googleUser.avatar = avatar || googleUser.avatar
    if (uid !== googleUser.uid) googleUser.uid = uid
    await googleUser.save()

    const token = signGoogleJwt(googleUser._id.toString())
    return res.status(200).json({ success: true, token, user: googleUser.toSafeObject() })
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

    let googleUser = await GoogleUser.findOne({ uid })
    if (!googleUser) {
      googleUser = await GoogleUser.findOne({ email: email.toLowerCase() })
      if (googleUser) {
        googleUser.uid    = uid
        googleUser.avatar = avatar || googleUser.avatar
        googleUser.name   = name   || googleUser.name
        await googleUser.save()
      } else {
        const usernameForLegacy = await generateUniqueUsername(name)
        googleUser = await GoogleUser.create({ uid, name: name || 'Google User', email: email.toLowerCase(), username: usernameForLegacy, avatar: avatar || '' })
      }
    } else {
      googleUser.name   = name   || googleUser.name
      googleUser.avatar = avatar || googleUser.avatar
      await googleUser.save()
    }

    const token = signGoogleJwt(googleUser._id.toString())
    return res.status(200).json({ success: true, token, user: googleUser.toSafeObject() })
  } catch (err) {
    console.error('[authGoogle]', err)
    return res.status(500).json({ error: 'Server error during Google authentication.' })
  }
})

export default router
