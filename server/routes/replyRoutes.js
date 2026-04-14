import { Router }                  from 'express'
import { createReply, getMyReply } from '../controllers/replyController.js'
import { protect }                 from '../middlewares/auth.js'

const router = Router()

router.use(protect)

// GET  /api/replies/my?parentLetterId=:id  — listener fetches their own reply
router.get('/my', getMyReply)

// POST /api/replies  — listener sends a reply to a claimed stranger letter
router.post('/', createReply)

export default router
