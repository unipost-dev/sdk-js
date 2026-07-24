import { beforeEach, describe, expect, it, vi } from "vitest";
import { UniPost, ValidationError } from "../src/index.js";
import type { ManagedUserDetail, ManagedUserSummary } from "../src/index.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(body: unknown, status = 200, headers = new Headers()) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers,
    text: async () => (body === undefined ? "" : JSON.stringify(body)),
    json: async () => body,
  };
}

function requireScopedFields(
  summary: ManagedUserSummary,
  detail: ManagedUserDetail,
): void {
  const accountCount: number = summary.account_count;
  const platformCounts: Record<string, number> = summary.platform_counts;
  const reconnectCount: number = summary.reconnect_count;
  const disconnectedCount: number = summary.disconnected_count;
  const firstConnectedAt: string = summary.first_connected_at;
  const profileId: string = detail.accounts[0]!.profile_id;

  void [
    accountCount,
    platformCounts,
    reconnectCount,
    disconnectedCount,
    firstConnectedAt,
    profileId,
  ];
}

void requireScopedFields;

describe("Managed Users", () => {
  let client: UniPost;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new UniPost({ apiKey: "up_test_xxx" });
  });

  it("types every field returned by list and detail routes", () => {
    const summary: ManagedUserSummary = {
      external_user_id: "user_1",
      external_user_email: "person@example.com",
      account_count: 2,
      platform_counts: { twitter: 2 },
      reconnect_count: 1,
      disconnected_count: 0,
      first_connected_at: "2026-07-01T00:00:00Z",
      last_refreshed_at: "2026-07-23T00:00:00Z",
    };
    const detail: ManagedUserDetail = {
      external_user_id: "user_1",
      external_user_email: "person@example.com",
      account_count: 1,
      accounts: [
        {
          id: "acct_1",
          profile_id: "prof_1",
          profile_name: "Brand US",
          platform: "twitter",
          account_name: "Example",
          external_account_id: "provider_1",
          connected_at: "2026-07-01T00:00:00Z",
          external_user_id: "user_1",
          external_user_email: "person@example.com",
          status: "active",
          connection_type: "managed",
          scope: ["tweet.read", "tweet.write"],
        },
      ],
    };

    expect(summary.disconnected_count).toBe(0);
    expect(detail.accounts[0]?.id).toBe("acct_1");
    expect(detail.accounts[0]?.external_account_id).toBe("provider_1");
  });

  it("keeps the 0.6.0 bare-route list call", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: [] }));

    await client.users.list();

    expect(mockFetch.mock.calls[0][0]).toContain("/v1/users");
    expect(mockFetch.mock.calls[0][0]).not.toContain("/v1/profiles/");
  });

  it("keeps the 0.6.0 bare-route detail call", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ data: { external_user_id: "legacy/user" } }),
    );

    const result = await client.users.get("legacy/user");

    expect(mockFetch.mock.calls[0][0]).toContain("/v1/users/legacy%2Fuser");
    expect(result.external_user_id).toBe("legacy/user");
  });

  it("lists managed users inside the selected profile", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ data: [], meta: { total: 0, limit: 100 } }),
    );

    await client.users.list({ profileId: "prof/a b", limit: 100 });

    expect(mockFetch.mock.calls[0][0]).toContain(
      "/v1/profiles/prof%2Fa%20b/users?limit=100",
    );
    expect(mockFetch.mock.calls[0][1].headers["User-Agent"]).toBe(
      "@unipost/sdk/0.6.1",
    );
  });

  it("encodes every scoped path segment without double encoding", async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ data: [] }))
      .mockResolvedValueOnce(
        jsonResponse({
          data: {
            external_user_id: "客户/user ?#",
            account_count: 0,
            accounts: [],
          },
        }),
      );

    await client.users.list({ profileId: "团队/北美 ?#" });
    await client.users.get({
      profileId: "团队/北美 ?#",
      externalUserId: "客户/user ?#",
    });

    expect(mockFetch.mock.calls[0][0]).toContain(
      "/v1/profiles/%E5%9B%A2%E9%98%9F%2F%E5%8C%97%E7%BE%8E%20%3F%23/users",
    );
    expect(mockFetch.mock.calls[1][0]).toContain(
      "/v1/profiles/%E5%9B%A2%E9%98%9F%2F%E5%8C%97%E7%BE%8E%20%3F%23/users/%E5%AE%A2%E6%88%B7%2Fuser%20%3F%23",
    );
  });

  it.each([0, 101, 1.5])(
    "rejects invalid scoped list limit %s before fetching",
    async (limit) => {
      mockFetch.mockResolvedValueOnce(jsonResponse({ data: [] }));

      await expect(
        client.users.list({ profileId: "prof_1", limit }),
      ).rejects.toBeInstanceOf(ValidationError);
      expect(mockFetch).not.toHaveBeenCalled();
    },
  );

  it.each([
    { profileId: "", externalUserId: "user_1" },
    { profileId: "   ", externalUserId: "user_1" },
    { profileId: "prof_1", externalUserId: "" },
  ])("rejects blank scoped IDs before fetching: %o", async (params) => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ data: { external_user_id: "user_1", account_count: 0, accounts: [] } }),
    );

    await expect(client.users.get(params)).rejects.toBeInstanceOf(ValidationError);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("gets one managed user inside the selected profile", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        data: {
          external_user_id: "user/a b",
          account_count: 1,
          accounts: [],
        },
      }),
    );

    const result = await client.users.get({
      profileId: "prof_1",
      externalUserId: "user/a b",
    });

    expect(mockFetch.mock.calls[0][0]).toContain(
      "/v1/profiles/prof_1/users/user%2Fa%20b",
    );
    expect(result.external_user_id).toBe("user/a b");
  });

  it.each([
    {
      label: "a summary missing account_count",
      body: {
        data: [
          {
            external_user_id: "user_1",
            platform_counts: {},
            reconnect_count: 0,
            disconnected_count: 0,
            first_connected_at: "2026-07-01T00:00:00Z",
          },
        ],
      },
    },
    {
      label: "a summary with a non-numeric platform count",
      body: {
        data: [
          {
            external_user_id: "user_1",
            account_count: 1,
            platform_counts: { twitter: "one" },
            reconnect_count: 0,
            disconnected_count: 0,
            first_connected_at: "2026-07-01T00:00:00Z",
          },
        ],
      },
    },
  ])("rejects $label", async ({ body }) => {
    mockFetch.mockResolvedValueOnce(jsonResponse(body));

    await expect(
      client.users.list({ profileId: "prof_1" }),
    ).rejects.toMatchObject({
      name: "InvalidResponseError",
      code: "invalid_response",
    });
  });

  it.each([
    {
      label: "a detail missing accounts",
      data: { external_user_id: "user_1", account_count: 0 },
    },
    {
      label: "an account missing profile_id",
      data: {
        external_user_id: "user_1",
        account_count: 1,
        accounts: [
          {
            id: "acct_1",
            platform: "twitter",
            status: "active",
          },
        ],
      },
    },
  ])("rejects $label", async ({ data }) => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ data }));

    await expect(
      client.users.get({ profileId: "prof_1", externalUserId: "user_1" }),
    ).rejects.toMatchObject({
      name: "InvalidResponseError",
      code: "invalid_response",
    });
  });

  it("distinguishes an inaccessible profile without falling back", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(
        { error: { code: "profile_inaccessible", message: "Profile is unavailable" } },
        404,
      ),
    );

    await expect(
      client.users.list({ profileId: "prof_denied" }),
    ).rejects.toMatchObject({
      name: "ProfileAccessError",
      code: "profile_inaccessible",
      status: 404,
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch.mock.calls[0][0]).toContain(
      "/v1/profiles/prof_denied/users",
    );
  });

  it("distinguishes a missing managed user", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(
        { error: { code: "managed_user_not_found", message: "Managed User not found" } },
        404,
      ),
    );

    await expect(
      client.users.get({ profileId: "prof_1", externalUserId: "missing" }),
    ).rejects.toMatchObject({
      name: "ManagedUserNotFoundError",
      code: "managed_user_not_found",
      status: 404,
    });
  });

  it("classifies normalized managed-user codes while preserving the server code", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(
        {
          error: {
            code: "MANAGED_USER_NOT_FOUND",
            normalized_code: "managed_user_not_found",
            message: "Managed User not found",
          },
        },
        404,
      ),
    );

    await expect(
      client.users.get({ profileId: "prof_1", externalUserId: "missing" }),
    ).rejects.toMatchObject({
      name: "ManagedUserNotFoundError",
      code: "MANAGED_USER_NOT_FOUND",
      status: 404,
    });
  });

  it("keeps authentication failures distinct", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ error: { code: "invalid_api_key", message: "Invalid API key" } }, 401),
    );

    await expect(
      client.users.list({ profileId: "prof_1" }),
    ).rejects.toMatchObject({ name: "AuthError", status: 401 });
  });

  it("keeps rate limits distinct after bounded retries", async () => {
    mockFetch.mockResolvedValue(
      jsonResponse({}, 429, new Headers({ "Retry-After": "0" })),
    );

    await expect(
      client.users.list({ profileId: "prof_1" }),
    ).rejects.toMatchObject({ name: "RateLimitError", status: 429 });
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("distinguishes UniPost service unavailability", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ error: { code: "service_unavailable" } }, 503),
    );

    await expect(
      client.users.list({ profileId: "prof_1" }),
    ).rejects.toMatchObject({
      name: "ServiceUnavailableError",
      code: "service_unavailable",
      status: 503,
    });
  });

  it("distinguishes request timeouts", async () => {
    mockFetch.mockRejectedValueOnce(new DOMException("Timed out", "TimeoutError"));

    await expect(
      client.users.list({ profileId: "prof_1" }),
    ).rejects.toMatchObject({ name: "TimeoutError", code: "timeout", status: 0 });
  });

  it("distinguishes network-level UniPost unavailability", async () => {
    mockFetch.mockRejectedValueOnce(new TypeError("fetch failed"));

    await expect(
      client.users.list({ profileId: "prof_1" }),
    ).rejects.toMatchObject({
      name: "ServiceUnavailableError",
      code: "service_unavailable",
      status: 0,
    });
  });

  it("does not change transport errors for existing non-Users resources", async () => {
    const networkError = new TypeError("fetch failed");
    mockFetch.mockRejectedValueOnce(networkError);

    await expect(client.accounts.list()).rejects.toBe(networkError);
  });

  it("does not change service errors for existing non-Users resources", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ error: { code: "service_unavailable" } }, 503),
    );

    await expect(client.accounts.list()).rejects.toMatchObject({
      name: "UniPostError",
      code: "service_unavailable",
      status: 503,
    });
  });

  it("does not apply managed-user classifications to Inbox errors", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ error: { code: "user_not_found" } }, 404),
    );

    await expect(
      client.inbox.workspace().reply("item_1", { text: "hello" }),
    ).rejects.toMatchObject({
      name: "NotFoundError",
      code: "not_found",
      status: 404,
    });
  });

  it("reports malformed scoped JSON as an invalid response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers(),
      text: async () => "{",
    });

    await expect(
      client.users.list({ profileId: "prof_1" }),
    ).rejects.toMatchObject({
      name: "InvalidResponseError",
      code: "invalid_response",
    });
  });
});
