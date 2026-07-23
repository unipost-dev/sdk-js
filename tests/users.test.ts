import { beforeEach, describe, expect, it, vi } from "vitest";
import { UniPost } from "../src/index.js";
import type { ManagedUserDetail, ManagedUserSummary } from "../src/index.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function jsonResponse(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    text: async () => (body === undefined ? "" : JSON.stringify(body)),
    json: async () => body,
  };
}

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
          platform: "twitter",
          account_name: "Example",
          external_user_id: "user_1",
          external_user_email: "person@example.com",
          status: "active",
          connection_type: "managed",
        },
      ],
    };

    expect(summary.disconnected_count).toBe(0);
    expect(detail.accounts[0]?.id).toBe("acct_1");
  });

  it("lists managed users inside the selected profile", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ data: [], meta: { total: 0, limit: 100 } }),
    );

    await client.users.list({ profileId: "prof/a b", limit: 100 });

    expect(mockFetch.mock.calls[0][0]).toContain(
      "/v1/profiles/prof%2Fa%20b/users?limit=100",
    );
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
});
