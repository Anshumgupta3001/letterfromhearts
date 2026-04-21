import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    username: {
      type:      String,
      required:  true,
      unique:    true,
      lowercase: true,
      trim:      true,
      minlength: 3,
      maxlength: 20,
      match:     [/^[a-z0-9_]+$/, 'Username may only contain letters, numbers, and underscores.'],
    },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, default: '' },   // empty for Google users
    otp:      { type: String, default: '1111' },

    // Google OAuth fields (populated only for authProvider: 'google')
    uid:          { type: String, default: null, trim: true },
    avatar:       { type: String, default: '' },
    authProvider: { type: String, enum: ['email', 'google'], default: 'email' },

    // Role system
    role:      { type: String, enum: ['seeker', 'listener', 'both'], default: 'both' },
    // Email mode: 'custom' = use own SMTP, 'system' = use platform email
    emailMode: { type: String, enum: ['custom', 'system'], default: 'custom' },
    // Acquisition channel (email signups only)
    heardFrom: { type: String, default: '' },
  },
  { timestamps: true }
)

// Sparse unique index on uid — allows null for email users, enforces uniqueness for Google users
userSchema.index({ uid: 1 }, { unique: true, sparse: true })

userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return
  this.password = await bcrypt.hash(this.password, 12)
})

userSchema.methods.matchPassword = function (plain) {
  if (!this.password) return Promise.resolve(false)
  return bcrypt.compare(plain, this.password)
}

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject()
  delete obj.password
  delete obj.otp
  delete obj.__v
  return obj
}

export default mongoose.model('User', userSchema)
