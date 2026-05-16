import User from '../models/User.js'

const ANSWER_KEYS = [
  'ageRange', 'identity', 'profession', 'unsaidFeelings',
  'unfinishedRelationship', 'writingExperience', 'feelingHeard',
  'unspokenReason', 'selfTreatment', 'writingBenefit', 'supportStyle', 'writingRelief',
]

// POST /api/onboarding
// Saves answers and marks the user's onboarding as complete.
// Skipping is treated the same — we still mark it complete so it never shows again.
export async function completeOnboarding(req, res) {
  const userId = req.user._id
  const answers = {}
  for (const key of ANSWER_KEYS) {
    answers[key] = typeof req.body[key] === 'string' ? req.body[key].trim() : ''
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { hasCompletedOnboarding: true, onboardingAnswers: answers },
    { new: true }
  )

  if (!user) return res.status(404).json({ error: 'User not found.' })

  res.json({ success: true, user: user.toSafeObject() })
}
