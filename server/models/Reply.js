import mongoose from 'mongoose'

const replySchema = new mongoose.Schema(
  {
    parentLetterId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Letter',
      required: true,
      index:    true,
    },
    listenerId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },
    message: {
      type:      String,
      required:  true,
      maxlength: 3000,
    },
  },
  { timestamps: true }
)

// Compound index — one reply per listener per letter
replySchema.index({ parentLetterId: 1, listenerId: 1 }, { unique: true })

export default mongoose.model('Reply', replySchema)
