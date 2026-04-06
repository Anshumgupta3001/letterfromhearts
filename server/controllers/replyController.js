// Mock data — replace with DB queries once MongoDB is connected
const listenerReplies = [
  {
    id: 'listener-1',
    role: 'listener',
    status: 'new-reply',
    mood: 'grief',
    moodLabel: 'Grief & loss',
    emoji: '🕯️',
    sal: 'Dear Dad,',
    exc: "It's been two years since you left. I still pick up the phone sometimes...",
    tags: ['grief', 'parent'],
    timeAgo: '2h ago',
  },
  {
    id: 'listener-2',
    role: 'listener',
    status: 'new-reply',
    mood: 'joy',
    moodLabel: 'Pure joy',
    emoji: '🌟',
    sal: "Dear anyone who'll listen,",
    exc: 'I passed my CA finals today. Third attempt.',
    tags: ['milestone', 'joy'],
    timeAgo: '5h ago',
  },
  {
    id: 'listener-3',
    role: 'listener',
    status: 'waiting',
    mood: 'vent',
    moodLabel: 'Need to vent',
    emoji: '🌧️',
    sal: 'Dear whoever,',
    exc: "I have been the strong one in every relationship I've ever been in.",
    tags: ['burnout'],
    timeAgo: '18h ago',
  },
  {
    id: 'listener-4',
    role: 'listener',
    status: 'waiting',
    mood: 'longing',
    moodLabel: 'Longing',
    emoji: '🌙',
    sal: 'Dear anyone,',
    exc: "I moved to a new city six months ago and I still haven't made a single real friend.",
    tags: ['loneliness'],
    timeAgo: '2d ago',
  },
  {
    id: 'listener-5',
    role: 'listener',
    status: 'closed',
    mood: 'gratitude',
    moodLabel: 'Gratitude',
    emoji: '🌿',
    sal: 'Dear Mrs. Sharma,',
    exc: "You taught me English in Class 9. I'm a writer now.",
    tags: ['gratitude', 'teacher'],
    timeAgo: '4d ago',
    closed: true,
  },
]

// GET /api/replies
export function getMyReplies(req, res) {
  const { status } = req.query
  const filtered = status && status !== 'all'
    ? listenerReplies.filter(r => r.status === status)
    : listenerReplies

  res.json({ success: true, data: filtered, total: filtered.length })
}

// GET /api/replies/:id
export function getReplyById(req, res) {
  const reply = listenerReplies.find(r => r.id === req.params.id)
  if (!reply) {
    return res.status(404).json({ success: false, message: 'Reply not found' })
  }
  res.json({ success: true, data: reply })
}

// POST /api/replies
export function createReply(req, res) {
  const { letterId, body, anonymous } = req.body

  if (!letterId || !body) {
    return res.status(400).json({ success: false, message: 'letterId and body are required' })
  }

  const newReply = {
    id: `listener-${Date.now()}`,
    role: 'listener',
    status: 'waiting',
    letterId,
    anonymous: anonymous !== false,
    body,
    timeAgo: 'just now',
  }

  res.status(201).json({ success: true, data: newReply })
}

// POST /api/replies/:id/respond
export function respondToReply(req, res) {
  const { body, anonymous } = req.body

  if (!body) {
    return res.status(400).json({ success: false, message: 'body is required' })
  }

  res.json({
    success: true,
    message: 'Response sent successfully',
    data: { id: req.params.id, body, anonymous: anonymous !== false },
  })
}
