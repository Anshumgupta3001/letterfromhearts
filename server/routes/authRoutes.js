import { Router } from 'express'
import { signup, login, getMe, updateMe } from '../controllers/authController.js'
import { protect } from '../middlewares/auth.js'

const router = Router()

router.post('/signup', signup)
router.post('/login',  login)
router.get('/me',      protect, getMe)
router.patch('/me',    protect, updateMe)

export default router
