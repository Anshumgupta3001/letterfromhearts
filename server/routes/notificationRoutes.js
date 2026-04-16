import { Router } from 'express'
import { getNotifications, markAllRead } from '../controllers/notificationController.js'
import { protect } from '../middlewares/auth.js'

const router = Router()

router.use(protect)

router.get('/',               getNotifications)
router.patch('/mark-all-read', markAllRead)

export default router
