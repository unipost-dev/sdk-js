import { describe, it, expect, vi, beforeEach } from "vitest";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { GifConversionError, UniPost } from "../src/index.js";

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

describe("Media", () => {
  let client: UniPost;

  beforeEach(() => {
    mockFetch.mockReset();
    client = new UniPost({ apiKey: "up_test_xxx" });
  });

  it("omits size_bytes when reserving media without an explicit size", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        data: {
          id: "media_audio_1",
          status: "reserved",
          upload_url: "https://upload.example/audio",
        },
      }),
    );

    const result = await client.media.upload({
      filename: "voiceover.mp3",
      contentType: "audio/mpeg",
    });

    expect(result.mediaId).toBe("media_audio_1");
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body).toEqual({
      filename: "voiceover.mp3",
      content_type: "audio/mpeg",
    });
  });

  it("creates audio overlay jobs with idempotency", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse(
        {
          data: {
            id: "mpj_1",
            status: "queued",
            video_media_id: "media_video_1",
            audio_media_id: "media_audio_1",
            output_media_id: null,
            mode: "mix",
            fit: "trim_to_video",
            created_at: "2026-07-03T12:00:00Z",
          },
        },
        202,
      ),
    );

    const job = await client.media.audioOverlays.create(
      {
        videoMediaId: "media_video_1",
        audioMediaId: "media_audio_1",
        mode: "mix",
        videoVolume: 70,
        audioVolume: 100,
        fit: "trim_to_video",
      },
      { idempotencyKey: "overlay-1" },
    );

    expect(job.id).toBe("mpj_1");
    expect(job.videoMediaId).toBe("media_video_1");
    const [url, init] = mockFetch.mock.calls[0];
    expect(url).toContain("/v1/media/audio-overlays");
    expect(init.headers["Idempotency-Key"]).toBe("overlay-1");
    expect(JSON.parse(init.body)).toEqual({
      video_media_id: "media_video_1",
      audio_media_id: "media_audio_1",
      mode: "mix",
      video_volume: 70,
      audio_volume: 100,
      fit: "trim_to_video",
    });
  });

  it("gets audio overlay jobs and exposes camelCase aliases", async () => {
    mockFetch.mockResolvedValueOnce(
      jsonResponse({
        data: {
          id: "mpj_1",
          status: "succeeded",
          video_media_id: "media_video_1",
          audio_media_id: "media_audio_1",
          output_media_id: "media_output_1",
          mode: "replace",
          fit: "loop_to_video",
          created_at: "2026-07-03T12:00:00Z",
          completed_at: "2026-07-03T12:00:20Z",
        },
      }),
    );

    const job = await client.media.audioOverlays.get("mpj_1");

    expect(job.status).toBe("succeeded");
    expect(job.outputMediaId).toBe("media_output_1");
    expect(job.completedAt).toBe("2026-07-03T12:00:20Z");
    expect(mockFetch.mock.calls[0][0]).toContain("/v1/media/audio-overlays/mpj_1");
  });

  it("creates and gets typed GIF conversion jobs", async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ data: {
        id: "mpj_gif_1", kind: "gif_to_mp4", status: "queued",
        gif_media_id: "media_gif_1", background_color: "#00FFAA",
        output_profile: "universal_mp4_v1", output_media_id: null,
        created_at: "2026-07-17T12:00:00Z", error: null,
      } }, 202))
      .mockResolvedValueOnce(jsonResponse({ data: {
        id: "mpj_gif_1", kind: "gif_to_mp4", status: "succeeded",
        gif_media_id: "media_gif_1", background_color: "#00FFAA",
        output_profile: "universal_mp4_v1", output_media_id: "media_mp4_1",
        created_at: "2026-07-17T12:00:00Z", error: null,
      } }));

    const created = await client.media.createGifConversion(
      { gifMediaId: "media_gif_1", backgroundColor: "#00ffaa" },
      { idempotencyKey: "gif-1" },
    );
    const fetched = await client.media.getGifConversion(created.id);

    expect(created.gifMediaId).toBe("media_gif_1");
    expect(fetched.outputMediaId).toBe("media_mp4_1");
    expect(mockFetch.mock.calls[0][1].headers["Idempotency-Key"]).toBe("gif-1");
    expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toEqual({
      gif_media_id: "media_gif_1",
      background_color: "#00ffaa",
    });
  });

  it("waits for GIF conversion success and raises typed terminal failures", async () => {
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ data: {
        id: "mpj_gif_1", kind: "gif_to_mp4", status: "processing",
        gif_media_id: "media_gif_1", background_color: "#FFFFFF",
        output_profile: "universal_mp4_v1", output_media_id: null,
        created_at: "2026-07-17T12:00:00Z", error: null,
      } }))
      .mockResolvedValueOnce(jsonResponse({ data: {
        id: "mpj_gif_1", kind: "gif_to_mp4", status: "succeeded",
        gif_media_id: "media_gif_1", background_color: "#FFFFFF",
        output_profile: "universal_mp4_v1", output_media_id: "media_mp4_1",
        created_at: "2026-07-17T12:00:00Z", error: null,
      } }));
    await expect(client.media.waitForGifConversion("mpj_gif_1", { pollIntervalMs: 1, timeoutMs: 100 }))
      .resolves.toMatchObject({ status: "succeeded", outputMediaId: "media_mp4_1" });

    mockFetch.mockResolvedValueOnce(jsonResponse({ data: {
      id: "mpj_gif_2", kind: "gif_to_mp4", status: "failed",
      gif_media_id: "media_gif_2", background_color: "#FFFFFF",
      output_profile: "universal_mp4_v1", output_media_id: null,
      created_at: "2026-07-17T12:00:00Z",
      error: { code: "gif_decode_failed", message: "GIF could not be decoded", retryable: false },
    } }));
    await expect(client.media.waitForGifConversion("mpj_gif_2", { pollIntervalMs: 1 }))
      .rejects.toEqual(expect.objectContaining({
        name: "GifConversionError", code: "gif_decode_failed", retryable: false,
      } satisfies Partial<GifConversionError>));
  });

  it("supports timeout and AbortSignal without cancelling the server job", async () => {
    const processing = { data: {
      id: "mpj_gif_1", kind: "gif_to_mp4", status: "processing",
      gif_media_id: "media_gif_1", background_color: "#FFFFFF",
      output_profile: "universal_mp4_v1", output_media_id: null,
      created_at: "2026-07-17T12:00:00Z", error: null,
    } };
    mockFetch.mockResolvedValue(jsonResponse(processing));
    await expect(client.media.waitForGifConversion("mpj_gif_1", { pollIntervalMs: 1, timeoutMs: 2 }))
      .rejects.toThrow("Timed out waiting for GIF conversion");

    const controller = new AbortController();
    controller.abort();
    await expect(client.media.waitForGifConversion("mpj_gif_1", { signal: controller.signal }))
      .rejects.toMatchObject({ name: "AbortError" });
    expect(mockFetch.mock.calls.every(([, init]) => init.method === "GET")).toBe(true);
  });

  it("uploads, converts, and waits without publishing", async () => {
    const dir = mkdtempSync(join(tmpdir(), "unipost-gif-"));
    const filePath = join(dir, "animation.gif");
    writeFileSync(filePath, Buffer.from("GIF89a"));
    mockFetch
      .mockResolvedValueOnce(jsonResponse({ data: {
        id: "media_gif_1", status: "reserved", upload_url: "https://upload.example/gif",
      } }))
      .mockResolvedValueOnce(jsonResponse(undefined, 200))
      .mockResolvedValueOnce(jsonResponse({ data: {
        id: "mpj_gif_1", kind: "gif_to_mp4", status: "queued",
        gif_media_id: "media_gif_1", background_color: "#FFFFFF",
        output_profile: "universal_mp4_v1", output_media_id: null,
        created_at: "2026-07-17T12:00:00Z", error: null,
      } }, 202))
      .mockResolvedValueOnce(jsonResponse({ data: {
        id: "mpj_gif_1", kind: "gif_to_mp4", status: "succeeded",
        gif_media_id: "media_gif_1", background_color: "#FFFFFF",
        output_profile: "universal_mp4_v1", output_media_id: "media_mp4_1",
        created_at: "2026-07-17T12:00:00Z", error: null,
      } }));
    try {
      const result = await client.media.uploadAndConvertGif(filePath, {
        idempotencyKey: "upload-gif-1", pollIntervalMs: 1,
      });
      expect(result.outputMediaId).toBe("media_mp4_1");
      expect(mockFetch.mock.calls.some(([url]) => String(url).includes("/v1/posts"))).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
