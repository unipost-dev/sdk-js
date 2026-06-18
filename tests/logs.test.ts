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

function streamResponse(body: string, status = 200) {
  const encoder = new TextEncoder();
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ "Content-Type": "text/event-stream" }),
    body: new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(body));
        controller.close();
      },
    }),
    text: async () => body,
    json: async () => JSON.parse(body),
  };
}

describe("Logs", () => {
  let client: UniPost;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new UniPost({ apiKey: "up_test_xxx" });
  });

  it("lists logs with cursor filters and exposes nextCursor", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        data: [{ id: 110, action: "post.publish.failed", status: "error" }],
        meta: { limit: 25, has_more: true, next_cursor: "cur_abc" },
      }),
    );

    const result = await client.logs.list({
      status: "error",
      level: "warn",
      profileId: "prof_1",
      errorCode: "provider_failed",
      limit: 25,
      cursor: "cur_prev",
    });

    expect(result.data[0].id).toBe(110);
    expect(result.nextCursor).toBe("cur_abc");
    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("/v1/logs");
    expect(url).toContain("status=error");
    expect(url).toContain("level=warn");
    expect(url).toContain("profile_id=prof_1");
    expect(url).toContain("error_code=provider_failed");
    expect(url).toContain("limit=25");
    expect(url).toContain("cursor=cur_prev");
  });

  it("gets a single log by numeric id", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({ data: { id: 110, action: "post.publish.failed", request_payload: null } }),
    );

    const log = await client.logs.get(110);

    expect(log.id).toBe(110);
    expect(log.action).toBe("post.publish.failed");
    expect(mockFetch.mock.calls[0][0]).toContain("/v1/logs/110");
  });

  it("streams SSE log.created events with replay params", async () => {
    mockFetch.mockResolvedValueOnce(
      streamResponse('event: log.created\nid: 110\ndata: {"id":110,"action":"post.publish.failed","status":"error"}\n\n'),
    );

    const iterator = client.logs.stream({ status: "error", afterId: 109 });
    const first = await iterator.next();

    expect(first.done).toBe(false);
    expect(first.value.id).toBe(110);
    expect(first.value.action).toBe("post.publish.failed");
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/v1/logs/stream");
    expect(url).toContain("status=error");
    expect(url).toContain("after_id=109");
    expect(init.headers).toMatchObject({ Accept: "text/event-stream" });
  });
});
