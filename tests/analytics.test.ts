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

function textResponse(body: string, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ "Content-Type": "text/csv" }),
    text: async () => body,
    json: async () => JSON.parse(body),
  };
}

describe("Analytics", () => {
  let client: UniPost;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new UniPost({ apiKey: "up_test_xxx" });
  });

  it("lists analytics posts with explorer filters", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        data: [{ post_id: "post_1", platform: "pinterest", impressions: 12 }],
        meta: { limit: 25, next_cursor: "25", has_more: true },
      }),
    );

    const result = await client.analytics.posts({
      platform: "pinterest",
      accountId: "sa_1",
      postId: "post_1",
      sort: "engagement_rate",
      limit: 25,
      cursor: "0",
    });

    expect(result.data[0].post_id).toBe("post_1");
    expect(result.meta?.next_cursor).toBe("25");
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/v1/analytics/posts");
    expect(url).toContain("platform=pinterest");
    expect(url).toContain("account_id=sa_1");
    expect(url).toContain("post_id=post_1");
    expect(url).toContain("sort=engagement_rate");
    expect(url).toContain("limit=25");
    expect(url).toContain("cursor=0");
  });

  it("exports analytics posts as CSV text", async () => {
    mockFetch.mockResolvedValueOnce(textResponse("post_id,platform\npost_1,tiktok\n"));

    const csv = await client.analytics.exportPostsCsv({ platform: "tiktok" });

    expect(csv).toContain("post_id,platform");
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/v1/analytics/posts/export");
    expect(url).toContain("platform=tiktok");
  });

  it("reads analytics platform availability and details", async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ data: [{ platform: "tiktok", health: "ready" }] }))
      .mockResolvedValueOnce(jsonResponse({ data: { platform: "tiktok", summary: { posts: 3 } } }));

    const platforms = await client.analytics.platforms({ from: "2026-05-01", to: "2026-05-31" });
    const platform = await client.analytics.platform("tiktok", { profileId: "prof_1" });

    expect(platforms[0].platform).toBe("tiktok");
    expect(platform.summary.posts).toBe(3);
    const listUrl = mockFetch.mock.calls[0][0] as string;
    const detailUrl = mockFetch.mock.calls[1][0] as string;
    expect(listUrl).toContain("/v1/analytics/platforms");
    expect(listUrl).toContain("from=2026-05-01");
    expect(detailUrl).toContain("/v1/analytics/platforms/tiktok");
    expect(detailUrl).toContain("profile_id=prof_1");
  });

  it("requests analytics refresh", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ data: { status: "queued", matched_count: 7, requested_count: 5, limit: 5 } }, 202),
    );

    const result = await client.analytics.refresh({ platform: "threads", limit: 5 });

    expect(result.status).toBe("queued");
    expect(result.requested_count).toBe(5);
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/v1/analytics/refresh");
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ platform: "threads", limit: 5 }));
  });
});
