import { beforeEach, describe, expect, it, vi } from "vitest";
import { UniPost } from "../src/index.js";
import type { InboxItem, InboxListParams, InboxListResponse } from "../src/index.js";

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
type ScopedInboxListResult = Awaited<
  ReturnType<ReturnType<UniPost["inbox"]["workspace"]>["list"]>
>;
type ScopedInboxListResultIsExact = Assert<Equal<ScopedInboxListResult, InboxListResponse>>;
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

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
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
});
