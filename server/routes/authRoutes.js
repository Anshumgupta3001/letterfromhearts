import { Router } from 'express'
import { signup, login, getMe, updateMe } from '../controllers/authController.js'
import { protect }        from '../middlewares/auth.js'
import { requireCaptcha } from '../utils/captcha.js'
import { authLimiter }    from '../middlewares/rateLimiters.js'

const router = Router()

router.post('/signup', authLimiter, requireCaptcha, signup)
router.post('/login',  authLimiter, requireCaptcha, login)
router.get('/me',      protect, getMe)
router.patch('/me',    protect, updateMe)

export default router
