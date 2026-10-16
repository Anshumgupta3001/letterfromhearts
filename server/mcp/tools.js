import { getMood, moodMenu } from './moods.js'
import { draftSchema, writeSchema, listSchema, formatZodError, draftWarnings } from './validation.js'

const ok   = text => ({ content: [{ type: 'text', text }] })
const fail = text => ({ content: [{ type: 'text', text }], isError: true })

function moodLabel(id) {
  const m = getMood(id)
  return m ? `${m.emoji} ${m.label} (${m.id})` : id || 'none'
}

// deps: { Letter, getUser, checkFieldsSafety, MSG_FLAGGED, MSG_UNAVAILABLE }
// They are passed in so this file never touches the database by itself.
export function createHandlers({ Letter, getUser, checkFieldsSafety, MSG_FLAGGED, MSG_UNAVAILABLE }) {
  // ── 1. draft: never touches the database ────────────────────────────────────
  async function draftStrangerLetter(input) {
    const parsed = draftSchema.safeParse(input)
    if (!parsed.success) return fail(`Cannot prepare the draft.\n${formatZodError(parsed.error)}`)
    const { message, subject, mood } = parsed.data
    const warnings = draftWarnings(message)

    return ok([
      'DRAFT ONLY. NOTHING HAS BEEN PUBLISHED.',
      '',
      `Mood: ${moodLabel(mood)}`,
      `Subject: ${subject ?? 'A letter from my heart (LFH default)'}`,
      `Suggested tone for this mood: ${getMood(mood).tone}`,
      '',
      '----- LETTER -----',
      message,
      '----- END -----',
      '',
      `Length: ${message.length} characters`,
      ...(warnings.length ? ['', 'Please check with the user:', ...warnings.map(w => `- ${w}`)] : []),
      '',
      'Next step for Claude: show this complete draft (mood, subject and full letter) to the user and ask whether to PUBLISH it or REVISE it.',
      'Do NOT call write_stranger_letter until the user explicitly says to publish. If they change the mood or the text, produce a new draft and ask for confirmation again.',
    ].join('\n'))
  }

  // ── 2. write: the only tool that saves a letter. Same rules as POST /api/letters ──
  async function writeStrangerLetter(input) {
    const parsed = writeSchema.safeParse(input)
    if (!parsed.success) return fail(`NOT PUBLISHED. Invalid input.\n${formatZodError(parsed.error)}`)
    const { message, subject, mood } = parsed.data

    try {
      const user = await getUser()
      if (!user) return fail('NOT PUBLISHED. MCP_USER_EMAIL does not match any LFH account.')
      if ((user.role || 'both') === 'listener') return fail('NOT PUBLISHED. Listener accounts cannot write Caring Stranger letters.')

      try {
        await checkFieldsSafety(subject, message)
      } catch (err) {
        return fail(`NOT PUBLISHED. ${err.moderation ? MSG_FLAGGED : MSG_UNAVAILABLE}`)
      }

      const letter = await Letter.create({
        userId: user._id,
        type: 'stranger',
        subject: subject || 'A letter from my heart',
        message,
        status: 'saved',
        mood,
      })

      return ok([
        'PUBLISHED. The letter was saved to LFH.',
        `Letter ID: ${letter._id}`,
        `Type: ${letter.type}`,
        `Mood: ${moodLabel(letter.mood)}`,
        `Subject: ${letter.subject}`,
        `Status: ${letter.status}`,
        `Created: ${letter.createdAt?.toISOString?.() ?? 'unknown'}`,
      ].join('\n'))
    } catch (err) {
      console.error('[mcp] write_stranger_letter failed:', err.message)
      return fail('NOT PUBLISHED (server error). Run list_my_letters to check before retrying, so it is not published twice.')
    }
  }

  // ── 3. list: read-only summary of the account's own letters ─────────────────
  async function listMyLetters(input = {}) {
    const parsed = listSchema.safeParse(input)
    if (!parsed.success) return fail(`Invalid input.\n${formatZodError(parsed.error)}`)
    const { type, limit = 10 } = parsed.data

    try {
      const user = await getUser()
      if (!user) return fail('MCP_USER_EMAIL does not match any LFH account.')

      const filter = { userId: user._id, ...(type ? { type } : {}) }
      const [rows, total] = await Promise.all([
        Letter.find(filter).sort({ createdAt: -1 }).limit(limit).select('type subject mood status createdAt').lean(),
        Letter.countDocuments(filter),
      ])
      if (!rows.length) return ok(`No letters found${type ? ` of type "${type}"` : ''}.`)

      const lines = rows.map((l, i) => {
        const date = l.createdAt ? new Date(l.createdAt).toISOString().slice(0, 16).replace('T', ' ') + ' UTC' : 'unknown date'
        return `${i + 1}. [${l._id}] "${l.subject ?? ''}"\n   ${l.type} · ${l.mood ? moodLabel(l.mood) : 'no mood'} · ${date} · status: ${l.status}`
      })
      return ok([`Showing ${rows.length} of ${total} letters (newest first)${type ? `, type: ${type}` : ''}:`, '', ...lines].join('\n'))
    } catch (err) {
      console.error('[mcp] list_my_letters failed:', err.message)
      return fail('Could not list letters (server error).')
    }
  }

  return { draftStrangerLetter, writeStrangerLetter, listMyLetters }
}

export const TOOL_DESCRIPTIONS = {
  draft: [
    'Prepare a draft Caring Stranger letter for the user to review. Does NOT publish anything.',
    'Workflow: (1) the user must choose one of the six LFH moods in chat BEFORE you draft. If they did not clearly name one, show this numbered list and ask them to pick; never choose for them:',
    moodMenu(),
    '(2) Write a warm, empathetic, respectful letter to an unknown reader in a tone that fits the mood, then call this tool with the full letter text. (3) Show the user the complete draft and ask whether to publish or revise.',
  ].join('\n'),
  write: [
    "PUBLISH a Caring Stranger letter to the real LFH stranger feed using the user's account. This reaches real people and cannot be undone through this tool.",
    'Only call after the user has (a) chosen a mood, (b) seen the complete draft and (c) explicitly confirmed they want to publish it. Selecting a mood is NOT confirmation to publish. If the user later changes the mood or text, re-draft and get confirmation again.',
    'Set user_approved to true only when that explicit confirmation happened. Report the tool result exactly; if it says NOT PUBLISHED, tell the user so.',
  ].join('\n'),
  list: "List the user's own LFH letters (newest first) with ID, subject, type, mood, date and status. Optional type filter: stranger, personal or sent. Read-only; does not show letter text.",
}
