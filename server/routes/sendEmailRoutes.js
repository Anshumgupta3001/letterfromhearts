import { Router } from 'express'
import { sendEmail } from '../controllers/sendEmailController.js'
import { protect } from '../middlewares/auth.js'
import config from '../config/index.js'

const router = Router()

// Returns email addresses for display in the frontend (never passwords)
// emailFrom  — the address letters are actually sent FROM (Resend)
// systemEmail — admin/support address, shown for informational purposes only
router.get('/system-info', protect, (_req, res) => {
  res.json({
    success:     true,
    email:       config.systemEmail || null,       // legacy key — kept for backwards compat
    emailFrom:   config.emailFrom   || null,
    systemEmail: config.systemEmail || null,
  })
})

router.post('/', protect, sendEmail)

export default router
