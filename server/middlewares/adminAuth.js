import config from '../config/index.js'

export function verifyAdminKey(req, res, next) {
  const received   = (req.query.key || req.headers['x-admin-key'] || '').trim()
  const configured = (config.adminDashboardKey || '').trim()

  if (!configured || received !== configured) {
    console.warn('[Admin] Auth failed — received key length:', received.length, '— expected length:', configured.length, '— IP:', req.ip)
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}
