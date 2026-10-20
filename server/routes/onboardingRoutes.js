import { Router } from 'express'
import { protect } from '../middlewares/auth.js'
import { completeOnboarding } from '../controllers/onboardingController.js'

const router = Router()

router.post('/', protect, completeOnboarding)

export default router
