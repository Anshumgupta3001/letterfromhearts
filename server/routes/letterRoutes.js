import { Router } from 'express'
import {
  getLetters,
  getStrangerFeed,
  getLetterById,
  createLetter,
  markLetterRead,
  updateLetter,
  deleteLetter,
} from '../controllers/letterController.js'
import { protect } from '../middlewares/auth.js'

const router = Router()

router.use(protect)

// Static routes BEFORE /:id to avoid param collision
router.get('/stranger-feed', getStrangerFeed)

router.get('/',           getLetters)
router.get('/:id',        getLetterById)
router.post('/',          createLetter)
router.post('/:id/read',  markLetterRead)
router.put('/:id',        updateLetter)
router.delete('/:id',     deleteLetter)

export default router
