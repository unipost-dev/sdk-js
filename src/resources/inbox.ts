import type { HttpClient } from "../http.js";
import type {
  InboxItem,
  InboxListParams,
  InboxListResponse,
  InboxMarkAllReadResult,
  InboxMediaContext,
  InboxReplyOptions,
  InboxReplyRequest,
  InboxReplyResult,
  InboxSyncRequest,
  InboxSyncResult,
  InboxThreadStateRequest,
  InboxUnreadCountResult,
  InboxWebSocketConnectionDetails,
  XInboxBackfillResult,
  XInboxOutboundStatus,
} from "../types/index.js";

type InboxScope =
  | Readonly<{ kind: "managed_user"; externalUserId: string }>
  | Readonly<{ kind: "workspace" }>;

interface InboxListWireResponse {
  data: InboxItem[];
  request_id?: string;
}

interface InboxReplyWireResponse {
  data?: InboxItem;
  error?: {
    code?: string;
    message?: string;
  };
  request_id?: string;
}

interface InboxDataWireResponse<T> {
  data: T;
}

interface XInboxBackfillWireRequest {
  account_id?: string;
  lookback_days?: number;
  max_items?: number;
  include_replies: boolean;
  include_dms: boolean;
  confirmation_token?: string;
}

export class ScopedInbox {
  readonly #http: HttpClient;
  readonly #scope: InboxScope;

  constructor(http: HttpClient, scope: InboxScope) {
    this.#http = http;
    this.#scope = scope;
  }

  #scopeQuery(): Record<string, string> {
    const query: Record<string, string> = { inbox_scope: this.#scope.kind };
    if (this.#scope.kind === "managed_user") {
      query.external_user_id = this.#scope.externalUserId;
    }
    return query;
  }

  #post<T>(path: string, body?: unknown): Promise<T> {
    return this.#http.request<T>("POST", path, {
      body,
      query: this.#scopeQuery(),
      retryRateLimits: false,
    });
  }

  async list(params?: InboxListParams): Promise<InboxListResponse> {
    const query: Record<string, string | number | boolean> = this.#scopeQuery();
    if (params?.source !== undefined) query.source = params.source;
    if (params?.isRead !== undefined) query.is_read = params.isRead;
    if (params?.isOwn !== undefined) query.is_own = params.isOwn;
    if (params?.limit !== undefined) query.limit = params.limit;

    const response = await this.#http.get<InboxListWireResponse>("/v1/inbox", query);
    const result: InboxListResponse = { data: response.data };
    if (response.request_id !== undefined) result.requestId = response.request_id;
    return result;
  }

  async unreadCount(): Promise<InboxUnreadCountResult> {
    const response = await this.#http.get<InboxDataWireResponse<InboxUnreadCountResult>>(
      "/v1/inbox/unread-count",
      this.#scopeQuery(),
    );
    return response.data;
  }

  async get(id: string): Promise<InboxItem> {
    const response = await this.#http.get<InboxDataWireResponse<InboxItem>>(
      `/v1/inbox/${encodeURIComponent(id)}`,
      this.#scopeQuery(),
    );
    return response.data;
  }

  async markRead(id: string): Promise<void> {
    await this.#post<void>(`/v1/inbox/${encodeURIComponent(id)}/read`);
  }

  async markAllRead(): Promise<InboxMarkAllReadResult> {
    const response = await this.#post<InboxDataWireResponse<InboxMarkAllReadResult>>(
      "/v1/inbox/mark-all-read",
    );
    return response.data;
  }

  async updateThreadState(
    id: string,
    request: InboxThreadStateRequest,
  ): Promise<InboxItem> {
    const body: { thread_status: InboxThreadStateRequest["threadStatus"]; assigned_to?: string } = {
      thread_status: request.threadStatus,
    };
    if (request.assignedTo !== undefined) body.assigned_to = request.assignedTo;

    const response = await this.#post<InboxDataWireResponse<InboxItem>>(
      `/v1/inbox/${encodeURIComponent(id)}/thread-state`,
      body,
    );
    return response.data;
  }

  async mediaContext(id: string): Promise<InboxMediaContext> {
    const response = await this.#http.get<InboxDataWireResponse<InboxMediaContext>>(
      `/v1/inbox/${encodeURIComponent(id)}/media-context`,
      this.#scopeQuery(),
    );
    return response.data;
  }

  async sync(request?: InboxSyncRequest): Promise<InboxSyncResult | XInboxBackfillResult> {
    let body: { x_backfill: XInboxBackfillWireRequest } | undefined;
    if (request?.xBackfill !== undefined) {
      const source = request.xBackfill;
      const xBackfill: XInboxBackfillWireRequest = {
        include_replies: source.includeReplies,
        include_dms: source.includeDms,
      };
      if (source.accountId !== undefined) xBackfill.account_id = source.accountId;
      if (source.lookbackDays !== undefined) xBackfill.lookback_days = source.lookbackDays;
      if (source.maxItems !== undefined) xBackfill.max_items = source.maxItems;
      if (source.confirmationToken !== undefined) {
        xBackfill.confirmation_token = source.confirmationToken;
      }
      body = { x_backfill: xBackfill };
    }

    const response = await this.#post<
      InboxDataWireResponse<InboxSyncResult | XInboxBackfillResult>
    >("/v1/inbox/sync", body);
    return response.data;
  }

  async xOutboundStatus(requestId: string): Promise<XInboxOutboundStatus> {
    const response = await this.#http.get<InboxDataWireResponse<XInboxOutboundStatus>>(
      `/v1/inbox/x-outbound-operations/${encodeURIComponent(requestId)}`,
      this.#scopeQuery(),
    );
    return response.data;
  }

  webSocketConnectionDetails(): InboxWebSocketConnectionDetails {
    return this.#http.inboxWebSocketConnectionDetails(this.#scopeQuery());
  }

  async reply(
    id: string,
    request: InboxReplyRequest,
    options?: InboxReplyOptions,
  ): Promise<InboxReplyResult> {
    const headers = options?.idempotencyKey === undefined
      ? undefined
      : { "Idempotency-Key": options.idempotencyKey };
    const response = await this.#http.requestWithResponse<InboxReplyWireResponse>(
      "POST",
      `/v1/inbox/${encodeURIComponent(id)}/reply`,
      {
        body: { text: request.text },
        query: this.#scopeQuery(),
        headers,
        retryRateLimits: false,
        preserveErrorCode: true,
      },
    ).catch((error: unknown) => {
      if (error instanceof SyntaxError) {
        throw new Error("Failed to decode Inbox reply response.");
      }
      throw error;
    });
    const operationId = response.headers.get("X-UniPost-Operation-Id")?.trim();

    if (response.status === 200 && isRecord(response.body?.data)) {
      const result: InboxReplyResult = {
        state: "completed",
        item: response.body.data as unknown as InboxItem,
      };
      if (operationId) result.operationId = operationId;
      return result;
    }

    if (
      response.status === 202
      && operationId
      && response.body?.error?.code === "X_REMOTE_ACCEPTED_RECONCILING"
      && typeof response.body.error.message === "string"
      && (response.body.request_id === undefined || typeof response.body.request_id === "string")
    ) {
      const result: InboxReplyResult = {
        state: "reconciling",
        operationId,
        code: "X_REMOTE_ACCEPTED_RECONCILING",
        message: response.body.error.message,
      };
      if (response.body.request_id !== undefined) result.requestId = response.body.request_id;
      return result;
    }

    throw new Error(`Failed to decode Inbox reply response with status ${response.status}.`);
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export class Inbox {
  readonly #http: HttpClient;

  constructor(http: HttpClient) {
    this.#http = http;
  }

  managedUser(externalUserId: string): ScopedInbox {
    if (externalUserId.trim().length === 0) {
      throw new Error("Managed-user Inbox scope requires a non-empty external user ID.");
    }

    return new ScopedInbox(
      this.#http,
      Object.freeze({ kind: "managed_user", externalUserId }),
    );
  }

  workspace(): ScopedInbox {
    return new ScopedInbox(this.#http, Object.freeze({ kind: "workspace" }));
  }
}
