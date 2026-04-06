import { Router } from 'express'
import { sendEmail } from '../controllers/sendEmailController.js'
import { protect } from '../middlewares/auth.js'

const router = Router()

router.post('/', protect, sendEmail)

export default router
