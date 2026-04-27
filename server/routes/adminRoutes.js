import { Router }          from 'express'
import { verifyAdminKey }   from '../middlewares/adminAuth.js'
import { getAdminAnalytics, getAdminLetters } from '../controllers/adminController.js'

const router = Router()

// All admin routes require the secret key — no JWT, intentionally standalone
router.get('/analytics', verifyAdminKey, getAdminAnalytics)
router.get('/letters',   verifyAdminKey, getAdminLetters)

export default router
