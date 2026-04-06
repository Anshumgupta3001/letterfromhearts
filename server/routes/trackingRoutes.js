import { Router } from 'express'
import { trackOpen, trackClick } from '../controllers/trackingController.js'

const router = Router()

// No auth middleware — these endpoints are called by email clients / browsers
router.get('/pixel', trackOpen)
router.get('/click', trackClick)

export default router
