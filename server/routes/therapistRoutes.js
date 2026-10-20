import { Router } from 'express'
import {
  getTherapists,
  getTherapistStats,
  getSpecializations,
  applyAsTherapist,
} from '../controllers/therapistController.js'
import { apiLimiter } from '../middlewares/rateLimiters.js'

const router = Router()

// Order matters: /stats and /specializations before /:id-style routes
router.get('/stats',           getTherapistStats)
router.get('/specializations', getSpecializations)
router.get('/',                getTherapists)
router.post('/apply',          apiLimiter, applyAsTherapist)

export default router
