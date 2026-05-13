# Changelog

## 0.2.9 (2026-05-13)

- Add `allowQuickstartCreds` to `client.connect.createSession(...)`
- Surface `allow_quickstart_creds` on Connect session responses
- Document white-label vs quickstart Connect session configuration

## 0.1.0 (2026-04-09)

Initial release.

- `client.accounts` — list, get, health
- `client.posts` — create, list, listAll, get, analytics, publish, cancel, bulkCreate
- `client.media` — upload, uploadFile
- `client.analytics` — rollup
- `client.connect` — createSession, getSession
- `client.users` — list, get
- `verifyWebhookSignature` — HMAC-SHA256 webhook verification
- Full TypeScript type definitions
- Auto-retry on 429 with Retry-After
- Zero production dependencies
