# @unipost/sdk

Official UniPost API client for JavaScript and TypeScript.
Post to 7 social platforms with one API call.

## Latest release: v0.6.0

Scoped Inbox support is now available for server-side applications.

- Bind every Inbox operation to either `client.inbox.managedUser(id)` or `client.inbox.workspace()`.
- List, read, reply, thread state, media context, sync, X backfill, X reply reconciliation, and WebSocket connection details are fully typed.
- X replies distinguish completed delivery from accepted-but-reconciling delivery.
- WebSocket helpers return connection details without opening a connection or adding a production dependency.

## Installation

```bash
npm install @unipost/sdk
```

## Quick Start

```typescript
import { UniPost } from '@unipost/sdk'

// Reads UNIPOST_API_KEY from environment automatically
const client = new UniPost()

const post = await client.posts.create({
  caption: 'Hello from UniPost! 🚀',
  accountIds: ['sa_twitter_xxx', 'sa_linkedin_xxx'],
})
```

## Usage

### List Accounts

```typescript
const { data: accounts } = await client.accounts.list()

// Filter by platform
const twitterAccounts = await client.accounts.list({ platform: 'twitter' })
```

### Create Posts

```typescript
// Immediate publish
const post = await client.posts.create({
  caption: 'Hello world!',
  accountIds: ['sa_twitter_xxx'],
})

// Scheduled
const post = await client.posts.create({
  caption: 'Scheduled post',
  accountIds: ['sa_twitter_xxx'],
  scheduledAt: '2026-04-28T09:00:00Z',
})

// Per-platform captions
const post = await client.posts.create({
  platformPosts: [
    { accountId: 'sa_twitter_xxx', caption: 'Short tweet 🐦' },
    { accountId: 'sa_linkedin_xxx', caption: 'Longer LinkedIn version...' },
  ],
})

// Twitter thread
const post = await client.posts.create({
  platformPosts: [
    { accountId: 'sa_twitter_xxx', caption: '1/ First', threadPosition: 1 },
    { accountId: 'sa_twitter_xxx', caption: '2/ Second', threadPosition: 2 },
  ],
})

// Save as draft
const draft = await client.posts.create({
  caption: 'Work in progress',
  accountIds: ['sa_twitter_xxx'],
  status: 'draft',
})

// Publish a draft
await client.posts.publish('post_xxx')
```

### Query Posts

```typescript
// List with filters
const { data, nextCursor } = await client.posts.list({
  status: 'published',
  platform: 'twitter',
  limit: 25,
})

// Auto-paginate
for await (const post of client.posts.listAll({ status: 'published' })) {
  console.log(post.id, post.status)
}

// Get analytics
const analytics = await client.posts.analytics('post_xxx')
```

### Analytics Explorer

```typescript
const posts = await client.analytics.posts({
  platform: 'tiktok',
  limit: 25,
  sort: 'engagement_rate',
})

const platforms = await client.analytics.platforms()
const tiktok = await client.analytics.platform('tiktok')
const csv = await client.analytics.exportPostsCsv({ platform: 'pinterest' })

await client.analytics.refresh({
  platform: 'threads',
  limit: 100,
})
```

### Developer Logs

```typescript
const page = await client.logs.list({
  status: 'error',
  limit: 50,
})

if (page.data[0]) {
  const log = await client.logs.get(page.data[0].id)
  console.log(log.action, log.request_payload)
}

for await (const log of client.logs.stream({ status: 'error', afterId: page.data[0]?.id ?? 0 })) {
  console.log(log.id, log.action)
  break
}
```

### Media Upload

```typescript
// Two-step upload
const { mediaId, uploadUrl } = await client.media.upload({
  filename: 'photo.jpg',
  contentType: 'image/jpeg',
  // sizeBytes is optional; uploadFile calculates it automatically
})

await fetch(uploadUrl, { method: 'PUT', body: fileBuffer })

// Or upload from file (Node.js)
const mediaId = await client.media.uploadFile('./photo.jpg')
```

### Custom Audio Overlay

```typescript
const job = await client.media.audioOverlays.create({
  videoMediaId: 'media_video_123',
  audioMediaId: 'media_audio_456',
  mode: 'mix',
  videoVolume: 70,
  audioVolume: 100,
  fit: 'trim_to_video',
}, { idempotencyKey: 'overlay-demo-001' })

let current = job
while (current.status === 'queued' || current.status === 'processing') {
  await new Promise((resolve) => setTimeout(resolve, 1500))
  current = await client.media.audioOverlays.get(job.id)
}

if (current.status !== 'succeeded') {
  throw new Error(current.error?.message || 'audio overlay failed')
}

await client.posts.create({
  caption: 'Video with custom audio',
  accountIds: ['sa_tiktok_xxx'],
  mediaIds: [current.outputMediaId!],
})
```

### Connect (Managed Users)

```typescript
const session = await client.connect.createSession({
  platform: 'twitter',
  externalUserId: 'your_user_123',
  returnUrl: 'https://yourapp.com/callback',
  allowQuickstartCreds: true, // optional: fall back to UniPost quickstart OAuth app
})
// Send session.url to your user
```

### Get Connect URL (Your Own Accounts)

```typescript
const { auth_url } = await client.connect.getConnectUrl({
  profileId: 'pr_brand_us',
  platform: 'linkedin',
  // optional
  redirectUrl: 'https://app.acme.com/integrations/done',
})

console.log(auth_url)
```

### Inbox (server-side apps)

Keep the workspace API key on your application backend. Never expose it to managed users or include it in browser bundles. For managed-user isolation, derive the external user ID from your authenticated application session, not from arbitrary caller-supplied scope fields, and bind it with `client.inbox.managedUser(id)`. Managed-user scope has no workspace fallback. Use `client.inbox.workspace()` only for creator-bound owner/admin aggregate workflows.

The following is a complete, type-checked style of integration using the public SDK types:

```typescript
import { UniPost } from '@unipost/sdk'
import type {
  InboxReplyResult,
  InboxSyncRequest,
  InboxSyncResult,
  InboxWebSocketConnectionDetails,
  XInboxBackfillResult,
} from '@unipost/sdk'

type ScopedInbox = ReturnType<UniPost['inbox']['managedUser']>

export function createInboxScopes(
  workspaceApiKey: string,
  authenticatedExternalUserId: string,
) {
  const client = new UniPost({ apiKey: workspaceApiKey })
  return {
    managed: client.inbox.managedUser(authenticatedExternalUserId),
    creatorWorkspace: client.inbox.workspace(),
  }
}

export async function inspectInbox(inbox: ScopedInbox): Promise<void> {
  const page = await inbox.list({
    source: 'x_dm',
    isRead: false,
    isOwn: false,
    limit: 25,
  })
  const unread = await inbox.unreadCount()
  const first = page.data[0]
  if (!first) return

  const item = await inbox.get(first.id)
  await inbox.markRead(item.id)
  await inbox.updateThreadState(item.id, { threadStatus: 'assigned', assignedTo: 'owner_123' })
  const media = await inbox.mediaContext(item.id)
  const marked = await inbox.markAllRead()
  void [unread, media, marked]
}

export async function replyWithStableKey(
  inbox: ScopedInbox,
  itemId: string,
  stableIdempotencyKey: string,
): Promise<InboxReplyResult> {
  const result = await inbox.reply(
    itemId,
    { text: 'Thanks — we are looking into this.' },
    { idempotencyKey: stableIdempotencyKey },
  )

  if (result.state === 'completed') {
    console.log(result.item.id)
  } else {
    const status = await inbox.xOutboundStatus(result.operationId)
    console.log(status.status)
  }
  return result
}

export async function syncInbox(inbox: ScopedInbox): Promise<void> {
  const ordinary: InboxSyncResult = await inbox.sync()

  const request: InboxSyncRequest = {
    xBackfill: {
      accountId: 'sa_x_123',
      lookbackDays: 7,
      maxItems: 100,
      includeReplies: true,
      includeDms: false,
    },
  }
  const estimate: XInboxBackfillResult = await inbox.sync(request)

  if (estimate.confirmation_required) {
    console.log(estimate.estimated_x_credits)
    const confirmedRequest: InboxSyncRequest = {
      xBackfill: {
        ...request.xBackfill,
        confirmationToken: estimate.confirmation_token,
      },
    }
    const confirmed: XInboxBackfillResult = await inbox.sync(confirmedRequest)
    console.log(confirmed)
  }
  void ordinary
}

export function websocketDetails(inbox: ScopedInbox): InboxWebSocketConnectionDetails {
  return inbox.webSocketConnectionDetails()
}
```

`list(...)` accepts `source`, `isRead`, `isOwn`, and `limit`; explicit `false` values are sent rather than omitted. It is limit-only and returns one non-paginated page: the server default is 50 items and the server clamps the limit to 500. Item, read, thread-state, media-context, reply, sync, outbound-status, and WebSocket-detail methods all remain bound to the selected scope.

For X replies, reuse one stable idempotency key for retries. Branch on `state`: `completed` contains the reply item, while `reconciling` means the remote service accepted the reply but UniPost is still reconciling it. Poll `xOutboundStatus(...)`; never resend a reconciling reply under a new idempotency key.

`webSocketConnectionDetails()` is backend-only. It makes no connection and returns a URL plus an API key only in the `Authorization` header. Pass those details to a server-side WebSocket client that supports custom headers, never log the header, and do not put the key in the URL. Native browser WebSocket clients cannot set this required header. The SDK intentionally has no mandatory WebSocket dependency.

Calling `sync()` without arguments performs ordinary polling for the selected scope. Passing an explicit `xBackfill` requests metered X history: managed-user scope narrows eligible accounts, while workspace scope can span accounts. Inspect the estimate and confirmation response, review its scope and cost, then repeat the exact request with the returned `confirmationToken`. Never schedule an unreviewed workspace-wide X backfill.

### Webhook Verification

```typescript
import { verifyWebhookSignature } from '@unipost/sdk'

const isValid = await verifyWebhookSignature({
  payload: req.body,
  signature: req.headers['x-unipost-signature'],
  secret: process.env.UNIPOST_WEBHOOK_SECRET!,
})
```

## Error Handling

```typescript
import { UniPost, AuthError, RateLimitError, UniPostError } from '@unipost/sdk'

try {
  await client.posts.create({ ... })
} catch (error) {
  if (error instanceof AuthError) {
    // 401 - API key invalid
  } else if (error instanceof RateLimitError) {
    // 429 - retry after error.retryAfter seconds
  } else if (error instanceof UniPostError) {
    // Other API error
    console.error(error.status, error.code, error.message)
  }
}
```

## TypeScript

Full type definitions included. IDE autocomplete works out of the box.

```typescript
import type { Post, SocialAccount, Platform, CreatePostParams } from '@unipost/sdk'
```

## Runtime Support

- Node.js 18+
- Bun
- Deno
- Browsers
- Edge runtimes (Cloudflare Workers, Vercel Edge)

Zero production dependencies.

## License

MIT
