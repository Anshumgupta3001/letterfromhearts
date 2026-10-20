import mongoose from 'mongoose'

const therapistSchema = new mongoose.Schema(
  {
    firstName:       { type: String, required: true, trim: true },
    lastName:        { type: String, required: true, trim: true },
    email:           { type: String, required: true, lowercase: true, trim: true, index: true },
    phone:           { type: String, default: '', trim: true },
    website:         { type: String, default: '', trim: true },
    bookingLink:     { type: String, default: '', trim: true },
    location:        { type: String, default: '', trim: true },
    specializations: [{ type: String, trim: true }],
    about:           { type: String, default: '' },
    quote:           { type: String, default: '' },
    profileImage:    { type: String, default: '' },
    licenseNumber:   { type: String, default: '', trim: true },
    sessionType:     { type: String, default: '', trim: true },
    languages:       [{ type: String, trim: true }],
    status:          { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending', index: true },
    submittedAt:     { type: Date, default: Date.now },
    reviewedAt:      { type: Date },
  },
  { timestamps: true }
)

therapistSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`
})

export default mongoose.model('Therapist', therapistSchema)
