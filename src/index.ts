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
export type { ErrorContract } from "./errors.js";

// Webhook signature verification
export { verifyWebhookSignature } from "./webhook.js";

// Types
export type {
  // Accounts
  Platform,
  AccountStatus,
  ConnectionType,
  SocialAccount,
  AccountHealth,
  ListAccountsParams,
  ConnectAccountParams,
  // Workspace
  Workspace,
  UpdateWorkspaceParams,
  // Profiles
  Profile,
  CreateProfileParams,
  UpdateProfileParams,
  // API keys
  ApiKey,
  ApiKeyEnvironment,
  CreatedApiKey,
  CreateApiKeyParams,
  // Platform credentials / plans
  PlatformCredential,
  CreatePlatformCredentialParams,
  Plan,
  // Posts
  PostStatus,
  ErrorSource,
  ErrorTemporality,
  RetryState,
  ProviderError,
  RetryPolicy,
  Post,
  PlatformResult,
  CreatePostPlatformPost,
  CreatePostParams,
  UpdatePostParams,
  ValidationIssue,
  ValidationResult,
  ListPostsParams,
  PostQueueSnapshot,
  PostAnalyticsItem,
  PostPreviewLink,
  BulkPostError,
  BulkPostResult,
  // Delivery jobs
  DeliveryJob,
  ListDeliveryJobsParams,
  // Webhooks
  WebhookEventType,
  WebhookEvent,
  VerifyWebhookOptions,
  WebhookSubscription,
  WebhookSubscriptionSecret,
  CreateWebhookParams,
  UpdateWebhookParams,
  // Connect / Users
  ConnectSession,
  CreateConnectSessionParams,
  GetConnectUrlParams,
  ListManagedUsersParams,
  GetManagedUserParams,
  ManagedUserSummary,
  ManagedUserDetail,
  ManagedUser,
  // Media
  MediaUploadRequest,
  MediaUploadResponse,
  AudioOverlayMode,
  AudioOverlayFit,
  AudioOverlayStatus,
  AudioOverlayCreateParams,
  AudioOverlayRequestOptions,
  AudioOverlayError,
  AudioOverlayJob,
  // Analytics
  Granularity,
  GroupBy,
  AnalyticsRollupParams,
  AnalyticsRollup,
  AnalyticsQueryParams,
  // Usage / OAuth
  Usage,
  OAuthConnectResponse,
  // Logs
  LogEntry,
  LogLevel,
  LogStatus,
  LogCategory,
  LogSource,
  ListLogsParams,
  LogStreamParams,
  LogStreamOptions,
  // Inbox
  InboxSource,
  InboxThreadStatus,
  InboxItem,
  InboxListParams,
  InboxListResponse,
  InboxReplyRequest,
  InboxReplyOptions,
  InboxReplyResult,
  InboxUnreadCountResult,
  InboxMarkAllReadResult,
  InboxThreadStateRequest,
  InboxMediaContext,
  XInboxBackfillRequest,
  InboxSyncRequest,
  InboxSyncError,
  InboxSyncAccountDetail,
  InboxSyncResult,
  XInboxBackfillAccountResult,
  XInboxBackfillResult,
  XInboxOutboundStatus,
  InboxWebSocketConnectionDetails,
  // Pagination
  PaginatedResponse,
  // Client options
  UniPostClientOptions,
} from "./types/index.js";
