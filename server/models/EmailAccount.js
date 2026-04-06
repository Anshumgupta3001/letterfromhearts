import mongoose from 'mongoose'

const emailAccountSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    emailAddress: { type: String, required: true, lowercase: true, trim: true },
    provider: { type: String, default: 'smtp' },
    status: { type: String, default: 'connected' },
    smtp: {
      host: String,
      port: Number,
      secure: Boolean,
      username: String,
      password: String, // AES-256 encrypted
    },
    defaultFrom: String,
    connectedAt: { type: Date, default: Date.now },
    lastVerified: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

// Compound unique: one address per user
emailAccountSchema.index({ userId: 1, emailAddress: 1 }, { unique: true })

export default mongoose.model('EmailAccount', emailAccountSchema)
