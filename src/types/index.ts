import type { SocialAccount } from "./accounts.js";

export type {
  Platform,
  AccountStatus,
  ConnectionType,
  SocialAccount,
  AccountHealth,
  ListAccountsParams,
  ConnectAccountParams,
} from "./accounts.js";

export type {
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
  DeliveryJob,
  ListDeliveryJobsParams,
  PostQueueSnapshot,
  PostAnalyticsItem,
  PostPreviewLink,
  BulkPostError,
  BulkPostResult,
} from "./posts.js";

export type {
  WebhookEventType,
  WebhookEvent,
  VerifyWebhookOptions,
  WebhookSubscription,
  WebhookSubscriptionSecret,
  CreateWebhookParams,
  UpdateWebhookParams,
} from "./webhooks.js";

export type {
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
} from "./inbox.js";

// --- Workspace ---

export interface Workspace {
  id: string;
  name: string;
  per_account_monthly_limit?: number | null;
  usage_modes?: string[];
  created_at: string;
  updated_at: string;
}

export interface UpdateWorkspaceParams {
  name?: string;
  perAccountMonthlyLimit?: number | null;
}

// --- Profiles ---

export interface Profile {
  id: string;
  workspace_id: string;
  name: string;
  account_count?: number;
  created_at: string;
  updated_at: string;
  branding_logo_url?: string | null;
  branding_display_name?: string | null;
  branding_primary_color?: string | null;
}

export interface CreateProfileParams {
  name: string;
  brandingLogoUrl?: string | null;
  brandingDisplayName?: string | null;
  brandingPrimaryColor?: string | null;
}

export interface UpdateProfileParams {
  name?: string;
  brandingLogoUrl?: string | null;
  brandingDisplayName?: string | null;
  brandingPrimaryColor?: string | null;
}

// --- API keys ---

export type ApiKeyEnvironment = "production" | "test";

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  environment: ApiKeyEnvironment;
  created_at: string;
  last_used_at: string | null;
  expires_at: string | null;
}

export interface CreatedApiKey extends ApiKey {
  key: string;
}

export interface CreateApiKeyParams {
  name: string;
  environment?: ApiKeyEnvironment;
  expiresAt?: string;
}

// --- Platform credentials ---

export interface PlatformCredential {
  platform: string;
  client_id: string;
  created_at: string;
}

export interface CreatePlatformCredentialParams {
  platform: string;
  clientId: string;
  clientSecret: string;
}

// --- Plans ---

export interface Plan {
  id: string;
  name: string;
  price_cents: number;
  post_limit: number;
}

// --- Connect / Users ---

export interface ConnectSession {
  id: string;
  url: string;
  allow_quickstart_creds?: boolean;
  status: "pending" | "completed" | "expired" | string;
  expires_at: string;
  platform: string;
  external_user_id: string;
  external_user_email?: string;
  return_url?: string;
  created_at?: string;
  completed_at?: string;
  completed_social_account_id?: string;
}

export interface CreateConnectSessionParams {
  platform: string;
  profileId?: string;
  externalUserId: string;
  externalUserEmail?: string;
  returnUrl?: string;
  allowQuickstartCreds?: boolean;
}

export interface GetConnectUrlParams {
  profileId: string;
  platform: string;
  redirectUrl?: string;
}

export interface ListManagedUsersParams {
  profileId: string;
  limit?: number;
}

export interface GetManagedUserParams {
  profileId: string;
  externalUserId: string;
}

export interface ManagedUserSummary {
  external_user_id: string;
  external_user_email?: string;
  account_count?: number;
  platform_counts?: Record<string, number>;
  reconnect_count?: number;
  disconnected_count?: number;
  first_connected_at?: string;
  last_refreshed_at?: string;
}

export interface ManagedUserDetail {
  external_user_id: string;
  external_user_email?: string;
  account_count: number;
  accounts: SocialAccount[];
}

/** @deprecated Use ManagedUserSummary for list responses. */
export type ManagedUser = ManagedUserSummary;

// --- Media ---

export interface MediaUploadRequest {
  filename: string;
  contentType: string;
  sizeBytes?: number;
  contentHash?: string;
}

export interface MediaUploadResponse {
  id?: string;
  media_id?: string;
  mediaId?: string;
  upload_url?: string;
  uploadUrl?: string;
  status: string;
  content_type?: string;
  size_bytes?: number;
  download_url?: string;
  expires_at?: string;
  created_at?: string;
}

export type AudioOverlayMode = "mix" | "replace" | string;
export type AudioOverlayFit = "trim_to_video" | "loop_to_video" | string;
export type AudioOverlayStatus = "queued" | "processing" | "succeeded" | "failed" | string;

export interface AudioOverlayCreateParams {
  videoMediaId: string;
  audioMediaId: string;
  mode?: AudioOverlayMode;
  videoVolume?: number;
  audioVolume?: number;
  audioStartMs?: number;
  fit?: AudioOverlayFit;
}

export interface AudioOverlayRequestOptions {
  idempotencyKey?: string;
}

export interface AudioOverlayError {
  code: string;
  message: string;
  retryable: boolean;
}

export interface AudioOverlayJob {
  id: string;
  status: AudioOverlayStatus;
  video_media_id?: string;
  audio_media_id?: string;
  output_media_id?: string | null;
  videoMediaId?: string;
  audioMediaId?: string;
  outputMediaId?: string | null;
  mode: AudioOverlayMode;
  fit: AudioOverlayFit;
  created_at?: string;
  started_at?: string | null;
  completed_at?: string | null;
  createdAt?: string;
  startedAt?: string | null;
  completedAt?: string | null;
  error?: AudioOverlayError | null;
}

// --- Analytics ---

export type Granularity = "day" | "week" | "month" | string;
export type GroupBy =
  | "platform"
  | "social_account_id"
  | "status"
  | "external_user_id"
  | string;

export interface AnalyticsRollupParams {
  from: string;
  to: string;
  granularity?: Granularity;
  groupBy?: GroupBy;
}

export interface AnalyticsQueryParams {
  from?: string;
  to?: string;
  profileId?: string;
  platform?: string;
  status?: string;
}

export interface AnalyticsRollup {
  granularity: string;
  group_by: string[];
  series: Record<string, unknown>[];
}

export type AnalyticsPostsSort =
  | "published_at"
  | "published_at_asc"
  | "published_at_desc"
  | "created_at"
  | "created_at_asc"
  | "created_at_desc"
  | "impressions"
  | "impressions_asc"
  | "reach"
  | "reach_asc"
  | "likes"
  | "likes_asc"
  | "comments"
  | "comments_asc"
  | "shares"
  | "shares_asc"
  | "saves"
  | "saves_asc"
  | "clicks"
  | "clicks_asc"
  | "video_views"
  | "video_views_asc"
  | "engagement_rate"
  | "engagement_rate_asc"
  | string;

export interface AnalyticsPostsParams extends AnalyticsQueryParams {
  accountId?: string;
  postId?: string;
  limit?: number;
  cursor?: string;
  sort?: AnalyticsPostsSort;
}

export interface AnalyticsPostRow {
  post_id: string;
  social_post_result_id: string;
  social_account_id: string;
  profile_id: string;
  platform: string;
  external_id?: string;
  external_user_id?: string;
  result_status: string;
  post_status: string;
  caption?: string;
  url?: string;
  created_at: string;
  published_at?: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  video_views: number;
  engagement_rate: number;
  platform_specific?: Record<string, unknown>;
  fetched_at?: string;
  consecutive_failures: number;
  last_failure_reason?: string;
}

export interface AnalyticsPlatformParams {
  from?: string;
  to?: string;
  profileId?: string;
}

export interface AnalyticsPlatformAvailability {
  platform: string;
  supported_metrics: string[];
  refresh_supported: boolean;
  account_count: number;
  active_account_count: number;
  needs_reconnect_count: number;
  analytics_row_count: number;
  last_successful_fetch_at?: string;
  last_failure_reason?: string;
  health: string;
  notes?: string[];
}

export interface AnalyticsPlatformSummary {
  posts: number;
  accounts: number;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  video_views: number;
  engagement_rate: number;
}

export interface AnalyticsPlatformTrendRow {
  date: string;
  posts: number;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  video_views: number;
}

export interface AnalyticsAccountAvailability {
  social_account_id: string;
  profile_id: string;
  account_name?: string;
  external_user_id?: string;
  status: string;
  post_count: number;
  last_successful_fetch_at?: string;
  last_failure_reason?: string;
}

export interface AnalyticsPlatformDetail {
  platform: string;
  period: { start: string; end: string };
  availability: AnalyticsPlatformAvailability;
  summary: AnalyticsPlatformSummary;
  trend: AnalyticsPlatformTrendRow[];
  accounts: AnalyticsAccountAvailability[];
  top_posts: AnalyticsPostRow[];
}

export interface AnalyticsRefreshParams extends AnalyticsPlatformParams {
  platform?: string;
  accountId?: string;
  postId?: string;
  limit?: number;
}

export interface AnalyticsRefreshResponse {
  status: string;
  matched_count: number;
  requested_count: number;
  limit: number;
  processed_by?: string;
  filters?: Record<string, unknown>;
}

// --- Usage / OAuth ---

export interface Usage {
  period: string;
  post_count: number;
  post_limit: number;
  plan: string;
  percentage: number;
  warning?: string;
}

export interface OAuthConnectResponse {
  auth_url: string;
}

// --- Logs ---

export type LogLevel = "debug" | "info" | "warn" | "error" | string;
export type LogStatus = "success" | "warning" | "error" | string;
export type LogCategory = "publishing" | "api_request" | "oauth" | "webhook" | "system" | string;
export type LogSource = "api" | "dashboard" | "worker" | "webhook" | "oauth" | string;

export interface LogEntry {
  id: number;
  workspace_id: string;
  ts: string;
  level: LogLevel;
  status: LogStatus;
  category: LogCategory;
  action: string;
  source: LogSource;
  message?: string;
  request_id?: string;
  platform?: string;
  profile_id?: string;
  social_account_id?: string;
  post_id?: string;
  error_code?: string;
  metadata?: Record<string, unknown> | null;
  request_payload?: Record<string, unknown> | null;
  response_payload?: Record<string, unknown> | null;
}

export interface ListLogsParams {
  category?: LogCategory;
  action?: string;
  source?: LogSource;
  level?: LogLevel;
  status?: LogStatus;
  platform?: string;
  profileId?: string;
  socialAccountId?: string;
  postId?: string;
  requestId?: string;
  errorCode?: string;
  q?: string;
  from?: string;
  to?: string;
  limit?: number;
  cursor?: string;
}

export interface LogStreamParams {
  category?: LogCategory;
  level?: LogLevel;
  status?: LogStatus;
  platform?: string;
  profileId?: string;
  socialAccountId?: string;
  postId?: string;
  requestId?: string;
  errorCode?: string;
  afterId?: number;
}

export interface LogStreamOptions {
  lastEventId?: number | string;
  signal?: AbortSignal;
}

// --- Pagination ---

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
  meta?: {
    total?: number;
    limit?: number;
    has_more?: boolean;
    next_cursor?: string;
  };
}

// --- Client options ---

export interface UniPostClientOptions {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
}
