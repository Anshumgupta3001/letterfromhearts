import Letter from '../models/Letter.js'

// GET /api/letters?type=personal|sent|stranger  — current user's letters, filtered by type
export async function getLetters(req, res) {
  const filter = { userId: req.user._id }
  if (req.query.type) filter.type = req.query.type

  const letters = await Letter.find(filter).sort({ createdAt: -1 })
  res.json({ success: true, data: letters })
}

// GET /api/letters/stranger-feed  — community feed for listeners/both
// - Seeker role: returns empty (they can't read the feed)
// - Listener/Both: returns unread letters OR letters already read by this user
// - Both role: also filters out own letters
export async function getStrangerFeed(req, res) {
  const userId = req.user._id
  const role   = req.user.role || 'both'

  // Seekers cannot read the stranger feed
  if (role === 'seeker') {
    return res.json({ success: true, data: [] })
  }

  // Fetch: unread (globally) OR already read by this specific user
  const letters = await Letter.find({
    type: 'stranger',
    $or: [
      { isRead: false },
      { readBy: userId },
    ],
  })
    .sort({ createdAt: -1 })
    .select('-fromEmail -toEmail')

  const data = letters
    .map(l => {
      const obj     = l.toObject()
      const hasRead = (l.readBy || []).some(id => id.toString() === userId.toString())
      delete obj.readBy // never expose the full array
      return {
        ...obj,
        isOwner: l.userId.toString() === userId.toString(),
        hasRead,
      }
    })
    // 'both' role cannot see their own stranger letters in the feed
    .filter(l => role !== 'both' || !l.isOwner)

  res.json({ success: true, data })
}

// GET /api/letters/:id
export async function getLetterById(req, res) {
  const letter = await Letter.findOne({ _id: req.params.id, userId: req.user._id })
  if (!letter) return res.status(404).json({ error: 'Letter not found.' })
  res.json({ success: true, data: letter })
}

// POST /api/letters  — save a personal or stranger letter
export async function createLetter(req, res) {
  const { type, subject, message, mood } = req.body
  const role = req.user.role || 'both'

  // Listeners cannot write stranger letters
  if (type === 'stranger' && role === 'listener') {
    return res.status(403).json({ error: 'Listeners cannot write Caring Stranger letters.' })
  }

  const allowedTypes = ['personal', 'stranger']
  const letterType   = allowedTypes.includes(type) ? type : 'personal'

  if (!message?.trim()) return res.status(400).json({ error: 'Message cannot be empty.' })

  const defaults = {
    personal: { subject: 'A personal letter',      status: 'saved' },
    stranger: { subject: 'A letter from my heart', status: 'saved' },
  }

  const letter = await Letter.create({
    userId:  req.user._id,
    type:    letterType,
    subject: subject?.trim() || defaults[letterType].subject,
    message: message.trim(),
    status:  defaults[letterType].status,
    mood:    mood?.trim() || '',
  })

  res.status(201).json({ success: true, data: letter })
}

// POST /api/letters/:id/read  — one-time global read mark
// Once read by any listener, the letter is marked globally (isRead: true)
// and hidden from all OTHER listeners
export async function markLetterRead(req, res) {
  const userId = req.user._id
  const letter = await Letter.findById(req.params.id)

  if (!letter) return res.status(404).json({ error: 'Letter not found.' })
  if (letter.type !== 'stranger') return res.status(400).json({ error: 'Only stranger letters support read tracking.' })

  const alreadyReadByUser = (letter.readBy || []).some(id => id.toString() === userId.toString())

  // Already opened by this exact user — just return success (idempotent)
  if (alreadyReadByUser) {
    return res.status(403).json({ error: 'You have already read this letter.', alreadyRead: true })
  }

  // Already globally read by someone else — unavailable
  if (letter.isRead) {
    return res.status(403).json({ error: 'This letter has already been claimed by another listener.', alreadyRead: true })
  }

  // Mark globally + record who read it
  letter.isRead = true
  letter.readBy.push(userId)
  await letter.save()

  res.json({ success: true })
}

// PUT /api/letters/:id  — edit own PERSONAL letters only
export async function updateLetter(req, res) {
  const { subject, message } = req.body

  if (!message?.trim()) return res.status(400).json({ error: 'Message cannot be empty.' })

  // Only allow editing personal letters
  const letter = await Letter.findOne({ _id: req.params.id, userId: req.user._id })
  if (!letter) return res.status(404).json({ error: 'Letter not found.' })
  if (letter.type !== 'personal') return res.status(403).json({ error: 'Only personal letters can be edited.' })

  letter.subject = subject?.trim() || 'A personal letter'
  letter.message = message.trim()
  await letter.save()

  res.json({ success: true, data: letter })
}

// DELETE /api/letters/:id  — owner only, personal letters only
export async function deleteLetter(req, res) {
  const letter = await Letter.findOne({ _id: req.params.id, userId: req.user._id })
  if (!letter) return res.status(404).json({ error: 'Letter not found.' })
  if (letter.type !== 'personal') return res.status(403).json({ error: 'Only personal letters can be deleted.' })

  await letter.deleteOne()
  res.json({ success: true })
}
