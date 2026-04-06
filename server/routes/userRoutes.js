import { Router } from 'express'
import { getMe, getMyStats } from '../controllers/userController.js'

const router = Router()

// GET /api/users/me       — current user profile
router.get('/me', getMe)

// GET /api/users/me/stats — weekly stats + totals
router.get('/me/stats', getMyStats)

export default router
