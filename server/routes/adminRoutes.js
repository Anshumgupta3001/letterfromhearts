import { Router }          from 'express'
import { verifyAdminKey }   from '../middlewares/adminAuth.js'
import { getAdminAnalytics, getAdminLetters, getAdminKnownConnections, getOnboardingInsights } from '../controllers/adminController.js'
import { getAdminTherapists, updateTherapistStatus, deleteTherapist } from '../controllers/therapistController.js'

const router = Router()

// All admin routes require the secret key — no JWT, intentionally standalone
router.get('/analytics',            verifyAdminKey, getAdminAnalytics)
router.get('/letters',              verifyAdminKey, getAdminLetters)
router.get('/known-connections',    verifyAdminKey, getAdminKnownConnections)
router.get('/onboarding-insights',  verifyAdminKey, getOnboardingInsights)

// Therapist management
router.get('/therapists',                  verifyAdminKey, getAdminTherapists)
router.patch('/therapists/:id/status',     verifyAdminKey, updateTherapistStatus)
router.delete('/therapists/:id',           verifyAdminKey, deleteTherapist)

export default router
