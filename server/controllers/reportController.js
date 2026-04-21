import Report       from '../models/Report.js'
import Notification from '../models/Notification.js'
import { sendViaResend, buildNotificationEmail } from '../utils/mailer.js'
import config from '../config/index.js'

// ── POST /api/reports  (authenticated user) ───────────────────────────────────
export async function createReport(req, res) {
  const { subject, description, type, letterId, reportedUserId } = req.body
  const user = req.user

  if (!subject?.trim())     return res.status(400).json({ success: false, error: 'Subject is required.' })
  if (!description?.trim()) return res.status(400).json({ success: false, error: 'Description is required.' })

  // Dedup — prevent identical (userId + subject) reports within 5 minutes
  const recent = await Report.findOne({
    userId:  user._id,
    subject: subject.trim(),
    createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) },
  })
  if (recent) return res.status(429).json({ success: false, error: 'Please wait before submitting the same report again.' })

  const report = await Report.create({
    userId:         user._id,
    userEmail:      user.email,
    userName:       user.name || '',
    reportedUserId: reportedUserId || null,
    letterId:       letterId || null,
    type:           type || 'other',
    subject:        subject.trim(),
    description:    description.trim(),
  })

  console.log(`[Report] ✅ Created — id:${report._id} userId:${user._id} type:${type}`)
  res.status(201).json({ success: true, data: report })
}

// ── GET /api/reports  (admin) ─────────────────────────────────────────────────
export async function getReports(req, res) {
  const { status, search, page = 1, limit = 50 } = req.query
  const filter = {}

  if (status && status !== 'all') filter.status = status
  if (search?.trim()) {
    const re = new RegExp(search.trim(), 'i')
    filter.$or = [{ userEmail: re }, { userName: re }, { subject: re }, { description: re }]
  }

  const skip  = (Number(page) - 1) * Number(limit)
  const total = await Report.countDocuments(filter)
  const reports = await Report.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .lean()

  res.json({ success: true, data: reports, total, page: Number(page) })
}

// ── PATCH /api/reports/:id/status  (admin) ───────────────────────────────────
export async function updateReportStatus(req, res) {
  const { id } = req.params
  const { status, resolvedNote } = req.body

  if (!['pending', 'resolved'].includes(status)) {
    return res.status(400).json({ success: false, error: 'Invalid status.' })
  }

  const report = await Report.findById(id)
  if (!report) return res.status(404).json({ success: false, error: 'Report not found.' })

  const wasResolved = report.status === 'resolved'
  report.status      = status
  report.resolvedAt  = status === 'resolved' ? new Date() : null
  report.resolvedNote = resolvedNote?.trim() || ''
  await report.save()

  // Notify user when newly resolved
  if (status === 'resolved' && !wasResolved) {
    const notifMessage = resolvedNote?.trim()
      ? `Your reported issue has been resolved ✅ — ${resolvedNote.trim()}`
      : 'Your reported issue has been reviewed and resolved ✅'

    // In-app notification
    await Notification.create({
      userId:  report.userId,
      message: notifMessage,
      type:    'system',
      link:    '',
    })

    // Email notification (best-effort — don't fail the request if it errors)
    if (config.resendApiKey && report.userEmail) {
      sendViaResend({
        to:      report.userEmail,
        subject: 'Your report has been resolved ✅',
        html:    buildNotificationEmail({
          message: notifMessage,
          type:    'system',
          link:    '',
        }),
        text: `${notifMessage}\n\nVisit https://letterfromheart.com to see your updates.`,
      }).catch(err => console.error('[Report] Resolution email failed:', err.message))
    }
  }

  console.log(`[Report] Status updated → ${status} — id:${id}`)
  res.json({ success: true, data: report })
}

// ── GET /api/reports/export  (admin — CSV download) ──────────────────────────
export async function exportReports(req, res) {
  const { status } = req.query
  const filter = status && status !== 'all' ? { status } : {}

  const reports = await Report.find(filter).sort({ createdAt: -1 }).lean()

  const escape = v => {
    if (v == null) return ''
    const s = String(v).replace(/"/g, '""')
    return `"${s}"`
  }

  const headers = ['Reporter Name', 'Email', 'Type', 'Subject', 'Description', 'Status', 'Created At', 'Resolved At', 'Resolve Note']
  const rows = reports.map(r => [
    escape(r.userName),
    escape(r.userEmail),
    escape(r.type),
    escape(r.subject),
    escape(r.description),
    escape(r.status),
    escape(r.createdAt ? new Date(r.createdAt).toISOString() : ''),
    escape(r.resolvedAt ? new Date(r.resolvedAt).toISOString() : ''),
    escape(r.resolvedNote),
  ].join(','))

  const csv = [headers.join(','), ...rows].join('\r\n')

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', `attachment; filename="reports-${Date.now()}.csv"`)
  res.send(csv)
}
