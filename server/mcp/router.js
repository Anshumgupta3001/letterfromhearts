import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import { createHash, timingSafeEqual } from 'node:crypto'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { createHandlers, TOOL_DESCRIPTIONS } from './tools.js'
import { draftShape, writeShape, listShape } from './validation.js'

const MIN_SECRET_LENGTH = 24

// Constant-time comparison: hash both sides so lengths always match.
const sha = s => createHash('sha256').update(s).digest()
const matches = (given, secret) => typeof given === 'string' && given !== '' && timingSafeEqual(sha(given), sha(secret))

function buildServer(deps) {
  const handlers = createHandlers(deps)
  const server = new McpServer({ name: 'lfh', version: '1.0.0' })
  server.registerTool('draft_stranger_letter', { title: 'Draft a stranger letter (does not publish)', description: TOOL_DESCRIPTIONS.draft, inputSchema: draftShape }, a => handlers.draftStrangerLetter(a))
  server.registerTool('write_stranger_letter', { title: 'Publish a stranger letter', description: TOOL_DESCRIPTIONS.write, inputSchema: writeShape }, a => handlers.writeStrangerLetter(a))
  server.registerTool('list_my_letters', { title: 'List my letters', description: TOOL_DESCRIPTIONS.list, inputSchema: listShape }, a => handlers.listMyLetters(a))
  return server
}

const notAllowed = (_req, res) =>
  res.status(405).set('Allow', 'POST').json({ jsonrpc: '2.0', error: { code: -32000, message: 'Method not allowed.' }, id: null })

// Mounted at /api/mcp. Auth: "Authorization: Bearer <MCP_SECRET>" or "?key=<MCP_SECRET>".
// If MCP_SECRET is missing or too short the endpoint does not exist (404), so it fails closed.
export function createMcpRouter({ getSecret, ...deps }) {
  const router = Router()

  router.use((req, res, next) => {
    const secret = getSecret()
    if (!secret || secret.length < MIN_SECRET_LENGTH) return next('router')
    req.mcpSecret = secret
    next()
  })

  router.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 120, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests.' } }))

  router.use((req, res, next) => {
    const bearer = req.headers.authorization?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim()
    // Either credential is enough: a client may send its own stale Authorization header next to ?key=.
    if (matches(bearer, req.mcpSecret) || matches(req.query.key, req.mcpSecret)) return next()
    res.status(401).send('Unauthorized')
  })

  // Stateless: a fresh MCP server + transport per request (the tools keep no session state).
  router.post('/', async (req, res) => {
    const server = buildServer(deps)
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined })
    res.on('close', () => { transport.close(); server.close() })
    try {
      await server.connect(transport)
      await transport.handleRequest(req, res, req.body)
    } catch (err) {
      console.error('[mcp] request failed:', err.message)
      if (!res.headersSent) res.status(500).json({ jsonrpc: '2.0', error: { code: -32603, message: 'Internal server error' }, id: null })
    }
  })
  router.get('/', notAllowed)
  router.delete('/', notAllowed)

  return router
}
