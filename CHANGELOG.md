# Changelog

## 0.6.2 candidate (2026-07-23)

- Expose the stable `PlatformResult` fields `error_code`, `failure_stage`,
  `platform_error_code`, `is_retriable`, and `next_action`
- Preserve the complete per-platform result contract on post create, get, list,
  and update responses, including successful, partial, and failed outcomes
- Match the Profile-scoped Managed Users API contract for `profile_inaccessible`,
  `managed_user_not_found`, and authentication failures without legacy fallback
- Prepare package metadata, User-Agent, declarations, and distribution files for
  the 0.6.2 candidate without publishing the package

## 0.6.1 (2026-07-23)

- Add explicit Profile scope for Managed User list and detail operations while retaining the 0.6.0 signatures
- Use Profile-nested Managed User API routes with encoded identifiers
- Export strict Managed User summary, detail, and account response types
- Validate scoped inputs and successful response bodies without falling back to bare routes
- Distinguish Profile access, missing Managed User, timeout, service outage, and invalid response errors
- Include the normalized per-result Post error code introduced on the 0.6 branch

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
