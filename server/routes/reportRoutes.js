import { Router }           from 'express'
import { protect }           from '../middlewares/auth.js'
import { verifyAdminKey }    from '../middlewares/adminAuth.js'
import {
  createReport,
  getReports,
  updateReportStatus,
  exportReports,
} from '../controllers/reportController.js'

const router = Router()

// ── User-facing ───────────────────────────────────────────────────────────────
router.post('/', protect, createReport)

// ── Admin-only ────────────────────────────────────────────────────────────────
router.get('/',              verifyAdminKey, getReports)
router.get('/export',        verifyAdminKey, exportReports)
router.patch('/:id/status',  verifyAdminKey, updateReportStatus)

export default router
