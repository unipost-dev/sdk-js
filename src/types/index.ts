export type {
  Platform,
  AccountStatus,
  ConnectionType,
  SocialAccount,
  AccountHealth,
  ListAccountsParams,
} from "./accounts.js";

export type {
  PostStatus,
  Post,
  PlatformResult,
  CreatePostPlatformPost,
  CreatePostParams,
  ListPostsParams,
  PostAnalytics,
} from "./posts.js";

export type {
  WebhookEventType,
  WebhookEvent,
  VerifyWebhookOptions,
} from "./webhooks.js";

// --- Profiles ---

export interface Profile {
  id: string;
  workspace_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

// --- Connect / Users ---

export interface ConnectSession {
  id: string;
  url: string;
  status: "pending" | "completed" | "expired";
  expires_at: string;
  platform: string;
  external_user_id: string;
}

export interface CreateConnectSessionParams {
  platform: string;
  externalUserId: string;
  externalUserEmail?: string;
  returnUrl: string;
}

export interface ManagedUser {
  external_user_id: string;
  external_user_email?: string;
  accounts: import("./accounts.js").SocialAccount[];
  created_at: string;
}

// --- Media ---

export interface MediaUploadRequest {
  filename: string;
  contentType: string;
  sizeBytes: number;
}

export interface MediaUploadResponse {
  mediaId: string;
  uploadUrl: string;
}

// --- Analytics ---

export type Granularity = "day" | "week" | "month";
export type GroupBy = "platform" | "social_account_id" | "status";

export interface AnalyticsRollupParams {
  from: string;
  to: string;
  granularity?: Granularity;
  groupBy?: GroupBy;
}

export interface AnalyticsRollup {
  from: string;
  to: string;
  granularity: Granularity;
  buckets: AnalyticsBucket[];
}

export interface AnalyticsBucket {
  key: string;
  impressions: number;
  engagements: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
}

// --- Pagination ---

export interface PaginatedResponse<T> {
  data: T[];
  nextCursor?: string;
  meta?: {
    total: number;
    page: number;
    per_page: number;
  };
}

// --- Client options ---

export interface UniPostClientOptions {
  apiKey?: string;
  baseUrl?: string;
  timeout?: number;
}
