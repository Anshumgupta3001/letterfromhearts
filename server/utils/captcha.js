/**
 * Optional reCAPTCHA v2/v3 verification.
 * Only enforced when RECAPTCHA_SECRET_KEY is set in env.
 * Wire up frontend to send `captchaToken` in the request body,
 * then call `requireCaptcha` middleware on the route.
 */
import config from '../config/index.js'

async function verifyCaptchaToken(token) {
  const params = new URLSearchParams({
    secret:   config.recaptchaSecretKey,
    response: token,
  })
  const res  = await fetch(`https://www.google.com/recaptcha/api/siteverify?${params}`, { method: 'POST' })
  const data = await res.json()
  return data.success === true
}

export function requireCaptcha(req, res, next) {
  // Skip entirely when key is not configured (dev / pre-frontend-wiring)
  if (!config.recaptchaSecretKey) return next()

  const token = req.body?.captchaToken
  if (!token) {
    return res.status(400).json({ error: 'CAPTCHA token is required.' })
  }

  verifyCaptchaToken(token)
    .then(ok => {
      if (!ok) return res.status(400).json({ error: 'CAPTCHA verification failed.' })
      next()
    })
    .catch(() => {
      console.warn('[CAPTCHA] Verification request failed')
      next() // fail open to avoid locking out users on Google outage
    })
}
