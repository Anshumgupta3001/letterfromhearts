// GoogleUser model — stores users who sign in via Google OAuth.
// Intentionally separate from the existing User model so that the
// existing email/password flow is never touched.

import mongoose from 'mongoose'

const googleUserSchema = new mongoose.Schema(
  {
    // Firebase UID — unique identifier from Google/Firebase
    uid: {
      type:     String,
      required: true,
      unique:   true,
      trim:     true,
    },

    name: {
      type:    String,
      default: '',
      trim:    true,
    },

    email: {
      type:      String,
      required:  true,
      unique:    true,
      lowercase: true,
      trim:      true,
    },

    // Google profile picture URL
    avatar: {
      type:    String,
      default: '',
    },

    // Hard-coded provider tag so we can identify the origin of any JWT
    authProvider: {
      type:    String,
      default: 'google',
    },

    // Role system — same values as the existing User model
    role: {
      type:    String,
      enum:    ['seeker', 'listener', 'both'],
      default: 'both',
    },

    // Email mode — matching the existing User model's field
    emailMode: {
      type:    String,
      enum:    ['custom', 'system'],
      default: 'custom',
    },
  },
  { timestamps: true }
)

// Returns a safe object the frontend can store (no sensitive fields)
googleUserSchema.methods.toSafeObject = function () {
  const obj = this.toObject()
  delete obj.__v
  return obj
}

export default mongoose.model('GoogleUser', googleUserSchema)
