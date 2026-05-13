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
}

export interface GetConnectUrlParams {
  profileId: string;
  platform: string;
  redirectUrl?: string;
}

export interface ManagedUser {
  external_user_id: string;
  external_user_email?: string;
  account_count?: number;
  platform_counts?: Record<string, number>;
  reconnect_count?: number;
}

// --- Media ---

export interface MediaUploadRequest {
  filename: string;
  contentType: string;
  sizeBytes: number;
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
