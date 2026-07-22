import { beforeEach, describe, expect, it, vi } from "vitest";
import { UniPost, UniPostError } from "../src/index.js";
import type {
  InboxItem,
  InboxListParams,
  InboxListResponse,
  InboxReplyOptions,
  InboxReplyRequest,
  InboxReplyResult,
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
});
