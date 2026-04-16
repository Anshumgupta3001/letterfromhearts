import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema(
  {
    name:      { type: String, required: true, trim: true },
    email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:  { type: String, required: true },
    otp:       { type: String, default: '1111' },
    // Role system
    role:      { type: String, enum: ['seeker', 'listener', 'both'], default: 'both' },
    // Email mode: 'custom' = use own SMTP, 'system' = use platform email (coming soon)
    emailMode: { type: String, enum: ['custom', 'system'], default: 'custom' },
    // Acquisition channel
    heardFrom: { type: String, default: '' },
  },
  { timestamps: true }
)

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 12)
})

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password)
}

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject()
  delete obj.password
  delete obj.otp
  return obj
}

export default mongoose.model('User', userSchema)
