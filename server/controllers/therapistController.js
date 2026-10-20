import Therapist from '../models/Therapist.js'

// ── Public endpoints ─────────────────────────────────────────────────────────

// GET /api/therapists?specialization=grief
export async function getTherapists(req, res) {
  try {
    const { specialization } = req.query
    const filter = { status: 'verified' }
    if (specialization && specialization !== 'all') {
      filter.specializations = { $elemMatch: { $regex: new RegExp(`^${specialization}$`, 'i') } }
    }
    const therapists = await Therapist.find(filter).sort({ createdAt: -1 }).lean()
    res.json({ success: true, data: therapists })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// GET /api/therapists/stats
export async function getTherapistStats(req, res) {
  try {
    const verified = await Therapist.find({ status: 'verified' }, 'location specializations').lean()
    const count    = verified.length
    const regions  = new Set(
      verified.map(t => (t.location || '').split(',').pop().trim()).filter(Boolean)
    ).size
    const specs = new Set(verified.flatMap(t => t.specializations || [])).size
    res.json({ success: true, data: { verified: count, regions, specializations: specs } })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// GET /api/therapists/specializations — for dynamic filter pills
export async function getSpecializations(req, res) {
  try {
    const therapists = await Therapist.find({ status: 'verified' }, 'specializations').lean()
    const set = new Set(therapists.flatMap(t => t.specializations || []))
    res.json({ success: true, data: [...set].sort() })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// POST /api/therapists/apply
export async function applyAsTherapist(req, res) {
  try {
    const {
      firstName, lastName, email, phone, website, bookingLink,
      location, specializations, about, quote, profileImage,
      licenseNumber, sessionType, languages,
    } = req.body

    if (!firstName?.trim())     return res.status(400).json({ success: false, error: 'First name is required.' })
    if (!lastName?.trim())      return res.status(400).json({ success: false, error: 'Last name is required.' })
    if (!email?.trim())         return res.status(400).json({ success: false, error: 'Email is required.' })
    if (!location?.trim())      return res.status(400).json({ success: false, error: 'Location is required.' })
    if (!licenseNumber?.trim()) return res.status(400).json({ success: false, error: 'License number is required.' })
    if (!about?.trim())         return res.status(400).json({ success: false, error: 'About is required.' })

    const emailNorm = email.toLowerCase().trim()
    const existing  = await Therapist.findOne({ email: emailNorm, status: { $in: ['pending', 'verified'] } })
    if (existing) {
      return res.status(409).json({ success: false, error: 'An application with this email already exists.' })
    }

    const therapist = await Therapist.create({
      firstName:       firstName.trim(),
      lastName:        lastName.trim(),
      email:           emailNorm,
      phone:           phone?.trim()        || '',
      website:         website?.trim()      || '',
      bookingLink:     bookingLink?.trim()   || '',
      location:        location.trim(),
      specializations: Array.isArray(specializations)
        ? specializations.map(s => s.trim()).filter(Boolean)
        : [],
      about:           about.trim(),
      quote:           quote?.trim()        || '',
      profileImage:    profileImage?.trim() || '',
      licenseNumber:   licenseNumber.trim(),
      sessionType:     sessionType?.trim()  || '',
      languages:       Array.isArray(languages)
        ? languages.map(l => l.trim()).filter(Boolean)
        : [],
      status:      'pending',
      submittedAt: new Date(),
    })

    res.status(201).json({ success: true, data: { id: therapist._id } })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// ── Admin endpoints ──────────────────────────────────────────────────────────

// GET /api/admin/therapists?status=pending|verified|rejected
export async function getAdminTherapists(req, res) {
  try {
    const { status } = req.query
    const filter = status && ['pending', 'verified', 'rejected'].includes(status)
      ? { status }
      : {}

    const [therapists, pendingCount, verifiedCount, rejectedCount] = await Promise.all([
      Therapist.find(filter).sort({ createdAt: -1 }).lean(),
      Therapist.countDocuments({ status: 'pending' }),
      Therapist.countDocuments({ status: 'verified' }),
      Therapist.countDocuments({ status: 'rejected' }),
    ])

    res.json({
      success: true,
      data:    therapists,
      counts:  { pending: pendingCount, verified: verifiedCount, rejected: rejectedCount },
    })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// PATCH /api/admin/therapists/:id/status
export async function updateTherapistStatus(req, res) {
  try {
    const { status } = req.body
    if (!['verified', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status.' })
    }
    const therapist = await Therapist.findByIdAndUpdate(
      req.params.id,
      { status, reviewedAt: new Date() },
      { new: true }
    )
    if (!therapist) return res.status(404).json({ success: false, error: 'Therapist not found.' })
    res.json({ success: true, data: therapist })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

// DELETE /api/admin/therapists/:id
export async function deleteTherapist(req, res) {
  try {
    const therapist = await Therapist.findByIdAndDelete(req.params.id)
    if (!therapist) return res.status(404).json({ success: false, error: 'Therapist not found.' })
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}
