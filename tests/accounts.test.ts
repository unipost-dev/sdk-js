import { describe, it, expect, vi, beforeEach } from "vitest";
import { UniPost } from "../src/index.js";

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

describe("Accounts", () => {
  let client: UniPost;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new UniPost({ apiKey: "up_test_xxx" });
  });

  it("lists accounts at /v1/accounts", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        data: [
          { id: "sa_1", platform: "twitter", account_name: "unipost", status: "active" },
        ],
      }),
    );

    const result = await client.accounts.list();
    expect(result.data).toHaveLength(1);
    expect(result.data[0].platform).toBe("twitter");

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/v1/accounts");
  });

  it("filters by platform", async () => {
    mockFetch.mockResolvedValueOnce(jsonResponse({ data: [] }));

    await client.accounts.list({ platform: "linkedin" });
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("platform=linkedin");
  });

  it("checks account health", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        data: { social_account_id: "sa_1", platform: "twitter", status: "ok" },
      }),
    );

    const health = await client.accounts.health("sa_1");
    expect(health.status).toBe("ok");
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/v1/accounts/sa_1/health");
  });
});
