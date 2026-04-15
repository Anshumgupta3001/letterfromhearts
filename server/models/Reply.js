import mongoose from 'mongoose'

const { Schema } = mongoose

// Individual message within a conversation
const messageSchema = new Schema({
  sender:    { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content:   { type: String, required: true, maxlength: 1000 },
  createdAt: { type: Date, default: Date.now },
}, { _id: true })

// One conversation doc per listener-letter pair
const replySchema = new Schema({
  parentLetterId: { type: Schema.Types.ObjectId, ref: 'Letter', required: true, index: true },
  listenerId:     { type: Schema.Types.ObjectId, ref: 'User',   required: true },
  messages:       { type: [messageSchema], default: [] },
  isEnded:        { type: Boolean, default: false },
}, { timestamps: true })

// Compound unique index — one conversation per listener per letter
replySchema.index({ parentLetterId: 1, listenerId: 1 }, { unique: true })

export default mongoose.model('Reply', replySchema)
