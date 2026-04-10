// Client
export { UniPost } from "./client.js";

// Errors
export {
  UniPostError,
  AuthError,
  NotFoundError,
  ValidationError,
  RateLimitError,
  PlatformError,
  QuotaError,
} from "./errors.js";

// Webhook
export { verifyWebhookSignature } from "./webhook.js";

// Types (re-export everything)
export type {
  // Accounts
  Platform,
  AccountStatus,
  ConnectionType,
  SocialAccount,
  AccountHealth,
  ListAccountsParams,
  // Posts
  PostStatus,
  Post,
  PlatformResult,
  CreatePostPlatformPost,
  CreatePostParams,
  ListPostsParams,
  PostAnalytics,
  // Webhooks
  WebhookEventType,
  WebhookEvent,
  VerifyWebhookOptions,
  // Connect
  ConnectSession,
  CreateConnectSessionParams,
  ManagedUser,
  // Media
  MediaUploadRequest,
  MediaUploadResponse,
  // Analytics
  Granularity,
  GroupBy,
  AnalyticsRollupParams,
  AnalyticsRollup,
  AnalyticsBucket,
  // Pagination
  PaginatedResponse,
  // Client options
  UniPostClientOptions,
} from "./types/index.js";
