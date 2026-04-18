import { Router } from 'express'
import {
  getLetters,
  getStrangerFeed,
  getLetterById,
  getReceivedLetters,
  createLetter,
  markLetterRead,
  markLetterOpen,
  updateLetter,
  deleteLetter,
  getAnalytics,
  getLetterReplies,
} from '../controllers/letterController.js'
import { protect } from '../middlewares/auth.js'

const router = Router()

router.use(protect)

// Static routes BEFORE /:id to avoid param collision
router.get('/stranger-feed', getStrangerFeed)
router.get('/analytics',     getAnalytics)
router.get('/received',      getReceivedLetters)

router.get('/',                getLetters)
router.get('/:id/replies',    getLetterReplies)
router.get('/:id',            getLetterById)
router.post('/',              createLetter)
router.post('/:id/read',      markLetterRead)
router.post('/:id/open',      markLetterOpen)
router.put('/:id',            updateLetter)
router.delete('/:id',         deleteLetter)

export default router
