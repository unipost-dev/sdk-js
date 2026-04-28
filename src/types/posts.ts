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
