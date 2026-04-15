import { Router }                                from 'express'
import { sendMessage, endConversation, getMyReply } from '../controllers/replyController.js'
import { protect }                               from '../middlewares/auth.js'

const router = Router()

router.use(protect)

// GET  /api/replies/my?parentLetterId=:id  — fetch listener's conversation
router.get('/my', getMyReply)

// POST /api/replies/message  — send a message in a conversation
router.post('/message', sendMessage)

// POST /api/replies/end  — end the conversation (listener only)
router.post('/end', endConversation)

export default router
