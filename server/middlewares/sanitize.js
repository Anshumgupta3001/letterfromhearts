/**
 * Input sanitization + malicious-pattern guard.
 *
 * Runs after express.json() and express-mongo-sanitize so:
 *   - NoSQL $-operators are already stripped
 *   - This layer catches path traversal, script injection, and null bytes
 */

const MALICIOUS_PATTERNS = [
  /\.\.\//,          // path traversal  ../
  /\.\.\\/,          // path traversal  ..\
  /<script/i,        // script tags
  /javascript:/i,    // JS URI scheme
  /file:\/\//i,      // file:// URIs
  /etc\/passwd/i,    // unix password file
  /win\.ini/i,       // windows config
  /%2e%2e/i,         // encoded ../
  /\u0000/,          // null bytes
]

function isStringMalicious(value) {
  return MALICIOUS_PATTERNS.some(p => p.test(value))
}

function checkObject(obj) {
  for (const val of Object.values(obj)) {
    if (typeof val === 'string' && isStringMalicious(val)) return true
    if (val && typeof val === 'object' && !Array.isArray(val) && checkObject(val)) return true
  }
  return false
}

export function guardMaliciousInput(req, res, next) {
  if (req.body && typeof req.body === 'object' && checkObject(req.body)) {
    console.warn('[Security] Malicious input blocked —', req.method, req.originalUrl, '— IP:', req.ip)
    return res.status(400).json({ error: 'Invalid input detected.' })
  }
  next()
}
