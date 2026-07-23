import { beforeEach, describe, expect, it, vi } from "vitest";
import { RateLimitError, UniPost, UniPostError } from "../src/index.js";
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
  InboxThreadStatus,
  InboxUnreadCountResult,
  InboxWebSocketConnectionDetails,
  XInboxBackfillAccountResult,
  XInboxBackfillRequest,
  XInboxBackfillResult,
  XInboxOutboundStatus,
} from "../src/index.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

type ExpectedInboxSource =
  | "ig_comment"
  | "ig_dm"
  | "threads_reply"
  | "fb_comment"
  | "fb_dm"
  | "x_reply"
  | "x_dm";
type ExpectedInboxListParams = {
  source?: ExpectedInboxSource;
  isRead?: boolean;
  isOwn?: boolean;
  limit?: number;
};
type ExpectedInboxListResponse = {
  data: InboxItem[];
  requestId?: string;
};
type ExpectedInboxReplyRequest = {
  text: string;
};
type ExpectedInboxReplyOptions = {
  idempotencyKey?: string;
};
type ExpectedInboxReplyResult =
  | { state: "completed"; item: InboxItem; operationId?: string }
  | {
      state: "reconciling";
      operationId: string;
      code: "X_REMOTE_ACCEPTED_RECONCILING";
      message: string;
      requestId?: string;
    };
type ExpectedInboxThreadStatus = "open" | "assigned" | "resolved";
type ExpectedInboxUnreadCountResult = { count: number };
type ExpectedInboxMarkAllReadResult = { marked: number };
type ExpectedInboxThreadStateRequest = {
  threadStatus: InboxThreadStatus;
  assignedTo?: string;
};
type ExpectedInboxMediaContext = {
  id: string;
  caption: string;
  media_url: string;
  timestamp: string;
  media_type: string;
  permalink: string;
};
type ExpectedXInboxBackfillRequest = {
  accountId?: string;
  lookbackDays?: number;
  maxItems?: number;
  includeReplies: boolean;
  includeDms: boolean;
  confirmationToken?: string;
};
type ExpectedInboxSyncRequest = { xBackfill: XInboxBackfillRequest };
type ExpectedInboxSyncResult = {
  new_items: number;
  accounts_checked: number;
  errors: Array<{
    account_id: string;
    platform: string;
    step: string;
    error: string;
  }>;
  details: Array<{
    account_id: string;
    platform: string;
    account_name: string;
    media_found: number;
    comments_found: number;
  }>;
};
type ExpectedXInboxBackfillAccountResult = {
  account_id: string;
  accepted: number;
  suppressed: number;
  duplicates: number;
  read: number;
  stopped_at_boundary?: boolean;
  stop_reason?: string;
  missing_scopes?: string[];
};
type ExpectedXInboxBackfillResult =
  | {
      status: "in_progress";
      confirmation_operation_id: string;
      execution_lease_expires_at: string;
      estimated_x_credits?: number;
      confirmation_required?: false;
      confirmation_token?: string;
      confirmation_expires_at?: string;
      accounts_checked?: number;
      accepted?: number;
      suppressed?: number;
      duplicates?: number;
      read?: number;
      details?: XInboxBackfillAccountResult[];
    }
  | {
      status?: never;
      confirmation_required: true;
      confirmation_token: string;
      confirmation_expires_at: string;
      accounts_checked: number;
      estimated_x_credits?: number;
      confirmation_operation_id?: string;
      execution_lease_expires_at?: string;
      accepted?: number;
      suppressed?: number;
      duplicates?: number;
      read?: number;
      details?: XInboxBackfillAccountResult[];
    }
  | {
      status?: never;
      confirmation_required: false;
      accounts_checked: number;
      accepted: number;
      suppressed: number;
      duplicates: number;
      read: number;
      estimated_x_credits?: number;
      confirmation_operation_id?: string;
      confirmation_token?: string;
      confirmation_expires_at?: string;
      execution_lease_expires_at?: string;
      details?: XInboxBackfillAccountResult[];
    };
type ExpectedXInboxOutboundStatus = {
  id: string;
  status: string;
  completion_attempts: number;
  reconciliation_deadline?: string;
  reconciliation_required: boolean;
  response_inbox_item_id?: string;
  updated_at: string;
};
type ExpectedInboxWebSocketConnectionDetails = {
  readonly url: string;
  readonly headers: Readonly<{ Authorization: string }>;
};
type IsAny<Value> = 0 extends (1 & Value) ? true : false;
type Equal<Left, Right> =
  IsAny<Left> extends true
    ? false
    : IsAny<Right> extends true
      ? false
      : (<Value>() => Value extends Left ? 1 : 2) extends
          (<Value>() => Value extends Right ? 1 : 2)
        ? (<Value>() => Value extends Right ? 1 : 2) extends
            (<Value>() => Value extends Left ? 1 : 2)
          ? true
          : false
        : false;
type Assert<Condition extends true> = Condition;
type InboxItemIsNotAny = Assert<Equal<IsAny<InboxItem>, false>>;
type InboxListParamsIsExact = Assert<Equal<InboxListParams, ExpectedInboxListParams>>;
type InboxListResponseIsExact = Assert<Equal<InboxListResponse, ExpectedInboxListResponse>>;
type InboxReplyRequestIsExact = Assert<Equal<InboxReplyRequest, ExpectedInboxReplyRequest>>;
type InboxReplyOptionsIsExact = Assert<Equal<InboxReplyOptions, ExpectedInboxReplyOptions>>;
type InboxReplyResultIsExact = Assert<Equal<InboxReplyResult, ExpectedInboxReplyResult>>;
type InboxThreadStatusIsExact = Assert<Equal<InboxThreadStatus, ExpectedInboxThreadStatus>>;
type InboxUnreadCountResultIsExact = Assert<
  Equal<InboxUnreadCountResult, ExpectedInboxUnreadCountResult>
>;
type InboxMarkAllReadResultIsExact = Assert<
  Equal<InboxMarkAllReadResult, ExpectedInboxMarkAllReadResult>
>;
type InboxThreadStateRequestIsExact = Assert<
  Equal<InboxThreadStateRequest, ExpectedInboxThreadStateRequest>
>;
type InboxMediaContextIsExact = Assert<Equal<InboxMediaContext, ExpectedInboxMediaContext>>;
type XInboxBackfillRequestIsExact = Assert<
  Equal<XInboxBackfillRequest, ExpectedXInboxBackfillRequest>
>;
type InboxSyncRequestIsExact = Assert<Equal<InboxSyncRequest, ExpectedInboxSyncRequest>>;
type InboxSyncResultIsExact = Assert<Equal<InboxSyncResult, ExpectedInboxSyncResult>>;
type XInboxBackfillAccountResultIsExact = Assert<
  Equal<XInboxBackfillAccountResult, ExpectedXInboxBackfillAccountResult>
>;
type XInboxBackfillResultIsExact = Assert<
  Equal<XInboxBackfillResult, ExpectedXInboxBackfillResult>
>;
type XInboxOutboundStatusIsExact = Assert<
  Equal<XInboxOutboundStatus, ExpectedXInboxOutboundStatus>
>;
type InboxWebSocketConnectionDetailsIsExact = Assert<
  Equal<InboxWebSocketConnectionDetails, ExpectedInboxWebSocketConnectionDetails>
>;
type ScopedInboxListResult = Awaited<
  ReturnType<ReturnType<UniPost["inbox"]["workspace"]>["list"]>
>;
type ScopedInboxListResultIsExact = Assert<Equal<ScopedInboxListResult, InboxListResponse>>;
type ExpectedScopedInboxListParameters = [params?: InboxListParams];
type ManagedUserScopedInboxList = ReturnType<UniPost["inbox"]["managedUser"]>["list"];
type ManagedUserScopedInboxListParameters = Parameters<ManagedUserScopedInboxList>;
type ManagedUserScopedInboxListParameter = ManagedUserScopedInboxListParameters[0];
type ManagedUserScopedInboxListResult = Awaited<ReturnType<ManagedUserScopedInboxList>>;
type ManagedUserScopedInboxListParametersAreExact = Assert<
  Equal<ManagedUserScopedInboxListParameters, ExpectedScopedInboxListParameters>
>;
type ManagedUserScopedInboxListParameterIsNotAny = Assert<
  Equal<IsAny<ManagedUserScopedInboxListParameter>, false>
>;
type ManagedUserScopedInboxListResultIsExact = Assert<
  Equal<ManagedUserScopedInboxListResult, InboxListResponse>
>;
type ManagedUserScopedInboxListResultIsNotAny = Assert<
  Equal<IsAny<ManagedUserScopedInboxListResult>, false>
>;
type WorkspaceScopedInboxList = ReturnType<UniPost["inbox"]["workspace"]>["list"];
type WorkspaceScopedInboxListParameters = Parameters<WorkspaceScopedInboxList>;
type WorkspaceScopedInboxListParameter = WorkspaceScopedInboxListParameters[0];
type WorkspaceScopedInboxListResult = Awaited<ReturnType<WorkspaceScopedInboxList>>;
type WorkspaceScopedInboxListParametersAreExact = Assert<
  Equal<WorkspaceScopedInboxListParameters, ExpectedScopedInboxListParameters>
>;
type WorkspaceScopedInboxListParameterIsNotAny = Assert<
  Equal<IsAny<WorkspaceScopedInboxListParameter>, false>
>;
type WorkspaceScopedInboxListResultIsExact = Assert<
  Equal<WorkspaceScopedInboxListResult, InboxListResponse>
>;
type WorkspaceScopedInboxListResultIsNotAny = Assert<
  Equal<IsAny<WorkspaceScopedInboxListResult>, false>
>;
type ExpectedScopedInboxReplyParameters = [
  id: string,
  request: InboxReplyRequest,
  options?: InboxReplyOptions,
];
type ManagedUserScopedInboxReply = ReturnType<UniPost["inbox"]["managedUser"]>["reply"];
type ManagedUserScopedInboxReplyParameters = Parameters<ManagedUserScopedInboxReply>;
type ManagedUserScopedInboxReplyRequest = ManagedUserScopedInboxReplyParameters[1];
type ManagedUserScopedInboxReplyOptions = ManagedUserScopedInboxReplyParameters[2];
type ManagedUserScopedInboxReplyResult = Awaited<ReturnType<ManagedUserScopedInboxReply>>;
type ManagedUserScopedInboxReplyParametersAreExact = Assert<
  Equal<ManagedUserScopedInboxReplyParameters, ExpectedScopedInboxReplyParameters>
>;
type ManagedUserScopedInboxReplyRequestIsNotAny = Assert<
  Equal<IsAny<ManagedUserScopedInboxReplyRequest>, false>
>;
type ManagedUserScopedInboxReplyOptionsIsNotAny = Assert<
  Equal<IsAny<ManagedUserScopedInboxReplyOptions>, false>
>;
type ManagedUserScopedInboxReplyResultIsExact = Assert<
  Equal<ManagedUserScopedInboxReplyResult, InboxReplyResult>
>;
type ManagedUserScopedInboxReplyResultIsNotAny = Assert<
  Equal<IsAny<ManagedUserScopedInboxReplyResult>, false>
>;
type WorkspaceScopedInboxReply = ReturnType<UniPost["inbox"]["workspace"]>["reply"];
type WorkspaceScopedInboxReplyParameters = Parameters<WorkspaceScopedInboxReply>;
type WorkspaceScopedInboxReplyResult = Awaited<ReturnType<WorkspaceScopedInboxReply>>;
type WorkspaceScopedInboxReplyParametersAreExact = Assert<
  Equal<WorkspaceScopedInboxReplyParameters, ExpectedScopedInboxReplyParameters>
>;
type WorkspaceScopedInboxReplyResultIsExact = Assert<
  Equal<WorkspaceScopedInboxReplyResult, InboxReplyResult>
>;
type WorkspaceScopedInboxReplyResultIsNotAny = Assert<
  Equal<IsAny<WorkspaceScopedInboxReplyResult>, false>
>;
type InboxListParamsContract = Pick<InboxListParams, keyof ExpectedInboxListParams>;
type ScopedInbox = ReturnType<UniPost["inbox"]["workspace"]>;

type ScopedInboxUnreadCountParametersAreExact = Assert<
  Equal<Parameters<ScopedInbox["unreadCount"]>, []>
>;
type ScopedInboxUnreadCountResult = Awaited<ReturnType<ScopedInbox["unreadCount"]>>;
type ScopedInboxUnreadCountResultIsExact = Assert<
  Equal<ScopedInboxUnreadCountResult, InboxUnreadCountResult>
>;
type ScopedInboxUnreadCountResultIsNotAny = Assert<
  Equal<IsAny<ScopedInboxUnreadCountResult>, false>
>;
type ScopedInboxGetParametersAreExact = Assert<
  Equal<Parameters<ScopedInbox["get"]>, [id: string]>
>;
type ScopedInboxGetResult = Awaited<ReturnType<ScopedInbox["get"]>>;
type ScopedInboxGetResultIsExact = Assert<Equal<ScopedInboxGetResult, InboxItem>>;
type ScopedInboxGetResultIsNotAny = Assert<Equal<IsAny<ScopedInboxGetResult>, false>>;
type ScopedInboxMarkReadParametersAreExact = Assert<
  Equal<Parameters<ScopedInbox["markRead"]>, [id: string]>
>;
type ScopedInboxMarkReadResult = Awaited<ReturnType<ScopedInbox["markRead"]>>;
type ScopedInboxMarkReadResultIsExact = Assert<Equal<ScopedInboxMarkReadResult, void>>;
type ScopedInboxMarkReadResultIsNotAny = Assert<
  Equal<IsAny<ScopedInboxMarkReadResult>, false>
>;
type ScopedInboxMarkAllReadParametersAreExact = Assert<
  Equal<Parameters<ScopedInbox["markAllRead"]>, []>
>;
type ScopedInboxMarkAllReadResult = Awaited<ReturnType<ScopedInbox["markAllRead"]>>;
type ScopedInboxMarkAllReadResultIsExact = Assert<
  Equal<ScopedInboxMarkAllReadResult, InboxMarkAllReadResult>
>;
type ScopedInboxMarkAllReadResultIsNotAny = Assert<
  Equal<IsAny<ScopedInboxMarkAllReadResult>, false>
>;
type ScopedInboxUpdateThreadStateParametersAreExact = Assert<
  Equal<
    Parameters<ScopedInbox["updateThreadState"]>,
    [id: string, request: InboxThreadStateRequest]
  >
>;
type ScopedInboxUpdateThreadStateRequest = Parameters<
  ScopedInbox["updateThreadState"]
>[1];
type ScopedInboxUpdateThreadStateRequestIsNotAny = Assert<
  Equal<IsAny<ScopedInboxUpdateThreadStateRequest>, false>
>;
type ScopedInboxUpdateThreadStateResult = Awaited<
  ReturnType<ScopedInbox["updateThreadState"]>
>;
type ScopedInboxUpdateThreadStateResultIsExact = Assert<
  Equal<ScopedInboxUpdateThreadStateResult, InboxItem>
>;
type ScopedInboxUpdateThreadStateResultIsNotAny = Assert<
  Equal<IsAny<ScopedInboxUpdateThreadStateResult>, false>
>;
type ScopedInboxMediaContextParametersAreExact = Assert<
  Equal<Parameters<ScopedInbox["mediaContext"]>, [id: string]>
>;
type ScopedInboxMediaContextResult = Awaited<ReturnType<ScopedInbox["mediaContext"]>>;
type ScopedInboxMediaContextResultIsExact = Assert<
  Equal<ScopedInboxMediaContextResult, InboxMediaContext>
>;
type ScopedInboxMediaContextResultIsNotAny = Assert<
  Equal<IsAny<ScopedInboxMediaContextResult>, false>
>;
type ScopedInboxSyncOverloadsAreExact = Assert<
  ScopedInbox["sync"] extends {
    (): Promise<InboxSyncResult>;
    (request: undefined): Promise<InboxSyncResult>;
    (request: InboxSyncRequest): Promise<XInboxBackfillResult>;
    (
      request: InboxSyncRequest | undefined,
    ): Promise<InboxSyncResult | XInboxBackfillResult>;
  }
    ? true
    : false
>;
type ScopedInboxXOutboundStatusParametersAreExact = Assert<
  Equal<Parameters<ScopedInbox["xOutboundStatus"]>, [requestId: string]>
>;
type ScopedInboxXOutboundStatusResult = Awaited<
  ReturnType<ScopedInbox["xOutboundStatus"]>
>;
type ScopedInboxXOutboundStatusResultIsExact = Assert<
  Equal<ScopedInboxXOutboundStatusResult, XInboxOutboundStatus>
>;
type ScopedInboxXOutboundStatusResultIsNotAny = Assert<
  Equal<IsAny<ScopedInboxXOutboundStatusResult>, false>
>;
type ScopedInboxWebSocketConnectionDetailsParametersAreExact = Assert<
  Equal<Parameters<ScopedInbox["webSocketConnectionDetails"]>, []>
>;
type ScopedInboxWebSocketConnectionDetailsResult = ReturnType<
  ScopedInbox["webSocketConnectionDetails"]
>;
type ScopedInboxWebSocketConnectionDetailsResultIsExact = Assert<
  Equal<ScopedInboxWebSocketConnectionDetailsResult, InboxWebSocketConnectionDetails>
>;
type ScopedInboxWebSocketConnectionDetailsResultIsNotAny = Assert<
  Equal<IsAny<ScopedInboxWebSocketConnectionDetailsResult>, false>
>;

const item = {
  id: "inbox_1",
  social_account_id: "sa_1",
  workspace_id: "ws_1",
  source: "ig_comment" as const,
  external_id: "comment_1",
  thread_key: "thread_1",
  thread_status: "open" as const,
  is_read: false,
  is_own: false,
  received_at: "2026-07-22T00:00:00Z",
  created_at: "2026-07-22T00:00:00Z",
};

const mediaContext: InboxMediaContext = {
  id: "media_1",
  caption: "Launch post",
  media_url: "https://cdn.example.test/media_1.jpg",
  timestamp: "2026-07-21T23:00:00Z",
  media_type: "IMAGE",
  permalink: "https://social.example.test/posts/media_1",
};

const syncResult: InboxSyncResult = {
  new_items: 3,
  accounts_checked: 1,
  errors: [],
  details: [
    {
      account_id: "sa_1",
      platform: "instagram",
      account_name: "UniPost",
      media_found: 2,
      comments_found: 3,
    },
  ],
};

const xBackfillResult: XInboxBackfillResult = {
  status: "in_progress",
  confirmation_operation_id: "confirm_operation_1",
  execution_lease_expires_at: "2026-07-22T01:30:00Z",
  estimated_x_credits: 42,
  confirmation_required: false,
  accounts_checked: 1,
  accepted: 7,
  suppressed: 2,
  duplicates: 1,
  read: 10,
  details: [
    {
      account_id: "sa_x_1",
      accepted: 7,
      suppressed: 2,
      duplicates: 1,
      read: 10,
      stopped_at_boundary: true,
      stop_reason: "lookback_boundary",
      missing_scopes: ["dm.read"],
    },
  ],
};

const xOutboundStatus: XInboxOutboundStatus = {
  id: "request_1",
  status: "completed",
  completion_attempts: 2,
  reconciliation_deadline: "2026-07-22T01:00:00Z",
  reconciliation_required: false,
  response_inbox_item_id: "inbox_response_1",
  updated_at: "2026-07-22T00:30:00Z",
};

function jsonResponse(
  body: unknown,
  status = 200,
  headers?: ConstructorParameters<typeof Headers>[0],
) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    text: async () => (body === undefined ? "" : JSON.stringify(body)),
    json: async () => body,
  };
}

function requestedUrl(): URL {
  const requestUrl = mockFetch.mock.calls[0]?.[0];
  expect(requestUrl).toBeTypeOf("string");
  return new URL(requestUrl as string);
}

function sortedQueryEntries(url: URL): [string, string][] {
  return [...url.searchParams.entries()].sort(
    ([leftKey, leftValue], [rightKey, rightValue]) =>
      leftKey.localeCompare(rightKey) || leftValue.localeCompare(rightValue),
  );
}

describe("Inbox", () => {
  let client: UniPost;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new UniPost({ apiKey: "test_key", baseUrl: "https://example.test" });
  });

  it("exposes the Inbox resource", () => {
    expect(client.inbox).toBeDefined();
  });

  it("lists managed-user Inbox items with the bound scope and all four filters", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: [] }));

    await client.inbox.managedUser("user A").list({
      source: "ig_comment",
      isRead: false,
      isOwn: false,
      limit: 50,
    });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("GET");
    expect(init.redirect).toBe("manual");

    const url = requestedUrl();
    expect(url.pathname).toBe("/v1/inbox");
    expect(sortedQueryEntries(url)).toEqual([
      ["external_user_id", "user A"],
      ["inbox_scope", "managed_user"],
      ["is_own", "false"],
      ["is_read", "false"],
      ["limit", "50"],
      ["source", "ig_comment"],
    ]);
    expect(url.search).toMatch(/[?&]external_user_id=user(?:\+|%20)A(?:&|$)/);
    expect(url.search).not.toContain("external_user_id=user A");
    expect(url.searchParams.getAll("inbox_scope")).toEqual(["managed_user"]);
    expect(url.searchParams.getAll("external_user_id")).toEqual(["user A"]);
    expect(url.searchParams.getAll("source")).toEqual(["ig_comment"]);
    expect(url.searchParams.getAll("is_read")).toEqual(["false"]);
    expect(url.searchParams.getAll("is_own")).toEqual(["false"]);
    expect(url.searchParams.getAll("limit")).toEqual(["50"]);
  });

  it("lists workspace Inbox items without an external user id", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: [] }));

    await client.inbox.workspace().list();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("GET");

    const url = requestedUrl();
    expect(url.pathname).toBe("/v1/inbox");
    expect(sortedQueryEntries(url)).toEqual([["inbox_scope", "workspace"]]);
    expect(url.searchParams.getAll("inbox_scope")).toEqual(["workspace"]);
    expect(url.searchParams.has("external_user_id")).toBe(false);
  });

  it("keeps the managed-user scope bound after public property shadowing", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: [] }));
    const scoped = client.inbox.managedUser("bound user");

    expect(Reflect.set(scoped as object, "scope", { kind: "workspace" })).toBe(true);
    expect(Reflect.get(scoped as object, "scope")).toEqual({ kind: "workspace" });

    await scoped.list();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const url = requestedUrl();
    expect(url.searchParams.getAll("inbox_scope")).toEqual(["managed_user"]);
    expect(url.searchParams.getAll("external_user_id")).toEqual(["bound user"]);
  });

  it.each(["", " ", "\t", "\n"])(
    "rejects the managed-user id %j synchronously before issuing a request",
    (externalUserId) => {
      expect(client.inbox).toBeDefined();
      expect(() => client.inbox.managedUser(externalUserId)).toThrow();
      expect(mockFetch).not.toHaveBeenCalled();
    },
  );

  it("keeps scope keys out of list params and ignores hostile runtime injection", async () => {
    const checkListParams = (_params: InboxListParamsContract) => undefined;

    checkListParams({ source: "ig_comment", isRead: false, isOwn: false, limit: 50 });
    // @ts-expect-error inbox_scope is bound by managedUser() or workspace(), not caller input.
    checkListParams({ inbox_scope: "workspace" });
    // @ts-expect-error external_user_id is bound by managedUser(), not caller input.
    checkListParams({ external_user_id: "attacker" });
    // @ts-expect-error Inbox lists are intentionally non-paginated.
    checkListParams({ cursor: "next_page" });

    mockFetch.mockResolvedValueOnce(jsonResponse({ data: [] }));
    const hostileParams = {
      source: "ig_comment",
      inbox_scope: "workspace",
      external_user_id: "attacker",
    } as unknown as InboxListParams;

    await client.inbox.managedUser("bound user").list(hostileParams);

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const url = requestedUrl();
    expect(url.searchParams.getAll("inbox_scope")).toEqual(["managed_user"]);
    expect(url.searchParams.getAll("external_user_id")).toEqual(["bound user"]);
    expect(url.searchParams.getAll("source")).toEqual(["ig_comment"]);
  });

  it("normalizes the non-paginated list response", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        data: [item],
        request_id: "req_1",
        meta: { has_more: true },
        cursor: "cursor_1",
        offset: 25,
        total: 100,
        next_token: "next_1",
      }),
    );

    const result = await client.inbox.workspace().list();

    expect(result).toEqual({ data: [item], requestId: "req_1" });
    expect(Object.keys(result).sort()).toEqual(["data", "requestId"]);
    expect(result).not.toHaveProperty("request_id");
    expect(result).not.toHaveProperty("meta");
    expect(result).not.toHaveProperty("cursor");
    expect(result).not.toHaveProperty("offset");
    expect(result).not.toHaveProperty("total");
    expect(result).not.toHaveProperty("next_token");
  });

  it("replies in managed-user scope with an encoded id, JSON body, exact idempotency header, and trimmed operation id", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(
        { data: item },
        200,
        { "X-UniPost-Operation-Id": "  op_completed  " },
      ),
    );

    const result = await client.inbox.managedUser("user A").reply(
      "item /?#",
      { text: "Thanks for reaching out!" },
      { idempotencyKey: "idem-exact-value" },
    );

    expect(result).toEqual({ state: "completed", item, operationId: "op_completed" });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(init.redirect).toBe("manual");
    expect(JSON.parse(init.body as string)).toEqual({ text: "Thanks for reaching out!" });
    const headers = new Headers(init.headers);
    expect(headers.get("Idempotency-Key")).toBe("idem-exact-value");

    const url = requestedUrl();
    expect(url.pathname).toBe("/v1/inbox/item%20%2F%3F%23/reply");
    expect(sortedQueryEntries(url)).toEqual([
      ["external_user_id", "user A"],
      ["inbox_scope", "managed_user"],
    ]);
  });

  it("returns a completed reply without adding absent operation or idempotency headers", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: item }));

    const result = await client.inbox.workspace().reply("inbox_1", { text: "Acknowledged" });

    expect(result).toEqual({ state: "completed", item });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(new Headers(init.headers).has("Idempotency-Key")).toBe(false);
    expect(sortedQueryEntries(requestedUrl())).toEqual([["inbox_scope", "workspace"]]);
  });

  it("returns the response-aware reconciliation state for a valid accepted reply", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(
        {
          error: {
            code: "X_REMOTE_ACCEPTED_RECONCILING",
            message: "Remote accepted the reply; reconciliation is pending.",
          },
          request_id: "req_reconcile_1",
        },
        202,
        { "X-UniPost-Operation-Id": "  op_reconcile_1  " },
      ),
    );

    const result = await client.inbox.workspace().reply("inbox_1", { text: "Reply" });

    expect(result).toEqual({
      state: "reconciling",
      operationId: "op_reconcile_1",
      code: "X_REMOTE_ACCEPTED_RECONCILING",
      message: "Remote accepted the reply; reconciliation is pending.",
      requestId: "req_reconcile_1",
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it.each([
    {
      name: "missing operation header",
      status: 202,
      body: {
        error: {
          code: "X_REMOTE_ACCEPTED_RECONCILING",
          message: "Pending",
        },
      },
    },
    {
      name: "blank operation header",
      status: 202,
      headers: { "X-UniPost-Operation-Id": " \t " },
      body: {
        error: {
          code: "X_REMOTE_ACCEPTED_RECONCILING",
          message: "Pending",
        },
      },
    },
    {
      name: "wrong reconciliation code",
      status: 202,
      headers: { "X-UniPost-Operation-Id": "op_1" },
      body: { error: { code: "UNEXPECTED_CODE", message: "Pending" } },
    },
    {
      name: "missing reconciliation code",
      status: 202,
      headers: { "X-UniPost-Operation-Id": "op_1" },
      body: { error: { message: "Pending" } },
    },
    {
      name: "missing error",
      status: 202,
      headers: { "X-UniPost-Operation-Id": "op_1" },
      body: { request_id: "req_1" },
    },
    {
      name: "missing reconciliation message",
      status: 202,
      headers: { "X-UniPost-Operation-Id": "op_1" },
      body: { error: { code: "X_REMOTE_ACCEPTED_RECONCILING" } },
    },
    {
      name: "unexpected accepted envelope",
      status: 202,
      headers: { "X-UniPost-Operation-Id": "op_1" },
      body: { data: item },
    },
    { name: "200 without data", status: 200, body: { request_id: "req_1" } },
    { name: "unexpected successful status", status: 201, body: { data: item } },
    { name: "empty no-content status", status: 204, body: undefined },
  ])("fails closed for $name without replaying the reply", async ({ status, body, headers }) => {
    mockFetch.mockResolvedValueOnce(jsonResponse(body, status, headers));

    await expect(
      client.inbox.workspace().reply("inbox_1", { text: "Reply" }),
    ).rejects.toThrow(/decode Inbox reply response/i);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("fails closed with a decoding error for malformed successful JSON without replay", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 202,
      headers: new Headers({ "X-UniPost-Operation-Id": "op_1" }),
      text: async () => "{",
    });

    await expect(
      client.inbox.workspace().reply("inbox_1", { text: "Reply" }),
    ).rejects.toThrow(/decode Inbox reply response/i);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it.each([
    [400, "VALIDATION_ERROR"],
    [402, "X_MONTHLY_USAGE_LIMIT_EXCEEDED"],
    [409, "X_RECONNECT_REQUIRED"],
    [409, "NEEDS_RECONNECT"],
    [409, "IDEMPOTENCY_KEY_CONFLICT"],
    [409, "X_WRITE_OUTCOME_PENDING"],
    [409, "X_WRITE_NEEDS_RECONCILIATION"],
    [409, "X_USAGE_REVERSAL_PENDING"],
    [422, "VALIDATION_ERROR"],
    [422, "PLATFORM_ERROR"],
  ])("preserves non-2xx status %i and server code %s with one request", async (status, code) => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(
        {
          error: {
            code,
            normalized_code: code.toLowerCase(),
            message: `Server rejected reply: ${code}`,
          },
        },
        status,
      ),
    );

    let thrown: unknown;
    try {
      await client.inbox.workspace().reply("inbox_1", { text: "Reply" });
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(UniPostError);
    expect(thrown).toMatchObject({ status, code });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("surfaces an Inbox redirect response without following or replaying the POST", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(
        { error: { code: "TEMPORARY_REDIRECT", message: "Use the canonical API host" } },
        307,
        { Location: "https://canonical.example.test/v1/inbox/inbox_1/reply" },
      ),
    );

    await expect(
      client.inbox.workspace().reply("inbox_1", { text: "Reply" }),
    ).rejects.toMatchObject({ status: 307, code: "TEMPORARY_REDIRECT" });

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(init.redirect).toBe("manual");
  });

  it.each([
    { name: "404", status: 404, code: "NOT_FOUND" },
    { name: "scope lookup failure", status: 500, code: "INBOX_SCOPE_LOOKUP_FAILED" },
  ])(
    "does not fall back to workspace scope after a managed-user $name response",
    async ({ status, code }) => {
      mockFetch.mockResolvedValueOnce(
        jsonResponse({ error: { code, message: `Managed scope failed: ${code}` } }, status),
      );

      await expect(client.inbox.managedUser("bound user").list()).rejects.toBeInstanceOf(
        UniPostError,
      );

      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(init.redirect).toBe("manual");
      const url = requestedUrl();
      expect(sortedQueryEntries(url)).toEqual([
        ["external_user_id", "bound user"],
        ["inbox_scope", "managed_user"],
      ]);
      expect(url.searchParams.getAll("inbox_scope")).toEqual(["managed_user"]);
      expect(url.searchParams.getAll("external_user_id")).toEqual(["bound user"]);
      expect(url.search).not.toContain("workspace");
    },
  );

  it("leaves non-Inbox resources on Fetch default redirect handling", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: [] }));

    await client.accounts.list();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init).not.toHaveProperty("redirect");
  });

  it("keeps normalized-code precedence for ordinary non-reply requests", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(
        {
          error: {
            code: "RAW_LIST_ERROR",
            normalized_code: "normalized_list_error",
            message: "List failed",
          },
        },
        400,
      ),
    );

    let thrown: unknown;
    try {
      await client.inbox.workspace().list();
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(UniPostError);
    expect(thrown).toMatchObject({ status: 400, code: "normalized_list_error" });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("does not automatically replay a rate-limited reply", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(
        { error: { code: "RATE_LIMITED", message: "Try later", retry_after: 0 } },
        429,
        { "Retry-After": "0" },
      ),
    );

    await expect(
      client.inbox.workspace().reply("inbox_1", { text: "Reply" }),
    ).rejects.toBeInstanceOf(UniPostError);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it.each([
    {
      name: "gets the managed-user unread count",
      scope: "managed_user" as const,
      responseBody: { data: { count: 6 } },
      status: 200,
      invoke: (scoped: ScopedInbox) => scoped.unreadCount(),
      expectedMethod: "GET",
      expectedPath: "/v1/inbox/unread-count",
      expectedBody: undefined,
      expectedResult: { count: 6 },
    },
    {
      name: "gets a workspace item with an encoded id",
      scope: "workspace" as const,
      responseBody: { data: item },
      status: 200,
      invoke: (scoped: ScopedInbox) => scoped.get("item /?#"),
      expectedMethod: "GET",
      expectedPath: "/v1/inbox/item%20%2F%3F%23",
      expectedBody: undefined,
      expectedResult: item,
    },
    {
      name: "marks a managed-user item read with an encoded id",
      scope: "managed_user" as const,
      responseBody: undefined,
      status: 204,
      invoke: (scoped: ScopedInbox) => scoped.markRead("item /?#"),
      expectedMethod: "POST",
      expectedPath: "/v1/inbox/item%20%2F%3F%23/read",
      expectedBody: undefined,
      expectedResult: undefined,
    },
    {
      name: "marks all workspace items read",
      scope: "workspace" as const,
      responseBody: { data: { marked: 4 } },
      status: 200,
      invoke: (scoped: ScopedInbox) => scoped.markAllRead(),
      expectedMethod: "POST",
      expectedPath: "/v1/inbox/mark-all-read",
      expectedBody: undefined,
      expectedResult: { marked: 4 },
    },
    {
      name: "updates managed-user thread state with an encoded id",
      scope: "managed_user" as const,
      responseBody: { data: { ...item, thread_status: "assigned", assigned_to: "agent_1" } },
      status: 200,
      invoke: (scoped: ScopedInbox) =>
        scoped.updateThreadState("item /?#", {
          threadStatus: "assigned",
          assignedTo: "agent_1",
        }),
      expectedMethod: "POST",
      expectedPath: "/v1/inbox/item%20%2F%3F%23/thread-state",
      expectedBody: { thread_status: "assigned", assigned_to: "agent_1" },
      expectedResult: { ...item, thread_status: "assigned", assigned_to: "agent_1" },
    },
    {
      name: "gets workspace media context with an encoded id",
      scope: "workspace" as const,
      responseBody: { data: mediaContext },
      status: 200,
      invoke: (scoped: ScopedInbox) => scoped.mediaContext("item /?#"),
      expectedMethod: "GET",
      expectedPath: "/v1/inbox/item%20%2F%3F%23/media-context",
      expectedBody: undefined,
      expectedResult: mediaContext,
    },
    {
      name: "syncs the ordinary managed-user Inbox without a body",
      scope: "managed_user" as const,
      responseBody: { data: syncResult },
      status: 200,
      invoke: (scoped: ScopedInbox) => scoped.sync(),
      expectedMethod: "POST",
      expectedPath: "/v1/inbox/sync",
      expectedBody: undefined,
      expectedResult: syncResult,
    },
    {
      name: "maps every X backfill field and explicit false values for workspace sync",
      scope: "workspace" as const,
      responseBody: { data: xBackfillResult },
      status: 200,
      invoke: (scoped: ScopedInbox) =>
        scoped.sync({
          xBackfill: {
            accountId: "sa_x_1",
            lookbackDays: 14,
            maxItems: 250,
            includeReplies: false,
            includeDms: false,
            confirmationToken: "confirm-exact-token",
          },
        }),
      expectedMethod: "POST",
      expectedPath: "/v1/inbox/sync",
      expectedBody: {
        x_backfill: {
          account_id: "sa_x_1",
          lookback_days: 14,
          max_items: 250,
          include_replies: false,
          include_dms: false,
          confirmation_token: "confirm-exact-token",
        },
      },
      expectedResult: xBackfillResult,
    },
    {
      name: "gets managed-user X outbound status with an encoded request id",
      scope: "managed_user" as const,
      responseBody: { data: xOutboundStatus },
      status: 200,
      invoke: (scoped: ScopedInbox) => scoped.xOutboundStatus("request /?#"),
      expectedMethod: "GET",
      expectedPath: "/v1/inbox/x-outbound-operations/request%20%2F%3F%23",
      expectedBody: undefined,
      expectedResult: xOutboundStatus,
    },
  ])(
    "$name with the exact method, scope query, body, and unwrapped response",
    async ({
      scope,
      responseBody,
      status,
      invoke,
      expectedMethod,
      expectedPath,
      expectedBody,
      expectedResult,
    }) => {
      mockFetch.mockResolvedValueOnce(jsonResponse(responseBody, status));
      const scoped = scope === "managed_user"
        ? client.inbox.managedUser("user A")
        : client.inbox.workspace();

      const result = await invoke(scoped);

      expect(result).toEqual(expectedResult);
      expect(mockFetch).toHaveBeenCalledTimes(1);
      const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
      expect(init.method).toBe(expectedMethod);
      expect(init.redirect).toBe("manual");
      if (expectedBody === undefined) {
        expect(init.body).toBeUndefined();
      } else {
        expect(JSON.parse(init.body as string)).toEqual(expectedBody);
      }

      const url = requestedUrl();
      expect(url.pathname).toBe(expectedPath);
      expect(sortedQueryEntries(url)).toEqual(
        scope === "managed_user"
          ? [
              ["external_user_id", "user A"],
              ["inbox_scope", "managed_user"],
            ]
          : [["inbox_scope", "workspace"]],
      );
    },
  );

  it.each(
    ["", ".", ".."].flatMap((id) => [
      {
        method: "get",
        id,
        invoke: (scoped: ScopedInbox) => scoped.get(id),
      },
      {
        method: "markRead",
        id,
        invoke: (scoped: ScopedInbox) => scoped.markRead(id),
      },
      {
        method: "reply",
        id,
        invoke: (scoped: ScopedInbox) => scoped.reply(id, { text: "Reply" }),
      },
      {
        method: "updateThreadState",
        id,
        invoke: (scoped: ScopedInbox) =>
          scoped.updateThreadState(id, { threadStatus: "resolved" }),
      },
      {
        method: "mediaContext",
        id,
        invoke: (scoped: ScopedInbox) => scoped.mediaContext(id),
      },
      {
        method: "xOutboundStatus",
        id,
        invoke: (scoped: ScopedInbox) => scoped.xOutboundStatus(id),
      },
    ]),
  )("rejects path segment $id for $method before fetch", async ({ invoke }) => {
    await expect(invoke(client.inbox.workspace())).rejects.toThrow(
      /Inbox (?:item|request) ID/i,
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("treats explicit undefined sync as an ordinary sync without a body", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: syncResult }));
    const scoped = client.inbox.workspace();

    const result = await scoped.sync(undefined);

    expect(result).toEqual(syncResult);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.body).toBeUndefined();
  });

  it("rejects a hostile empty sync request before fetch", async () => {
    const hostileRequest = {} as unknown as InboxSyncRequest;

    await expect(client.inbox.workspace().sync(hostileRequest)).rejects.toThrow(
      /xBackfill/i,
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("correlates ordinary and X backfill sync overloads at typecheck time", () => {
    const checkSyncOverloads = (
      scoped: ScopedInbox,
      maybeRequest: InboxSyncRequest | undefined,
    ) => {
      const ordinary = scoped.sync();
      const explicitUndefined = scoped.sync(undefined);
      const backfill = scoped.sync({
        xBackfill: {
          includeReplies: true,
          includeDms: false,
        },
      });
      const maybeBackfill = scoped.sync(maybeRequest);
      type OrdinaryResult = Awaited<typeof ordinary>;
      type ExplicitUndefinedResult = Awaited<typeof explicitUndefined>;
      type BackfillResult = Awaited<typeof backfill>;
      type MaybeBackfillResult = Awaited<typeof maybeBackfill>;
      type OrdinaryResultIsExact = Assert<Equal<OrdinaryResult, InboxSyncResult>>;
      type OrdinaryResultIsNotAny = Assert<Equal<IsAny<OrdinaryResult>, false>>;
      type ExplicitUndefinedResultIsExact = Assert<
        Equal<ExplicitUndefinedResult, InboxSyncResult>
      >;
      type ExplicitUndefinedResultIsNotAny = Assert<
        Equal<IsAny<ExplicitUndefinedResult>, false>
      >;
      type BackfillResultIsExact = Assert<Equal<BackfillResult, XInboxBackfillResult>>;
      type BackfillResultIsNotAny = Assert<Equal<IsAny<BackfillResult>, false>>;
      type MaybeBackfillResultIsExact = Assert<
        Equal<MaybeBackfillResult, InboxSyncResult | XInboxBackfillResult>
      >;
      type MaybeBackfillResultIsNotAny = Assert<
        Equal<IsAny<MaybeBackfillResult>, false>
      >;

      // @ts-expect-error a supplied sync request must contain xBackfill.
      scoped.sync({});
    };

    expect(checkSyncOverloads).toBeTypeOf("function");
  });

  it("narrows all production X backfill response shapes at typecheck time", () => {
    const confirmationRequired: XInboxBackfillResult = {
      confirmation_required: true,
      confirmation_token: "confirmation_token_1",
      confirmation_expires_at: "2026-07-22T02:00:00Z",
      accounts_checked: 2,
      estimated_x_credits: 50,
    };
    const completed: XInboxBackfillResult = {
      confirmation_required: false,
      accounts_checked: 2,
      accepted: 8,
      suppressed: 1,
      duplicates: 2,
      read: 11,
      details: [],
    };
    const checkInvalidInProgress = () => {
      // @ts-expect-error in-progress execution cannot also require confirmation.
      const invalidInProgress: XInboxBackfillResult = {
        status: "in_progress",
        confirmation_operation_id: "confirm_operation_invalid",
        execution_lease_expires_at: "2026-07-22T02:00:00Z",
        confirmation_required: true,
      };
      return invalidInProgress;
    };
    const checkNarrowing = (result: XInboxBackfillResult) => {
      if (result.confirmation_required) {
        const token: string = result.confirmation_token;
        const expiresAt: string = result.confirmation_expires_at;
        const accountsChecked: number = result.accounts_checked;
        return [token, expiresAt, accountsChecked];
      }
      if (result.status === "in_progress") {
        const operationId: string = result.confirmation_operation_id;
        const leaseExpiresAt: string = result.execution_lease_expires_at;
        return [operationId, leaseExpiresAt];
      }
      const accountsChecked: number = result.accounts_checked;
      const accepted: number = result.accepted;
      const suppressed: number = result.suppressed;
      const duplicates: number = result.duplicates;
      const read: number = result.read;
      return [accountsChecked, accepted, suppressed, duplicates, read];
    };

    expect(checkInvalidInProgress).toBeTypeOf("function");
    expect(checkNarrowing).toBeTypeOf("function");
    expect([xBackfillResult, confirmationRequired, completed]).toHaveLength(3);
  });

  it("omits assigned_to when updating thread state without an assignee", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ data: { ...item, thread_status: "resolved" } }),
    );

    await client.inbox.workspace().updateThreadState("inbox_1", {
      threadStatus: "resolved",
    });

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string)).toEqual({ thread_status: "resolved" });
    expect(JSON.parse(init.body as string)).not.toHaveProperty("assigned_to");
  });

  it("accepts only the documented thread status union at typecheck time", () => {
    const checkThreadState = (_request: InboxThreadStateRequest) => undefined;

    checkThreadState({ threadStatus: "open" });
    checkThreadState({ threadStatus: "assigned", assignedTo: "agent_1" });
    checkThreadState({ threadStatus: "resolved" });
    // @ts-expect-error pending is not a supported Inbox thread status.
    checkThreadState({ threadStatus: "pending" });
  });

  it("does not automatically replay any rate-limited shared Inbox POST", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(
        { error: { code: "RATE_LIMITED", message: "Try later", retry_after: 0 } },
        429,
        { "Retry-After": "0" },
      ),
    );

    await expect(client.inbox.workspace().markAllRead()).rejects.toBeInstanceOf(
      RateLimitError,
    );
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it.each([
    {
      baseUrl: "https://example.test/base/",
      scope: "managed_user" as const,
      expectedUrl:
        "wss://example.test/v1/inbox/ws?inbox_scope=managed_user&external_user_id=user+A",
    },
    {
      baseUrl: "http://localhost:8787/base/",
      scope: "workspace" as const,
      expectedUrl: "ws://localhost:8787/v1/inbox/ws?inbox_scope=workspace",
    },
  ])(
    "derives $expectedUrl without making a request",
    ({ baseUrl, scope, expectedUrl }) => {
      const websocketClient = new UniPost({ apiKey: "ws_key", baseUrl });
      const scoped = scope === "managed_user"
        ? websocketClient.inbox.managedUser("user A")
        : websocketClient.inbox.workspace();

      const details = scoped.webSocketConnectionDetails();

      expect(details.url).toBe(expectedUrl);
      expect(details.headers).toEqual({ Authorization: "Bearer ws_key" });
      expect(mockFetch).not.toHaveBeenCalled();
    },
  );

  it("keeps WebSocket scope and credentials private, deeply frozen, and fresh", () => {
    const apiKey = "private/key?not-in-url";
    const websocketClient = new UniPost({
      apiKey,
      baseUrl: "https://example.test",
    });
    const scoped = websocketClient.inbox.managedUser("bound user");
    expect(Reflect.set(scoped as object, "scope", { kind: "workspace" })).toBe(true);

    const details = scoped.webSocketConnectionDetails();

    expect(details.url).toBe(
      "wss://example.test/v1/inbox/ws?inbox_scope=managed_user&external_user_id=bound+user",
    );
    expect(details.url).not.toContain(apiKey);
    expect(details.url).not.toContain(encodeURIComponent(apiKey));
    expect(Object.keys(details.headers)).toEqual(["Authorization"]);
    expect(details.headers.Authorization).toBe(`Bearer ${apiKey}`);
    expect(Object.isFrozen(details)).toBe(true);
    expect(Object.isFrozen(details.headers)).toBe(true);
    expect(Reflect.set(details as object, "url", "ws://attacker.test")).toBe(false);
    expect(
      Reflect.set(details.headers as object, "Authorization", "Bearer attacker"),
    ).toBe(false);

    const fresh = scoped.webSocketConnectionDetails();
    expect(fresh).not.toBe(details);
    expect(fresh.headers).not.toBe(details.headers);
    expect(fresh).toEqual(details);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("rejects non-HTTP WebSocket base URL schemes without making a request", () => {
    const websocketClient = new UniPost({
      apiKey: "ws_key",
      baseUrl: "ftp://example.test",
    });

    expect(() => websocketClient.inbox.workspace().webSocketConnectionDetails()).toThrow(
      /WebSocket.*protocol/i,
    );
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
