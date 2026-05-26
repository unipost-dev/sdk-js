import type { HttpClient } from "../http.js";
import type {
  AnalyticsPlatformAvailability,
  AnalyticsPlatformDetail,
  AnalyticsPlatformParams,
  AnalyticsPostRow,
  AnalyticsPostsParams,
  AnalyticsRefreshParams,
  AnalyticsRefreshResponse,
  AnalyticsRollupParams,
  AnalyticsRollup,
  AnalyticsQueryParams,
  PaginatedResponse,
} from "../types/index.js";

function buildQuery(params: AnalyticsQueryParams = {}): Record<string, string | undefined> {
  const query: Record<string, string | undefined> = {};
  if (params.from) query.from = params.from;
  if (params.to) query.to = params.to;
  if (params.profileId) query.profile_id = params.profileId;
  if (params.platform) query.platform = params.platform;
  if (params.status) query.status = params.status;
  return query;
}

function buildPostsQuery(params: AnalyticsPostsParams = {}): Record<string, string | number | undefined> {
  return {
    ...buildQuery(params),
    account_id: params.accountId,
    post_id: params.postId,
    limit: params.limit,
    cursor: params.cursor,
    sort: params.sort,
  };
}

function buildPlatformQuery(params: AnalyticsPlatformParams = {}): Record<string, string | undefined> {
  return {
    from: params.from,
    to: params.to,
    profile_id: params.profileId,
  };
}

function buildRefreshBody(params: AnalyticsRefreshParams = {}): Record<string, string | number | undefined> {
  return {
    platform: params.platform,
    profile_id: params.profileId,
    account_id: params.accountId,
    post_id: params.postId,
    from: params.from,
    to: params.to,
    limit: params.limit,
  };
}

export class Analytics {
  constructor(private readonly http: HttpClient) {}

  async summary(params: AnalyticsQueryParams = {}): Promise<Record<string, unknown>> {
    const res = await this.http.get<{ data: Record<string, unknown> }>("/v1/analytics/summary", buildQuery(params));
    return res.data;
  }

  async trend(params: AnalyticsQueryParams = {}): Promise<Record<string, unknown>> {
    const res = await this.http.get<{ data: Record<string, unknown> }>("/v1/analytics/trend", buildQuery(params));
    return res.data;
  }

  async byPlatform(params: AnalyticsQueryParams = {}): Promise<Record<string, unknown>[]> {
    const res = await this.http.get<{ data: Record<string, unknown>[] }>("/v1/analytics/by-platform", buildQuery(params));
    return res.data;
  }

  /** Aggregated rollup with a granularity (day/week/month) and group_by axis. */
  async rollup(params: AnalyticsRollupParams): Promise<AnalyticsRollup> {
    const res = await this.http.get<{ data: AnalyticsRollup }>("/v1/analytics/rollup", {
      from: params.from,
      to: params.to,
      granularity: params.granularity,
      group_by: params.groupBy,
    });
    return res.data;
  }

  /** Paginated post-level analytics rows across UniPost-published content. */
  async posts(params: AnalyticsPostsParams = {}): Promise<PaginatedResponse<AnalyticsPostRow>> {
    const res = await this.http.get<{
      data: AnalyticsPostRow[];
      meta?: PaginatedResponse<AnalyticsPostRow>["meta"];
      next_cursor?: string;
    }>("/v1/analytics/posts", buildPostsQuery(params));
    return {
      data: res.data || [],
      meta: res.meta,
      nextCursor: res.meta?.next_cursor || res.next_cursor,
    };
  }

  /** Export post-level analytics rows as CSV text. */
  async exportPostsCsv(params: AnalyticsPostsParams = {}): Promise<string> {
    return this.http.getText("/v1/analytics/posts/export", buildPostsQuery(params));
  }

  /** Analytics availability and health by destination platform. */
  async platforms(params: AnalyticsPlatformParams = {}): Promise<AnalyticsPlatformAvailability[]> {
    const res = await this.http.get<{ data: AnalyticsPlatformAvailability[] }>("/v1/analytics/platforms", buildPlatformQuery(params));
    return res.data || [];
  }

  /** Detailed analytics for one platform, including summary, trend, accounts, and top posts. */
  async platform(platform: string, params: AnalyticsPlatformParams = {}): Promise<AnalyticsPlatformDetail> {
    const res = await this.http.get<{ data: AnalyticsPlatformDetail }>(
      `/v1/analytics/platforms/${encodeURIComponent(platform)}`,
      buildPlatformQuery(params),
    );
    return res.data;
  }

  /** Mark matching analytics rows stale so background workers refresh platform metrics. */
  async refresh(params: AnalyticsRefreshParams = {}): Promise<AnalyticsRefreshResponse> {
    const res = await this.http.post<{ data: AnalyticsRefreshResponse }>("/v1/analytics/refresh", buildRefreshBody(params));
    return res.data;
  }
}
