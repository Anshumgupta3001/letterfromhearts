import User from '../models/User.js'

const ANSWER_KEYS = [
  'ageRange', 'identity', 'profession', 'unsaidFeelings',
  'unfinishedRelationship', 'writingExperience', 'feelingHeard',
  'unspokenReason', 'selfTreatment', 'writingBenefit', 'supportStyle', 'writingRelief',
]

// POST /api/onboarding
// Saves answers and marks the user's onboarding as complete, partial, or skipped.
//
// Body fields:
//   skip?: boolean   — true when the user clicked "Skip for now"
//   ageRange?, identity?, … — any subset of the 12 answer keys
//
// Status rules:
//   all 12 answered AND skip != true  → 'completed'
//   some answered (skip or mid-flow)  → 'partially_completed'
//   skip with zero answers            → 'skipped'
export async function completeOnboarding(req, res) {
  const userId = req.user._id
  const skip   = req.body.skip === true

  const answers = {}
  for (const key of ANSWER_KEYS) {
    answers[key] = typeof req.body[key] === 'string' ? req.body[key].trim() : ''
  }

  const answeredCount = Object.values(answers).filter(v => v !== '').length

  let onboardingStatus
  if (!skip && answeredCount === ANSWER_KEYS.length) {
    onboardingStatus = 'completed'
  } else if (answeredCount === 0) {
    onboardingStatus = 'skipped'
  } else {
    onboardingStatus = 'partially_completed'
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { hasCompletedOnboarding: true, onboardingAnswers: answers, onboardingStatus },
    { new: true }
  )

  if (!user) return res.status(404).json({ error: 'User not found.' })

  res.json({ success: true, user: user.toSafeObject() })
}
