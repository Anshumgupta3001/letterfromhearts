// The six moods LFH supports. Source of truth: MOODS in client/src/pages/WritePage.jsx.
// The backend does not validate `mood` (it stores any string), so this list is what
// keeps letters written through MCP consistent with the web app. Keep the ids in sync.
export const MOODS = [
  { id: 'vent',      emoji: '🌧️', label: 'I need to vent', tone: 'raw, honest and unfiltered, but never cruel; the writer wants to be heard' },
  { id: 'joy',       emoji: '🌟', label: 'Pure joy',       tone: 'bright, celebratory and generous; share the happiness' },
  { id: 'love',      emoji: '💌', label: 'Love & warmth',  tone: 'tender, affectionate and reassuring' },
  { id: 'grief',     emoji: '🕯️', label: 'Grief & loss',   tone: 'quiet, gentle and unhurried; make space for the loss without trying to fix it' },
  { id: 'gratitude', emoji: '🌿', label: 'Gratitude',      tone: 'sincere, specific and appreciative' },
  { id: 'longing',   emoji: '🌙', label: 'Longing',        tone: 'wistful, soft and reflective; the ache of missing something or someone' },
]

export const MOOD_IDS = MOODS.map(m => m.id)

export function getMood(id) {
  return MOODS.find(m => m.id === id)
}

// Numbered list shown to the user, e.g. "1. 🌧️ I need to vent (vent)"
export function moodMenu() {
  return MOODS.map((m, i) => `${i + 1}. ${m.emoji} ${m.label} (${m.id})`).join('\n')
}
