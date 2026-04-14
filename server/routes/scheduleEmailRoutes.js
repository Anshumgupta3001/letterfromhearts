import { Router } from 'express'
import { scheduleEmail } from '../controllers/scheduleEmailController.js'
import { protect } from '../middlewares/auth.js'

const router = Router()

router.post('/', protect, scheduleEmail)

export default router
