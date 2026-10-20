import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const TIMEOUT_MS = 10_000

// User-facing messages kept here so controllers stay DRY
export const MSG_FLAGGED     = 'Please keep this space kind and respectful 💛'
export const MSG_UNAVAILABLE = 'Safety check temporarily unavailable. Please try again in a moment.'

/**
 * Checks text against OpenAI's moderation API.
 *
 * FAIL-CLOSED: throws on flagged content AND on any API/network/timeout failure.
 * Callers must never silently swallow the thrown error — content must not be saved.
 *
 * Thrown error shapes:
 *   err.moderation = true  → content was flagged   (400)
 *   err.status     = 503   → API unavailable        (503)
 */
export async function checkContentSafety(text) {
  if (!text?.trim()) return // nothing to check

  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ Moderation API unavailable: OPENAI_API_KEY not configured')
    const err = new Error(MSG_UNAVAILABLE)
    err.status = 503
    throw err
  }

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => {
      const e = new Error('Moderation API timed out')
      e.timeout = true
      reject(e)
    }, TIMEOUT_MS)
  )

  try {
    const response = await Promise.race([
      openai.moderations.create({ model: 'omni-moderation-latest', input: text }),
      timeoutPromise,
    ])

    if (response.results[0].flagged) {
      console.warn('🚫 Harmful content blocked — categories:', response.results[0].categories)
      const err = new Error('Content not allowed')
      err.moderation = true
      throw err
    }
  } catch (err) {
    if (err.moderation) throw err // flagged content — re-throw as-is

    // API error or timeout — fail closed
    console.error('❌ Moderation API unavailable:', err.message)
    const apiErr = new Error(MSG_UNAVAILABLE)
    apiErr.status = 503
    throw apiErr
  }
}

/**
 * Convenience: run checkContentSafety on multiple fields in sequence.
 * Throws on the first failure.
 */
export async function checkFieldsSafety(...fields) {
  for (const field of fields) {
    if (field?.trim()) await checkContentSafety(field.trim())
  }
}
