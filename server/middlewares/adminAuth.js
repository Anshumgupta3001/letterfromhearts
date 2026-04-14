import config from '../config/index.js'

export function verifyAdminKey(req, res, next) {
  const key = req.query.key || req.headers['x-admin-key']
  if (!config.adminDashboardKey || key !== config.adminDashboardKey) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}
