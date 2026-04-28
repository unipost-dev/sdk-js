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
