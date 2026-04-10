import type { Platform } from "./accounts.js";

export type PostStatus =
  | "draft"
  | "scheduled"
  | "processing"
  | "published"
  | "partial"
  | "failed"
  | "cancelled";

export interface Post {
  id: string;
  caption: string | null;
  status: PostStatus;
  scheduled_at?: string;
  created_at: string;
  published_at?: string;
  results?: PlatformResult[];
}

export interface PlatformResult {
  social_account_id: string;
  platform?: Platform;
  account_name?: string;
  status: string;
  external_id?: string;
  error_message?: string;
  published_at?: string;
}

export interface CreatePostPlatformPost {
  accountId: string;
  caption?: string;
  threadPosition?: number;
  firstComment?: string;
  mediaIds?: string[];
}

export interface CreatePostParams {
  caption?: string;
  accountIds?: string[];
  platformPosts?: CreatePostPlatformPost[];
  mediaUrls?: string[];
  scheduledAt?: string;
  status?: "draft";
  idempotencyKey?: string;
}

export interface ListPostsParams {
  status?: PostStatus;
  platform?: Platform;
  from?: string;
  to?: string;
  limit?: number;
  cursor?: string;
}

export interface PostAnalytics {
  post_id: string;
  impressions: number;
  engagements: number;
  likes: number;
  comments: number;
  shares: number;
  clicks: number;
  results: Record<string, Record<string, number>>;
}
