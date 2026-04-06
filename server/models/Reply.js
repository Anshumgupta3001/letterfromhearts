/**
 * Reply model placeholder.
 * MongoDB / Mongoose connection is intentionally excluded.
 */

export const ReplySchema = {
  id: String,
  role: String,
  status: String,   // 'waiting' | 'new-reply' | 'closed'
  mood: String,
  moodLabel: String,
  emoji: String,
  sal: String,
  exc: String,
  tags: [String],
  timeAgo: String,
  seekerLetter: Object,
  myReply: Object,
  theirReply: Object,
  closed: Boolean,
}
