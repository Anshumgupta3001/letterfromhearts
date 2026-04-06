import { Router } from 'express'
import {
  getMyReplies,
  getReplyById,
  createReply,
  respondToReply,
} from '../controllers/replyController.js'

const router = Router()

// GET  /api/replies           — listener's own replies (filterable by ?status=)
router.get('/', getMyReplies)

// GET  /api/replies/:id       — single reply thread
router.get('/:id', getReplyById)

// POST /api/replies           — post a reply to an open letter
router.post('/', createReply)

// POST /api/replies/:id/respond — seeker writes back to a listener
router.post('/:id/respond', respondToReply)

export default router
