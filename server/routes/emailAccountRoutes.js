import { Router } from 'express'
import { upsertSmtpAccount, getEmailAccounts, deleteEmailAccount } from '../controllers/emailAccountController.js'
import { protect } from '../middlewares/auth.js'

const router = Router()

router.use(protect)

router.post('/smtp', upsertSmtpAccount)
router.get('/', getEmailAccounts)
router.delete('/:id', deleteEmailAccount)

export default router
