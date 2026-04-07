import { Router } from 'express'
import { sendEmail } from '../controllers/sendEmailController.js'
import { protect } from '../middlewares/auth.js'
import config from '../config/index.js'

const router = Router()

// Returns system email address (not the password) so the frontend can display it
router.get('/system-info', protect, (_req, res) => {
  res.json({ success: true, email: config.systemEmail || null })
})

router.post('/', protect, sendEmail)

export default router
