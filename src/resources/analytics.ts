import type { HttpClient } from "../http.js";
import type { AnalyticsRollupParams, AnalyticsRollup } from "../types/index.js";

export class Analytics {
  constructor(private readonly http: HttpClient) {}

  /** Get aggregated analytics rollup. */
  async rollup(params: AnalyticsRollupParams): Promise<AnalyticsRollup> {
    const query: Record<string, string | undefined> = {
      from: params.from,
      to: params.to,
      granularity: params.granularity,
      group_by: params.groupBy,
    };
    const res = await this.http.get<{ data: AnalyticsRollup }>("/v1/analytics/rollup", query);
    return res.data;
  }
}
