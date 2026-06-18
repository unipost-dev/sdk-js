# @unipost/sdk

Official UniPost API client for JavaScript and TypeScript.
Post to 7 social platforms with one API call.

## Latest release: v0.3.0

Analytics Explorer and Developer Logs APIs are now available in this SDK.

- Query post-level analytics with filters and sorting.
- Export analytics rows as CSV for reporting workflows.
- Inspect platform analytics availability and metric summaries.
- Trigger analytics refresh jobs for supported platforms.
- Backfill workspace developer logs with cursor pagination.
- Stream near-real-time logs with Server-Sent Events replay.

Supported analytics surfaces include Instagram, Threads, Pinterest, and TikTok when connected account permissions allow them. See `Analytics Explorer` below for code.

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
  sizeBytes: 1048576,
})

await fetch(uploadUrl, { method: 'PUT', body: fileBuffer })

// Or upload from file (Node.js)
const mediaId = await client.media.uploadFile('./photo.jpg')
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
