import type { HttpClient } from "../http.js";
import type {
  InboxItem,
  InboxListParams,
  InboxListResponse,
  InboxReplyOptions,
  InboxReplyRequest,
  InboxReplyResult,
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
