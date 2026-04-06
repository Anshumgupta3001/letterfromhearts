import nodemailer from 'nodemailer'
import crypto from 'crypto'
import config from '../config/index.js'
import EmailAccount from '../models/EmailAccount.js'

const ENCRYPTION_KEY = Buffer.from(
  config.encryptionKey.padEnd(32, '0').slice(0, 32)
)
const IV_LENGTH = 16

export function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv('aes-256-cbc', ENCRYPTION_KEY, iv)
  const encrypted = Buffer.concat([cipher.update(String(text)), cipher.final()])
  return iv.toString('hex') + ':' + encrypted.toString('hex')
}

export function decrypt(text) {
  const [ivHex, encHex] = String(text).split(':')
  const iv = Buffer.from(ivHex, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, iv)
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encHex, 'hex')),
    decipher.final(),
  ])
  return decrypted.toString()
}

function safeAccount(doc) {
  const obj = doc.toObject ? doc.toObject({ virtuals: true }) : { ...doc }
  if (obj.smtp) delete obj.smtp.password
  return obj
}

// POST /api/email-accounts/smtp
export async function upsertSmtpAccount(req, res) {
  const { provider, emailAddress, host, port, secure, username, password, defaultFrom } = req.body

  if (!host?.trim()) return res.status(400).json({ error: 'SMTP host is required.' })
  if (!port || isNaN(Number(port))) return res.status(400).json({ error: 'SMTP port must be a number.' })
  if (!username?.trim()) return res.status(400).json({ error: 'SMTP username is required.' })
  if (!password) return res.status(400).json({ error: 'SMTP password is required.' })
  if (!username.includes('@')) return res.status(400).json({ error: 'Username must be a valid email.' })

  const portNum = Number(port)
  const secureFlag = portNum === 465 ? true : !!secure

  // Verify SMTP before saving
  const transporter = nodemailer.createTransport({
    host: host.trim(),
    port: portNum,
    secure: secureFlag,
    auth: { user: username.trim(), pass: password },
  })
  try {
    await transporter.verify()
  } catch (err) {
    return res.status(400).json({ error: `SMTP verification failed: ${err.message}` })
  }

  const encPass = encrypt(password)
  const userId = req.user._id

  const account = await EmailAccount.findOneAndUpdate(
    { userId, emailAddress: (emailAddress || username).toLowerCase().trim() },
    {
      userId,
      emailAddress: (emailAddress || username).toLowerCase().trim(),
      provider: provider || 'smtp',
      status: 'connected',
      smtp: {
        host: host.trim(),
        port: portNum,
        secure: secureFlag,
        username: username.trim(),
        password: encPass,
      },
      defaultFrom: defaultFrom || username.trim(),
      lastVerified: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  )

  res.json({ success: true, data: safeAccount(account) })
}

// GET /api/email-accounts
export async function getEmailAccounts(req, res) {
  const accounts = await EmailAccount.find({ userId: req.user._id }).sort({ connectedAt: -1 })
  res.json({ success: true, data: accounts.map(safeAccount) })
}

// DELETE /api/email-accounts/:id
export async function deleteEmailAccount(req, res) {
  const account = await EmailAccount.findOneAndDelete({ _id: req.params.id, userId: req.user._id })
  if (!account) return res.status(404).json({ error: 'Account not found.' })
  res.json({ success: true })
}
