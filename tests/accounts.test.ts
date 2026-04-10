import { describe, it, expect, vi, beforeEach } from "vitest";
import { UniPost } from "../src/index.js";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("Accounts", () => {
  let client: UniPost;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new UniPost({ apiKey: "up_test_xxx" });
  });

  it("lists accounts", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          { id: "sa_1", platform: "twitter", account_name: "unipost", status: "active" },
        ],
      }),
    });

    const result = await client.accounts.list();
    expect(result.data).toHaveLength(1);
    expect(result.data[0].platform).toBe("twitter");
  });

  it("filters by platform", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: [] }),
    });

    await client.accounts.list({ platform: "linkedin" });
    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain("platform=linkedin");
  });

  it("gets a single account", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: { id: "sa_1", platform: "twitter", status: "active" },
      }),
    });

    const account = await client.accounts.get("sa_1");
    expect(account.id).toBe("sa_1");
  });

  it("checks account health", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: { account_id: "sa_1", status: "ok", last_checked_at: "2026-04-09T00:00:00Z" },
      }),
    });

    const health = await client.accounts.health("sa_1");
    expect(health.status).toBe("ok");
  });
});
