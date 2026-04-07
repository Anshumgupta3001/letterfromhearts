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

// ── SMTP fallback retry logic ──────────────────────────────────────────────────
// Build a list of configs to try in order, including alternative ports and
// provider-specific alternative hosts (e.g. Zoho .in fallback).
function buildSmtpConfigs(host, port, secure, username, password) {
  const portNum    = Number(port)
  const secureFlag = portNum === 465 ? true : !!secure
  const altPort    = portNum === 587 ? 465 : 587
  const altSecure  = altPort === 465

  const auth = { user: username.trim(), pass: password }

  const configs = [
    // Primary: exactly what the user specified
    { host: host.trim(), port: portNum, secure: secureFlag, auth },
    // Alt port on the same host
    { host: host.trim(), port: altPort, secure: altSecure, auth },
  ]

  // Zoho-specific: also try smtp.zoho.in (common in India)
  if (host.trim().toLowerCase().includes('zoho.com')) {
    configs.push({ host: 'smtp.zoho.in', port: portNum, secure: secureFlag, auth })
    configs.push({ host: 'smtp.zoho.in', port: altPort, secure: altSecure, auth })
  }

  // Gmail-specific: also try port 465/SSL explicitly
  if (host.trim().toLowerCase().includes('gmail.com') || host.trim().toLowerCase().includes('google.com')) {
    configs.push({ host: 'smtp.gmail.com', port: 465, secure: true, auth })
  }

  return configs
}

// Try each config in order; return the first that verifies successfully.
// Returns { transporter, cfg } on success, throws on all failures.
async function verifyWithFallback(host, port, secure, username, password) {
  const configs = buildSmtpConfigs(host, port, secure, username, password)
  let lastErr

  for (const cfg of configs) {
    try {
      const transporter = nodemailer.createTransport(cfg)
      await transporter.verify()
      return { transporter, cfg } // ✅ found working config
    } catch (err) {
      lastErr = err
    }
  }

  // All attempts failed
  throw new Error(
    'Unable to connect. Please check your SMTP details or App Password.'
  )
}

// POST /api/email-accounts/smtp
export async function upsertSmtpAccount(req, res) {
  const { provider, emailAddress, host, port, secure, username, password, defaultFrom } = req.body

  if (!host?.trim())                  return res.status(400).json({ error: 'SMTP host is required.' })
  if (!port || isNaN(Number(port)))   return res.status(400).json({ error: 'SMTP port must be a number.' })
  if (!username?.trim())              return res.status(400).json({ error: 'SMTP username is required.' })
  if (!password)                      return res.status(400).json({ error: 'SMTP password is required.' })
  if (!username.includes('@'))        return res.status(400).json({ error: 'Username must be a valid email.' })

  // Verify SMTP with fallback retry logic
  let workingCfg
  try {
    const result = await verifyWithFallback(host, port, secure, username, password)
    workingCfg = result.cfg
  } catch (err) {
    return res.status(400).json({ error: err.message })
  }

  const encPass = encrypt(password)
  const userId  = req.user._id

  const account = await EmailAccount.findOneAndUpdate(
    { userId, emailAddress: (emailAddress || username).toLowerCase().trim() },
    {
      userId,
      emailAddress: (emailAddress || username).toLowerCase().trim(),
      provider:     provider || 'smtp',
      status:       'connected',
      smtp: {
        host:     workingCfg.host,          // save the WORKING host
        port:     workingCfg.port,          // save the WORKING port
        secure:   workingCfg.secure,        // save the WORKING secure flag
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
