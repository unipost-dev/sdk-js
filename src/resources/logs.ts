import type { HttpClient } from "../http.js";
import type {
  LogEntry,
  ListLogsParams,
  LogStreamParams,
  LogStreamOptions,
  PaginatedResponse,
} from "../types/index.js";

function buildQuery(params: ListLogsParams | LogStreamParams = {}): Record<string, string | number | undefined> {
  return {
    category: params.category,
    action: "action" in params ? params.action : undefined,
    source: "source" in params ? params.source : undefined,
    level: params.level,
    status: params.status,
    platform: params.platform,
    profile_id: params.profileId,
    social_account_id: params.socialAccountId,
    post_id: params.postId,
    request_id: params.requestId,
    error_code: params.errorCode,
    q: "q" in params ? params.q : undefined,
    from: "from" in params ? params.from : undefined,
    to: "to" in params ? params.to : undefined,
    limit: "limit" in params ? params.limit : undefined,
    cursor: "cursor" in params ? params.cursor : undefined,
    after_id: "afterId" in params ? params.afterId : undefined,
  };
}

export class Logs {
  constructor(private readonly http: HttpClient) {}

  async list(params: ListLogsParams = {}): Promise<PaginatedResponse<LogEntry> & { nextCursor?: string }> {
    const response = await this.http.get<PaginatedResponse<LogEntry> & { next_cursor?: string }>(
      "/v1/logs",
      buildQuery(params),
    );
    const nextCursor = response?.meta?.next_cursor ?? response?.nextCursor ?? response?.next_cursor;
    return { ...response, nextCursor };
  }

  async get(logId: number | string): Promise<LogEntry> {
    const res = await this.http.get<{ data: LogEntry }>(`/v1/logs/${encodeURIComponent(String(logId))}`);
    return res.data;
  }

  async *stream(
    params: LogStreamParams = {},
    options: LogStreamOptions = {},
  ): AsyncGenerator<LogEntry> {
    const headers: Record<string, string> = {};
    if (options.lastEventId !== undefined) headers["Last-Event-ID"] = String(options.lastEventId);

    for await (const event of this.http.streamSSE<LogEntry>("/v1/logs/stream", {
      query: buildQuery(params),
      headers,
      signal: options.signal,
    })) {
      if (!event.event || event.event === "log.created") {
        yield event.data;
      }
    }
  }
}
