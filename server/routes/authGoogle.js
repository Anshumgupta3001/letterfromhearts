// Google OAuth route — POST /api/auth/google
// Flow:
//   1. Receive Firebase ID token from the React client
//   2. Verify it with Firebase Admin SDK
//   3. Find or create a GoogleUser document in MongoDB
//   4. Issue a signed JWT (same secret as existing auth) + return user object

import { Router }  from 'express'
import jwt         from 'jsonwebtoken'
import admin       from '../config/firebaseAdmin.js'
import GoogleUser  from '../models/GoogleUser.js'
import config      from '../config/index.js'

const router = Router()

// ── Shared: verify Firebase idToken ──────────────────────────────────────────
async function verifyFirebaseToken(idToken) {
  return admin.auth().verifyIdToken(idToken)
}

// ── POST /api/auth/google-signup ──────────────────────────────────────────────
// Creates a new Google account. Requires role. Returns 409 if user exists.
router.post('/google-signup', async (req, res) => {
  try {
    const { idToken, role } = req.body

    if (!idToken) return res.status(400).json({ error: 'idToken is required.' })

    const validRoles = ['seeker', 'listener', 'both']
    if (!role || !validRoles.includes(role)) {
      return res.status(400).json({ error: 'Account type is required.' })
    }

    if (!admin.apps.length) {
      return res.status(503).json({ error: 'Google login is not configured on the server.' })
    }

    let decodedToken
    try {
      decodedToken = await verifyFirebaseToken(idToken)
    } catch {
      return res.status(401).json({ error: 'Invalid or expired Google token.' })
    }

    const { uid, name, email, picture: avatar } = decodedToken

    if (!email) return res.status(400).json({ error: 'Google account must have an email address.' })

    // Check if user already exists (by uid or email)
    const existing = await GoogleUser.findOne({ $or: [{ uid }, { email: email.toLowerCase() }] })
    if (existing) {
      return res.status(409).json({ error: 'An account with this Google account already exists. Please log in.' })
    }

    // Create new user with the provided role
    const googleUser = await GoogleUser.create({
      uid,
      name:   name  || 'Google User',
      email:  email.toLowerCase(),
      avatar: avatar || '',
      role,
    })

    const token = jwt.sign(
      { id: googleUser._id.toString(), provider: 'google' },
      config.jwtSecret,
      { expiresIn: '7d' }
    )

    return res.status(201).json({ success: true, token, user: googleUser.toSafeObject() })

  } catch (err) {
    console.error('[google-signup] Unexpected error:', err)
    return res.status(500).json({ error: 'Server error during Google sign-up.' })
  }
})

// ── POST /api/auth/google-login ───────────────────────────────────────────────
// Logs in an existing Google user. Never creates a new account.
router.post('/google-login', async (req, res) => {
  try {
    const { idToken } = req.body

    if (!idToken) return res.status(400).json({ error: 'idToken is required.' })

    if (!admin.apps.length) {
      return res.status(503).json({ error: 'Google login is not configured on the server.' })
    }

    let decodedToken
    try {
      decodedToken = await verifyFirebaseToken(idToken)
    } catch {
      return res.status(401).json({ error: 'Invalid or expired Google token.' })
    }

    const { uid, name, email, picture: avatar } = decodedToken

    // Find by uid first, then by email
    let googleUser = await GoogleUser.findOne({ uid })
    if (!googleUser && email) {
      googleUser = await GoogleUser.findOne({ email: email.toLowerCase() })
    }

    if (!googleUser) {
      return res.status(404).json({ error: 'No account found. Please sign up first.' })
    }

    // Refresh name/avatar from Google
    googleUser.name   = name   || googleUser.name
    googleUser.avatar = avatar || googleUser.avatar
    if (uid !== googleUser.uid) googleUser.uid = uid
    await googleUser.save()

    const token = jwt.sign(
      { id: googleUser._id.toString(), provider: 'google' },
      config.jwtSecret,
      { expiresIn: '7d' }
    )

    return res.status(200).json({ success: true, token, user: googleUser.toSafeObject() })

  } catch (err) {
    console.error('[google-login] Unexpected error:', err)
    return res.status(500).json({ error: 'Server error during Google login.' })
  }
})

// ── POST /api/auth/google (legacy — kept for backward compat) ─────────────────
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body

    if (!idToken) {
      return res.status(400).json({ error: 'idToken is required.' })
    }

    // Guard: Firebase Admin must be initialised (requires serviceAccountKey.json)
    if (!admin.apps.length) {
      return res.status(503).json({
        error: 'Google login is not configured on the server. Please add serviceAccountKey.json.',
      })
    }

    // 1. Verify the token with Firebase Admin
    let decodedToken
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken)
    } catch {
      return res.status(401).json({ error: 'Invalid or expired Google token.' })
    }

    const { uid, name, email, picture: avatar } = decodedToken

    if (!email) {
      return res.status(400).json({ error: 'Google account must have an email address.' })
    }

    // 2. Find existing user or create a new one (upsert by Firebase UID)
    let googleUser = await GoogleUser.findOne({ uid })

    if (!googleUser) {
      // New Google user — also check if the email already belongs to a GoogleUser
      // (handles edge case: same email, different UID)
      googleUser = await GoogleUser.findOne({ email: email.toLowerCase() })

      if (googleUser) {
        // Email already exists — update UID in case it changed (rare)
        googleUser.uid    = uid
        googleUser.avatar = avatar || googleUser.avatar
        googleUser.name   = name   || googleUser.name
        await googleUser.save()
      } else {
        // Brand-new user
        googleUser = await GoogleUser.create({
          uid,
          name:  name  || 'Google User',
          email: email.toLowerCase(),
          avatar: avatar || '',
        })
      }
    } else {
      // Existing user — refresh name/avatar from Google in case they changed
      googleUser.name   = name   || googleUser.name
      googleUser.avatar = avatar || googleUser.avatar
      await googleUser.save()
    }

    // 3. Sign a JWT — payload includes provider so the auth middleware can
    //    route lookups to the correct model
    const token = jwt.sign(
      {
        id:       googleUser._id.toString(),
        provider: 'google',
      },
      config.jwtSecret,
      { expiresIn: '7d' }
    )

    // 4. Return token + safe user object (matches the shape the frontend expects)
    return res.status(200).json({
      success: true,
      token,
      user: googleUser.toSafeObject(),
    })

  } catch (err) {
    console.error('[authGoogle] Unexpected error:', err)
    return res.status(500).json({ error: 'Server error during Google authentication.' })
  }
})

export default router
