# Changelog

## 0.6.0 (2026-07-22)

- Add explicit managed-user and workspace Inbox scopes with no implicit workspace fallback
- Cover Inbox listing, unread counts, item reads, read state, thread state, media context, replies, sync, and X outbound status
- Return response-aware completed or reconciling reply states for safe X reply idempotency and reconciliation
- Provide backend WebSocket connection details without opening a connection or adding a mandatory WebSocket dependency
- Add typed ordinary Inbox sync, metered X backfill estimation and confirmation, account results, and outbound operation status

## 0.5.0 (2026-07-03)

- Add `client.media.audioOverlays.create(...)` and `get(...)` for custom audio overlay processing jobs
- Allow media reservations without `sizeBytes`; UniPost can hydrate size after upload
- Add audio MIME type helpers for local file uploads
- Include the v0.4.1 typed post failure error contract updates

## 0.3.0 (2026-05-26)

- Add analytics explorer helpers: `client.analytics.posts`, `exportPostsCsv`, `platforms`, `platform`, and `refresh`
- Add typed post-level analytics, platform availability, platform detail, and refresh response shapes
- Add CSV text response support for analytics exports

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
