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

describe("ApiKeys", () => {
  let client: UniPost;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new UniPost({ apiKey: "up_test_xxx" });
  });

  it("lists api keys", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        data: [{ id: "key_1", name: "Prod", prefix: "up_live_abcd", environment: "production" }],
      }),
    );

    const result = await client.apiKeys.list();
    expect(result.data).toHaveLength(1);
    expect(result.data[0].environment).toBe("production");
    expect(mockFetch.mock.calls[0][0]).toContain("/v1/api-keys");
  });

  it("creates an api key", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        data: {
          id: "key_2",
          name: "Backend",
          prefix: "up_test_efgh",
          environment: "test",
          key: "up_test_secret",
        },
      }),
    );

    const key = await client.apiKeys.create({ name: "Backend", environment: "test" });
    expect(key.key).toBe("up_test_secret");
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.name).toBe("Backend");
    expect(body.environment).toBe("test");
  });

  it("revokes an api key", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      headers: new Headers(),
      text: async () => "",
      json: async () => undefined,
    });

    await client.apiKeys.revoke("key_3");
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain("/v1/api-keys/key_3");
    expect(init.method).toBe("DELETE");
  });
});
