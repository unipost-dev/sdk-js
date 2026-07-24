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

const completeFailureResult = {
  id: "result_failed",
  social_account_id: "sa_failed",
  platform: "twitter",
  status: "failed",
  error_message: "Twitter rejected the post",
  error_code: "platform_publish_failed",
  failure_stage: "publish",
  platform_error_code: "187",
  is_retriable: false,
  next_action: "edit_content",
  error_source: "platform",
  error_temporality: "permanent",
  provider_error: {
    provider: "twitter",
    http_status: 403,
    code: "187",
  },
  retry_policy: {
    is_retriable: false,
    will_retry: false,
    retry_state: "not_retriable",
    manual_retry_allowed: false,
    reason: "duplicate_content",
  },
};

describe("Posts", () => {
  let client: UniPost;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new UniPost({ apiKey: "up_test_xxx" });
  });

  it("creates a post at /v1/posts", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ data: { id: "post_1", caption: "Hello!", status: "published" } }),
    );

    const post = await client.posts.create({
      caption: "Hello!",
      accountIds: ["sa_1", "sa_2"],
    });

    expect(post.id).toBe("post_1");
    expect(post.caption).toBe("Hello!");

    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain("/v1/posts");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body);
    expect(body.caption).toBe("Hello!");
    expect(body.account_ids).toEqual(["sa_1", "sa_2"]);
  });

  it("preserves a successful platform result returned by create", async () => {
    const successfulResult = {
      id: "result_success",
      social_account_id: "sa_1",
      platform: "twitter",
      status: "published",
      external_id: "tweet_1",
      url: "https://x.com/example/status/tweet_1",
    };
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        data: {
          id: "post_success",
          caption: "Published",
          status: "published",
          results: [successfulResult],
        },
      }),
    );

    const post = await client.posts.create({ caption: "Published", accountIds: ["sa_1"] });

    expect(post.results?.[0]).toEqual(successfulResult);
  });

  it("preserves the complete failure contract on a partial post returned by get", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        data: {
          id: "post_partial",
          caption: "Mixed outcome",
          status: "partial",
          results: [
            {
              id: "result_success",
              social_account_id: "sa_success",
              status: "published",
            },
            completeFailureResult,
          ],
        },
      }),
    );

    const post = await client.posts.get("post_partial");

    expect(post.status).toBe("partial");
    expect(post.results?.[1]).toEqual(completeFailureResult);
  });

  it("preserves the complete failure contract on failed posts returned by list", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        data: [
          {
            id: "post_failed",
            caption: "Failed",
            status: "failed",
            results: [completeFailureResult],
          },
        ],
        meta: { next_cursor: "" },
      }),
    );

    const page = await client.posts.list({ status: "failed" });

    expect(page.data[0]?.status).toBe("failed");
    expect(page.data[0]?.results?.[0]).toEqual(completeFailureResult);
  });

  it("preserves the complete failure contract on posts returned by update", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        data: {
          id: "post_update",
          caption: "Edited",
          status: "partial",
          results: [completeFailureResult],
        },
      }),
    );

    const post = await client.posts.update("post_update", { caption: "Edited" });

    expect(post.results?.[0]).toEqual(completeFailureResult);
    expect(mockFetch.mock.calls[0][1].method).toBe("PATCH");
  });

  it("creates a post with platformPosts", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ data: { id: "post_2", caption: null, status: "published" } }),
    );

    await client.posts.create({
      platformPosts: [
        { accountId: "sa_tw", caption: "Short tweet" },
        { accountId: "sa_li", caption: "Long LinkedIn post" },
      ],
    });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.platform_posts).toHaveLength(2);
    expect(body.platform_posts[0].account_id).toBe("sa_tw");
    expect(body.platform_posts[1].caption).toBe("Long LinkedIn post");
  });

  it("sends idempotency key header", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ data: { id: "post_3", status: "published" } }),
    );

    await client.posts.create({
      caption: "Idempotent",
      accountIds: ["sa_1"],
      idempotencyKey: "key-001",
    });

    const headers = mockFetch.mock.calls[0][1].headers;
    expect(headers["Idempotency-Key"]).toBe("key-001");
  });

  it("lists posts with filters and reads next_cursor from meta", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        data: [{ id: "post_5" }],
        meta: { next_cursor: "cur_abc" },
      }),
    );

    const result = await client.posts.list({
      status: "published",
      platform: "twitter",
      limit: 10,
    });

    expect(result.data).toHaveLength(1);
    expect(result.nextCursor).toBe("cur_abc");
    const url = mockFetch.mock.calls[0][0];
    expect(url).toContain("status=published");
    expect(url).toContain("platform=twitter");
    expect(url).toContain("limit=10");
  });

  it("cancels a post", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ data: { id: "post_6", status: "cancelled" } }),
    );

    const post = await client.posts.cancel("post_6");
    expect(post.status).toBe("cancelled");
  });

  it("bulk creates posts", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        data: [
          { status: 200, data: { id: "post_7", status: "published" } },
          { status: 200, data: { id: "post_8", status: "published" } },
        ],
      }),
    );

    const results = await client.posts.bulkCreate([
      { caption: "Post 1", accountIds: ["sa_1"] },
      { caption: "Post 2", accountIds: ["sa_2"] },
    ]);

    expect(results).toHaveLength(2);
    expect(results[0].data?.id).toBe("post_7");
  });
});
