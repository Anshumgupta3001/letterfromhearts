import mongoose from 'mongoose'

const letterSchema = new mongoose.Schema(
  {
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type:       { type: String, enum: ['sent', 'personal', 'stranger'], default: 'sent' },
    fromEmail:  { type: String, default: '' },
    toEmail:    { type: String, default: '' },
    subject:    { type: String, default: 'A letter from my heart' },
    message:    { type: String, required: true },
    // Tracking — only populated for type:'sent' emails
    trackingId: { type: String, index: true, sparse: true },
    status:     { type: String, default: 'sent' }, // sent | opened | clicked | failed | saved | scheduled
    openedAt:   { type: Date },
    clickedAt:  { type: Date },
    clickCount: { type: Number, default: 0 },
    // One-time read tracking — for type:'stranger' letters
    readBy:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // Global one-time read flag — once true, letter hidden from ALL other listeners
    isRead:     { type: Boolean, default: false },
    // Claim system — mirrors isRead/readBy but with richer metadata
    isClaimed:  { type: Boolean, default: false, index: true },
    claimedBy:  {
      userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      claimedAt: { type: Date },
    },
    readCount:  { type: Number, default: 0 },
    // Unified open tracking — one entry per unique user; sources tracks HOW they opened
    openedBy: [
      {
        userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        sources:  { type: [String], default: [] },   // 'email' | 'platform'
        openedAt: { type: Date, default: Date.now },
      },
    ],
    // Mood tag saved with letter
    mood:         { type: String, default: '' },
    // Resend delivery tracking — only for system-sent letters
    resendEmailId: { type: String, index: true, sparse: true },
    isDelivered:   { type: Boolean, default: false },
    deliveredAt:   { type: Date },
    // Scheduling — populated for type:'sent' scheduled letters
    isScheduled:  { type: Boolean, default: false, index: true },
    scheduledFor: { type: Date },
  },
  { timestamps: true }
)

export default mongoose.model('Letter', letterSchema)
