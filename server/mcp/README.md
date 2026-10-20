# MCP endpoint (Claude -> LFH stranger letters)

Lets Claude draft and publish Caring Stranger letters as one LFH account. Mounted at `/api/mcp`
(Streamable HTTP, stateless) via `routes/mcpRoutes.js`.

## Environment variables (server `.env` on the host)

| Variable | Meaning |
|----------|---------|
| `MCP_SECRET` | Random secret, 24+ chars (`openssl rand -hex 32`). **Unset or too short = endpoint disabled (404).** |
| `MCP_USER_EMAIL` | Email of the LFH account the letters are written as. Must not be a `listener` account. |

## Connect in claude.ai

Settings -> Connectors -> Add custom connector -> `https://<your-api-domain>/api/mcp?key=<MCP_SECRET>`
(Claude Code: `claude mcp add --transport http lfh "https://<your-api-domain>/api/mcp?key=<MCP_SECRET>"`).
Auth also accepts `Authorization: Bearer <MCP_SECRET>`.

## Tools

- `draft_stranger_letter`: mood + message in, draft out. Saves nothing.
- `write_stranger_letter`: saves the letter (same rules as `POST /api/letters`: listener block, OpenAI moderation, fail closed). Needs `mood` (one of the six) and `user_approved: true`.
- `list_my_letters`: the account's own letters (id, subject, type, mood, date, status). No letter text.

Flow Claude should follow: ask the user to pick a mood -> draft -> show the full draft -> user says publish -> write.
Moods are in `moods.js` (same six as `client/src/pages/WritePage.jsx`).

## Notes

- The secret travels in the URL, so it can appear in reverse-proxy access logs (nginx). App logs skip `/api/mcp` (see `app.js`).
- To revoke access: change `MCP_SECRET`, restart, update the connector URL.
- Keep claude.ai tool approval on "ask" for `write_stranger_letter`.
