import { z } from 'zod'
import { MOOD_IDS, moodMenu } from './moods.js'

export const MAX_MESSAGE = 8000
export const MAX_SUBJECT = 150

// Mirrors MALICIOUS_PATTERNS in server/middlewares/sanitize.js so we can fail early
// with a clear message instead of a bare "Invalid input detected." from the server.
const BLOCKED = [
  [/\.\.\//, '"../"'], [/\.\.\\/, '"..\\"'], [/<script/i, '"<script"'],
  [/javascript:/i, '"javascript:"'], [/file:\/\//i, '"file://"'],
  [/etc\/passwd/i, '"etc/passwd"'], [/win\.ini/i, '"win.ini"'],
  [/%2e%2e/i, '"%2e%2e"'], [/\u0000/, 'a null character'],
]

function noBlockedText(value) {
  return !BLOCKED.some(([re]) => re.test(value))
}
const mood = z.enum(MOOD_IDS, {
  errorMap: () => ({ message: `mood must be exactly one of the six LFH moods. Ask the user to pick one:\n${moodMenu()}` }),
})

const message = z.string().trim()
  .min(10, 'message is too short for a letter (minimum 10 characters).')
  .max(MAX_MESSAGE, `message is too long (maximum ${MAX_MESSAGE} characters).`)
  .refine(noBlockedText, { message: 'message contains text the LFH server rejects. Please rephrase.' })

// Empty subject becomes undefined so the backend applies its own default.
const subject = z.string().trim()
  .max(MAX_SUBJECT, `subject is too long (maximum ${MAX_SUBJECT} characters).`)
  .refine(noBlockedText, { message: 'subject contains text the LFH server rejects. Please rephrase.' })
  .optional()
  .transform(s => (s ? s : undefined))

export const draftShape = { message, subject, mood }

export const writeShape = {
  message,
  subject,
  mood,
  user_approved: z.literal(true, {
    errorMap: () => ({ message: 'user_approved must be true, and only after the user has seen the full draft and explicitly said to publish it.' }),
  }),
}

export const listShape = {
  type: z.enum(['stranger', 'personal', 'sent']).optional(),
  limit: z.number().int().min(1).max(50).optional(),
}

export const draftSchema = z.object(draftShape)
export const writeSchema = z.object(writeShape)
export const listSchema = z.object(listShape)

export function formatZodError(error) {
  return error.issues.map(i => `${i.path.join('.') || 'input'}: ${i.message}`).join('\n')
}

// Soft privacy checks for the draft step. Stranger letters are read by real people, so
// remind the user not to include contact details by accident. Warnings never block.
export function draftWarnings(text) {
  const warnings = []
  if (/[\w.+-]+@[\w-]+\.[\w.-]+/.test(text)) warnings.push('Contains something that looks like an email address.')
  if (/\+?\d[\d\s().-]{7,}\d/.test(text)) warnings.push('Contains something that looks like a phone number.')
  if (/https?:\/\/|www\./i.test(text)) warnings.push('Contains a web link.')
  if (text.length < 80) warnings.push('This is quite short for a heartfelt letter.')
  return warnings
}
