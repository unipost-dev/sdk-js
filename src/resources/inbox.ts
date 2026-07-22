import type { HttpClient } from "../http.js";
import type { InboxItem, InboxListParams, InboxListResponse } from "../types/index.js";

type InboxScope =
  | Readonly<{ kind: "managed_user"; externalUserId: string }>
  | Readonly<{ kind: "workspace" }>;

interface InboxListWireResponse {
  data: InboxItem[];
  request_id?: string;
}

export class ScopedInbox {
  constructor(
    private readonly http: HttpClient,
    private readonly scope: InboxScope,
  ) {}

  async list(params?: InboxListParams): Promise<InboxListResponse> {
    const query: Record<string, string | number | boolean> = {
      inbox_scope: this.scope.kind,
    };

    if (this.scope.kind === "managed_user") {
      query.external_user_id = this.scope.externalUserId;
    }
    if (params?.source !== undefined) query.source = params.source;
    if (params?.isRead !== undefined) query.is_read = params.isRead;
    if (params?.isOwn !== undefined) query.is_own = params.isOwn;
    if (params?.limit !== undefined) query.limit = params.limit;

    const response = await this.http.get<InboxListWireResponse>("/v1/inbox", query);
    const result: InboxListResponse = { data: response.data };
    if (response.request_id !== undefined) result.requestId = response.request_id;
    return result;
  }
}

export class Inbox {
  constructor(private readonly http: HttpClient) {}

  managedUser(externalUserId: string): ScopedInbox {
    if (externalUserId.trim().length === 0) {
      throw new Error("Managed-user Inbox scope requires a non-empty external user ID.");
    }

    return new ScopedInbox(
      this.http,
      Object.freeze({ kind: "managed_user", externalUserId }),
    );
  }

  workspace(): ScopedInbox {
    return new ScopedInbox(this.http, Object.freeze({ kind: "workspace" }));
  }
}
