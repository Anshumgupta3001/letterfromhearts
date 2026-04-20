import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema(
  {
    userId:   { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, default: null },
    letterId: { type: mongoose.Schema.Types.ObjectId, default: null },
    message:  { type: String, required: true },
    type:     { type: String, default: 'general' }, // general | reply | claim | delivery | system
    isRead:    { type: Boolean, default: false, index: true },
    link:      { type: String, default: '' },
    emailSent: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
)

export default mongoose.model('Notification', notificationSchema)
