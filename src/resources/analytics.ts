import type { HttpClient } from "../http.js";
import type {
  AnalyticsRollupParams,
  AnalyticsRollup,
  AnalyticsQueryParams,
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
}
