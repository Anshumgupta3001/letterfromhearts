import mongoose from 'mongoose'

const reportSchema = new mongoose.Schema(
  {
    userId:         { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    userEmail:      { type: String, required: true },
    userName:       { type: String, default: '' },
    reportedUserId: { type: mongoose.Schema.Types.ObjectId, default: null },
    letterId:       { type: mongoose.Schema.Types.ObjectId, default: null },
    type:           { type: String, default: 'other' },   // bug | content | account | feature | other
    subject:        { type: String, required: true },
    description:    { type: String, default: '' },
    status:         { type: String, enum: ['pending', 'resolved'], default: 'pending', index: true },
    resolvedAt:     { type: Date, default: null },
    resolvedNote:   { type: String, default: '' },        // optional note from admin
  },
  { timestamps: true }
)

export default mongoose.model('Report', reportSchema)
