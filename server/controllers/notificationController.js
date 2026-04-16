import Notification from '../models/Notification.js'

// GET /api/notifications
export async function getNotifications(req, res) {
  const notifications = await Notification.find({ userId: req.user._id })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean()

  console.log(`[Notification] GET userId:${req.user._id} → ${notifications.length} docs`)
  res.json({ success: true, data: notifications })
}

// PATCH /api/notifications/mark-all-read
export async function markAllRead(req, res) {
  await Notification.updateMany(
    { userId: req.user._id, isRead: false },
    { isRead: true }
  )
  res.json({ success: true })
}

// Internal helper called by other controllers.
// dedup:true → skip if identical (userId+senderId+letterId+type) already exists (for 'claim').
export async function createNotification({
  userId,
  senderId = null,
  letterId = null,
  message,
  type = 'general',
  link = '',
  dedup = false,
}) {
  try {
    if (dedup && senderId && letterId) {
      const exists = await Notification.findOne({ userId, senderId, letterId, type })
      if (exists) {
        console.log(`[Notification] Skipped duplicate — type:${type} userId:${userId}`)
        return exists
      }
    }

    const doc = await Notification.create({ userId, senderId, letterId, message, type, link })
    console.log(`[Notification] ✅ Created — type:${type} for userId:${userId} msg:"${message}"`)
    return doc
  } catch (err) {
    console.error(`[Notification] ❌ Create failed — type:${type} userId:${userId} error:${err.message}`)
    throw err
  }
}
