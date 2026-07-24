import type { Platform } from "./accounts.js";

export type PostStatus =
  | "draft"
  | "scheduled"
  | "queued"
  | "publishing"
  | "dispatching"
  | "retrying"
  | "processing"
  | "published"
  | "partial"
  | "failed"
  | "cancelled"
  | "canceled"
  | string;

export type ErrorSource =
  | "unipost"
  | "platform"
  | "worker"
  | "unknown"
  | (string & {});

export type ErrorTemporality = "temporary" | "permanent" | "unknown" | (string & {});

export type RetryState =
  | "not_retriable"
  | "scheduled"
  | "running"
  | "exhausted"
  | "manual_only"
  | "unknown"
  | (string & {});

export interface ProviderError {
  provider?: string;
  http_status?: number;
  code?: string;
  subcode?: string;
  type?: string;
  reason?: string;
  domain?: string;
  quota_limit?: string;
  quota_location?: string;
  is_transient?: boolean;
}

export interface RetryPolicy {
  is_retriable: boolean;
  will_retry: boolean;
  retry_state: RetryState;
  next_run_at?: string;
  attempts_made?: number;
  max_attempts?: number;
  attempts_remaining?: number;
  manual_retry_allowed: boolean;
  reason?: string;
}

export interface PlatformResult {
  id?: string;
  social_account_id: string;
  platform?: Platform | string;
  account_name?: string;
  caption?: string;
  status: string;
  external_id?: string;
  url?: string;
  error_message?: string;
  error_code?: string;
  failure_stage?: string;
  platform_error_code?: string;
  is_retriable?: boolean;
  next_action?: string;
  error_source?: ErrorSource;
  error_temporality?: ErrorTemporality;
  provider_error?: ProviderError | null;
  retry_policy?: RetryPolicy | null;
  published_at?: string;
  warnings?: string[];
}

export interface Post {
  id: string;
  caption: string | null;
  media_urls?: string[];
  status: PostStatus;
  execution_mode?: string;
  queued_results_count?: number;
  active_job_count?: number;
  retrying_count?: number;
  dead_count?: number;
  created_at: string;
  scheduled_at?: string;
  published_at?: string;
  results?: PlatformResult[];
}

export interface CreatePostPlatformPost {
  accountId: string;
  caption?: string;
  mediaUrls?: string[];
  mediaIds?: string[];
  threadPosition?: number;
  firstComment?: string;
  inReplyTo?: string;
  platformOptions?: Record<string, unknown>;
}

export interface CreatePostParams {
  caption?: string;
  accountIds?: string[];
  mediaUrls?: string[];
  mediaIds?: string[];
  scheduledAt?: string;
  status?: "draft" | "canceled" | "cancelled";
  archived?: boolean;
  idempotencyKey?: string;
  platformPosts?: CreatePostPlatformPost[];
}

export type UpdatePostParams = CreatePostParams;

export interface ValidationIssue {
  platform_post_index: number;
  account_id?: string;
  platform?: string;
  field: string;
  code: string;
  message: string;
  severity: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface ListPostsParams {
  status?: PostStatus;
  platform?: Platform;
  from?: string;
  to?: string;
  limit?: number;
  cursor?: string;
}

export interface DeliveryJob {
  id: string;
  post_id: string;
  social_post_result_id: string;
  social_account_id: string;
  platform: string;
  kind: string;
  state: string;
  attempts: number;
  max_attempts: number;
  failure_stage?: string;
  error_code?: string;
  platform_error_code?: string;
  last_error?: string;
  next_run_at?: string;
  last_attempt_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ListDeliveryJobsParams {
  limit?: number;
  offset?: number;
  states?: string[] | string;
}

export interface PostQueueSnapshot {
  post: Post;
  jobs: DeliveryJob[];
}

export interface PostAnalyticsItem {
  post_id: string;
  social_account_id: string;
  platform: string;
  external_id: string;
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  video_views: number;
  views: number;
  engagement_rate: number;
  consecutive_failures?: number;
  last_failure_reason?: string;
}

export interface PostPreviewLink {
  url: string;
  token: string;
  expires_at: string;
}

export interface BulkPostError {
  code: string;
  message: string;
}

export interface BulkPostResult {
  status: number;
  data?: Post;
  error?: BulkPostError;
}
