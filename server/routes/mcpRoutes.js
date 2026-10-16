import Letter from '../models/Letter.js'
import User   from '../models/User.js'
import { checkFieldsSafety, MSG_FLAGGED, MSG_UNAVAILABLE } from '../utils/moderation.js'
import { createMcpRouter } from '../mcp/router.js'

// MCP endpoint for Claude: /api/mcp  (see server/mcp/ and the README note there).
//   MCP_SECRET     - long random secret that protects the endpoint (24+ chars). Unset = endpoint disabled.
//   MCP_USER_EMAIL - the LFH account the letters are written as.
export default createMcpRouter({
  getSecret: () => process.env.MCP_SECRET || '',
  getUser:   () => User.findOne({ email: (process.env.MCP_USER_EMAIL || '').trim().toLowerCase() }).select('_id role'),
  Letter,
  checkFieldsSafety,
  MSG_FLAGGED,
  MSG_UNAVAILABLE,
})
