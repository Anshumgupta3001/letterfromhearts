import { Router } from 'express'
import { reportIssue } from '../controllers/reportIssueController.js'
import { protect } from '../middlewares/auth.js'

const router = Router()

router.post('/', protect, reportIssue)

export default router
