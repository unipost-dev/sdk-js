import type { HttpClient } from "../http.js";
import type {
  Post,
  CreatePostParams,
  ListPostsParams,
  PostAnalytics,
  PaginatedResponse,
} from "../types/index.js";

function toSnakeCase(params: CreatePostParams): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (params.caption !== undefined) body.caption = params.caption;
  if (params.accountIds) body.account_ids = params.accountIds;
  if (params.mediaUrls) body.media_urls = params.mediaUrls;
  if (params.scheduledAt) body.scheduled_at = params.scheduledAt;
  if (params.status) body.status = params.status;
  if (params.platformPosts) {
    body.platform_posts = params.platformPosts.map((pp) => {
      const entry: Record<string, unknown> = { account_id: pp.accountId };
      if (pp.caption !== undefined) entry.caption = pp.caption;
      if (pp.threadPosition !== undefined) entry.thread_position = pp.threadPosition;
      if (pp.firstComment !== undefined) entry.first_comment = pp.firstComment;
      if (pp.mediaIds) entry.media_ids = pp.mediaIds;
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
    if (params.idempotencyKey) {
      headers["Idempotency-Key"] = params.idempotencyKey;
    }
    const res = await this.http.post<{ data: Post }>("/v1/social-posts", body, headers);
    return res.data;
  }

  /** List posts with optional filters and cursor pagination. */
  async list(params?: ListPostsParams): Promise<PaginatedResponse<Post> & { nextCursor?: string }> {
    const query: Record<string, string | number | undefined> = {};
    if (params?.status) query.status = params.status;
    if (params?.platform) query.platform = params.platform;
    if (params?.from) query.from = params.from;
    if (params?.to) query.to = params.to;
    if (params?.limit) query.limit = params.limit;
    if (params?.cursor) query.cursor = params.cursor;
    return this.http.get("/v1/social-posts", query);
  }

  /** Iterate all posts using async generator (auto-pagination). */
  async *listAll(params?: Omit<ListPostsParams, "cursor">): AsyncGenerator<Post> {
    let cursor: string | undefined;
    do {
      const page = await this.list({ ...params, cursor });
      for (const post of page.data) {
        yield post;
      }
      cursor = page.nextCursor;
    } while (cursor);
  }

  /** Get a single post by ID. */
  async get(postId: string): Promise<Post> {
    const res = await this.http.get<{ data: Post }>(`/v1/social-posts/${postId}`);
    return res.data;
  }

  /** Get analytics for a post. */
  async analytics(postId: string): Promise<PostAnalytics> {
    const res = await this.http.get<{ data: PostAnalytics }>(`/v1/social-posts/${postId}/analytics`);
    return res.data;
  }

  /** Publish a draft post. */
  async publish(postId: string): Promise<Post> {
    const res = await this.http.post<{ data: Post }>(`/v1/social-posts/${postId}/publish`);
    return res.data;
  }

  /** Cancel a scheduled post. */
  async cancel(postId: string): Promise<Post> {
    const res = await this.http.post<{ data: Post }>(`/v1/social-posts/${postId}/cancel`);
    return res.data;
  }

  /** Bulk create posts (up to 50). */
  async bulkCreate(posts: CreatePostParams[]): Promise<Post[]> {
    const body = posts.map(toSnakeCase);
    const res = await this.http.post<{ data: Post[] }>("/v1/social-posts/bulk", body);
    return res.data;
  }
}
