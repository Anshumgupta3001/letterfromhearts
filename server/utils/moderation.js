import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

/**
 * Checks text against OpenAI's moderation API.
 * Throws with a user-facing message if the content is flagged.
 */
export async function checkContentSafety(text) {
  if (!process.env.OPENAI_API_KEY) return // skip gracefully if key not configured

  try {
    const response = await openai.moderations.create({
      model: 'omni-moderation-latest',
      input: text,
    })

    if (response.results[0].flagged) {
      const err = new Error('Content not allowed')
      err.moderation = true
      throw err
    }
  } catch (err) {
    if (err.moderation) throw err
    // Network/API error — fail open (don't block the user due to OpenAI outage)
    console.error('[moderation] OpenAI API error:', err.message)
  }
}
