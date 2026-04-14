import { Router }          from 'express'
import { verifyAdminKey }   from '../middlewares/adminAuth.js'
import { getAdminAnalytics } from '../controllers/adminController.js'

const router = Router()

// All admin routes require the secret key — no JWT, intentionally standalone
router.get('/analytics', verifyAdminKey, getAdminAnalytics)

export default router
