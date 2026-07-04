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
});
