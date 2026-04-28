import type { HttpClient } from "../http.js";
import type {
  Post,
  CreatePostParams,
  UpdatePostParams,
  ListPostsParams,
  ValidationResult,
  PostQueueSnapshot,
  PostAnalyticsItem,
  PostPreviewLink,
  PlatformResult,
  BulkPostResult,
  PaginatedResponse,
} from "../types/index.js";

function toSnakeCase(params: CreatePostParams | UpdatePostParams = {}): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (params.caption !== undefined) body.caption = params.caption;
  if (params.accountIds) body.account_ids = params.accountIds;
  if (params.mediaUrls) body.media_urls = params.mediaUrls;
  if (params.mediaIds) body.media_ids = params.mediaIds;
  if (params.scheduledAt) body.scheduled_at = params.scheduledAt;
  if (params.status) body.status = params.status;
  if (params.archived !== undefined) body.archived = params.archived;
  if (params.platformPosts) {
    body.platform_posts = params.platformPosts.map((pp) => {
      const entry: Record<string, unknown> = { account_id: pp.accountId };
      if (pp.caption !== undefined) entry.caption = pp.caption;
      if (pp.mediaUrls) entry.media_urls = pp.mediaUrls;
      if (pp.mediaIds) entry.media_ids = pp.mediaIds;
      if (pp.threadPosition !== undefined) entry.thread_position = pp.threadPosition;
      if (pp.firstComment !== undefined) entry.first_comment = pp.firstComment;
      if (pp.inReplyTo !== undefined) entry.in_reply_to = pp.inReplyTo;
      if (pp.platformOptions !== undefined) entry.platform_options = pp.platformOptions;
      return entry;
    });
  }
  return body;
}

export class Posts {
  constructor(private readonly http: HttpClient) {}

  /** Create a new post. */
  async create(params: CreatePostParams): Promise<Post> {
    const body = toSnakeCase(params);
    const headers: Record<string, string> = {};
    if (params.idempotencyKey) headers["Idempotency-Key"] = params.idempotencyKey;
    const res = await this.http.post<{ data: Post }>("/v1/posts", body, headers);
    return res.data;
  }

  /** Validate post params without persisting anything. */
  async validate(params: CreatePostParams): Promise<ValidationResult> {
    const res = await this.http.post<{ data: ValidationResult }>("/v1/posts/validate", toSnakeCase(params));
    return res.data;
  }

  /** List posts with optional filters and cursor pagination. */
  async list(
    params?: ListPostsParams,
  ): Promise<PaginatedResponse<Post> & { nextCursor?: string }> {
    const query: Record<string, string | number | undefined> = {};
    if (params?.status) query.status = params.status;
    if (params?.platform) query.platform = params.platform;
    if (params?.from) query.from = params.from;
    if (params?.to) query.to = params.to;
    if (params?.limit) query.limit = params.limit;
    if (params?.cursor) query.cursor = params.cursor;
    const response = await this.http.get<PaginatedResponse<Post> & { next_cursor?: string }>(
      "/v1/posts",
      query,
    );
    const nextCursor = response?.meta?.next_cursor ?? response?.nextCursor ?? response?.next_cursor;
    return { ...response, nextCursor };
  }

  /** Iterate every post via cursor pagination. */
  async *listAll(params?: Omit<ListPostsParams, "cursor">): AsyncGenerator<Post> {
    let cursor: string | undefined;
    do {
      const page = await this.list({ ...params, cursor });
      for (const post of page.data || []) yield post;
      cursor = page.nextCursor;
    } while (cursor);
  }

  /** Get a single post by ID. */
  async get(postId: string): Promise<Post> {
    const res = await this.http.get<{ data: Post }>(`/v1/posts/${postId}`);
    return res.data;
  }

  /** Get the dispatch queue snapshot for a post. */
  async getQueue(postId: string): Promise<PostQueueSnapshot> {
    const res = await this.http.get<{ data: PostQueueSnapshot }>(`/v1/posts/${postId}/queue`);
    return res.data;
  }

  /** Per-platform analytics rows for a post. Pass `{ refresh: true }` to force a live fetch. */
  async analytics(postId: string, params: { refresh?: boolean } = {}): Promise<PostAnalyticsItem[]> {
    const query: Record<string, string | undefined> = {};
    if (params.refresh) query.refresh = "true";
    const res = await this.http.get<{ data: PostAnalyticsItem[] }>(`/v1/posts/${postId}/analytics`, query);
    return res.data ?? [];
  }

  /** Publish a draft or queued post. */
  async publish(postId: string): Promise<Post> {
    const res = await this.http.post<{ data: Post }>(`/v1/posts/${postId}/publish`);
    return res.data;
  }

  /** Update a post's fields. */
  async update(postId: string, params: UpdatePostParams = {}): Promise<Post> {
    const res = await this.http.patch<{ data: Post }>(`/v1/posts/${postId}`, toSnakeCase(params));
    return res.data;
  }

  async archive(postId: string): Promise<Post> {
    const res = await this.http.post<{ data: Post }>(`/v1/posts/${postId}/archive`);
    return res.data;
  }

  async restore(postId: string): Promise<Post> {
    const res = await this.http.post<{ data: Post }>(`/v1/posts/${postId}/restore`);
    return res.data;
  }

  async cancel(postId: string): Promise<Post> {
    const res = await this.http.post<{ data: Post }>(`/v1/posts/${postId}/cancel`);
    return res.data;
  }

  async delete(postId: string): Promise<void> {
    await this.http.delete(`/v1/posts/${postId}`);
  }

  /** Generate a shareable preview link for a draft post. */
  async previewLink(postId: string): Promise<PostPreviewLink> {
    const res = await this.http.post<{ data: PostPreviewLink }>(`/v1/posts/${postId}/preview-link`);
    return res.data;
  }

  /** Retry a failed per-platform delivery for a post. */
  async retryResult(postId: string, resultId: string): Promise<PlatformResult> {
    const res = await this.http.post<{ data: PlatformResult }>(`/v1/posts/${postId}/results/${resultId}/retry`);
    return res.data;
  }

  /** Bulk-create up to 50 posts. */
  async bulkCreate(posts: CreatePostParams[]): Promise<BulkPostResult[]> {
    const body = { posts: posts.map((p) => toSnakeCase(p)) };
    const res = await this.http.post<{ data: BulkPostResult[] }>("/v1/posts/bulk", body);
    return res.data;
  }
}
