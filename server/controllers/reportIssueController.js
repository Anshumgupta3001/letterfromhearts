import nodemailer from 'nodemailer'
import config from '../config/index.js'

const ISSUE_TYPES = ['bug', 'feature', 'content', 'account', 'other']

function createSystemTransporter() {
  return nodemailer.createTransport({
    host:   config.systemEmailHost,
    port:   config.systemEmailPort,
    secure: config.systemEmailPort === 465,
    auth:   { user: config.systemEmail, pass: config.systemEmailPass },
  })
}

// POST /api/report-issue
export async function reportIssue(req, res) {
  const { subject, description, type } = req.body
  const user = req.user

  if (!subject?.trim())      return res.status(400).json({ success: false, error: 'Subject is required.' })
  if (!description?.trim())  return res.status(400).json({ success: false, error: 'Description is required.' })
  if (!ISSUE_TYPES.includes(type)) return res.status(400).json({ success: false, error: 'Invalid issue type.' })

  if (!config.reportEmails.length) {
    return res.status(500).json({ success: false, error: 'Report email not configured on this server.' })
  }

  const typeLabel = {
    bug:     'Bug Report',
    feature: 'Feature Request',
    content: 'Content Issue',
    account: 'Account Problem',
    other:   'Other',
  }[type]

  const emailBody = `
New Issue Report — Letter from Heart
=====================================

Type:        ${typeLabel}
Subject:     ${subject.trim()}

Reporter
--------
Name:   ${user.name || 'N/A'}
Email:  ${user.email || 'N/A'}
Role:   ${user.role || 'N/A'}
User ID: ${user._id}

Description
-----------
${description.trim()}

=====================================
Submitted via Letter from Heart — Report an Issue
`.trim()

  try {
    const transporter = createSystemTransporter()
    await transporter.sendMail({
      from:    `"Letter from Heart" <${config.systemEmail}>`,
      to:      config.reportEmails.join(', '),
      subject: `[LFH Issue] ${typeLabel}: ${subject.trim()}`,
      text:    emailBody,
    })

    res.json({ success: true })
  } catch (err) {
    console.error('Report issue email failed:', err.message)
    res.status(500).json({ success: false, error: 'Failed to send report. Please try again.' })
  }
}
