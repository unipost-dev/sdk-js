import type { HttpClient } from "../http.js";
import type {
  AudioOverlayCreateParams,
  AudioOverlayJob,
  AudioOverlayRequestOptions,
  MediaUploadRequest,
  MediaUploadResponse,
  GifConversionCreateParams,
  GifConversionJob,
  GifConversionRequestOptions,
  GifConversionWaitOptions,
  UploadAndConvertGifOptions,
} from "../types/index.js";
import { GifConversionError } from "../errors.js";

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  aac: "audio/aac",
  m4a: "audio/mp4",
};

function normalize(data: MediaUploadResponse | undefined | null): MediaUploadResponse | undefined {
  if (!data) return data ?? undefined;
  return {
    ...data,
    mediaId: data.media_id ?? data.id ?? data.mediaId,
    uploadUrl: data.upload_url ?? data.uploadUrl,
  };
}

function normalizeAudioOverlayJob(data: AudioOverlayJob | undefined | null): AudioOverlayJob | undefined {
  if (!data) return data ?? undefined;
  return {
    ...data,
    videoMediaId: data.video_media_id ?? data.videoMediaId,
    audioMediaId: data.audio_media_id ?? data.audioMediaId,
    outputMediaId: data.output_media_id ?? data.outputMediaId ?? null,
    createdAt: data.created_at ?? data.createdAt,
    startedAt: data.started_at ?? data.startedAt ?? null,
    completedAt: data.completed_at ?? data.completedAt ?? null,
  };
}

function audioOverlayBody(params: AudioOverlayCreateParams): Record<string, unknown> {
  const body: Record<string, unknown> = {
    video_media_id: params.videoMediaId,
    audio_media_id: params.audioMediaId,
  };
  if (params.mode !== undefined) body.mode = params.mode;
  if (params.videoVolume !== undefined) body.video_volume = params.videoVolume;
  if (params.audioVolume !== undefined) body.audio_volume = params.audioVolume;
  if (params.audioStartMs !== undefined) body.audio_start_ms = params.audioStartMs;
  if (params.fit !== undefined) body.fit = params.fit;
  return body;
}

function normalizeGifConversionJob(data: GifConversionJob): GifConversionJob {
  return {
    ...data,
    gifMediaId: data.gif_media_id ?? data.gifMediaId,
    backgroundColor: data.background_color ?? data.backgroundColor,
    outputProfile: data.output_profile ?? data.outputProfile,
    outputMediaId: data.output_media_id ?? data.outputMediaId ?? null,
    createdAt: data.created_at ?? data.createdAt,
    startedAt: data.started_at ?? data.startedAt ?? null,
    completedAt: data.completed_at ?? data.completedAt ?? null,
  };
}

function abortError(): Error {
  return new DOMException("GIF conversion polling was aborted", "AbortError");
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  if (signal?.aborted) return Promise.reject(abortError());
  return new Promise((resolve, reject) => {
    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export class AudioOverlays {
  constructor(private readonly http: HttpClient) {}

  /** Create an async job that combines uploaded video and audio media. */
  async create(
    params: AudioOverlayCreateParams,
    options: AudioOverlayRequestOptions = {},
  ): Promise<AudioOverlayJob> {
    const headers: Record<string, string> = {};
    if (options.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey;
    const res = await this.http.post<{ data: AudioOverlayJob }>(
      "/v1/media/audio-overlays",
      audioOverlayBody(params),
      headers,
    );
    return normalizeAudioOverlayJob(res.data) as AudioOverlayJob;
  }

  /** Fetch an audio overlay job by ID. */
  async get(jobId: string): Promise<AudioOverlayJob> {
    const res = await this.http.get<{ data: AudioOverlayJob }>(`/v1/media/audio-overlays/${jobId}`);
    return normalizeAudioOverlayJob(res.data) as AudioOverlayJob;
  }
}

export class GifConversions {
  constructor(private readonly http: HttpClient, private readonly media: Media) {}

  async create(
    params: GifConversionCreateParams,
    options: GifConversionRequestOptions = {},
  ): Promise<GifConversionJob> {
    const headers: Record<string, string> = {};
    if (options.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey;
    const body: Record<string, unknown> = { gif_media_id: params.gifMediaId };
    if (params.backgroundColor !== undefined) body.background_color = params.backgroundColor;
    const res = await this.http.post<{ data: GifConversionJob }>(
      "/v1/media/gif-conversions", body, headers,
    );
    return normalizeGifConversionJob(res.data);
  }

  async get(conversionId: string): Promise<GifConversionJob> {
    const res = await this.http.get<{ data: GifConversionJob }>(
      `/v1/media/gif-conversions/${conversionId}`,
    );
    return normalizeGifConversionJob(res.data);
  }

  async wait(conversionId: string, options: GifConversionWaitOptions = {}): Promise<GifConversionJob> {
    const pollIntervalMs = options.pollIntervalMs ?? 2_000;
    const timeoutMs = options.timeoutMs ?? 5 * 60_000;
    const deadline = Date.now() + timeoutMs;
    while (true) {
      if (options.signal?.aborted) throw abortError();
      const job = await this.get(conversionId);
      if (job.status === "succeeded") return job;
      if (job.status === "failed") {
        const error = job.error ?? {
          code: "gif_conversion_failed",
          message: "GIF conversion failed",
          retryable: false,
        };
        throw new GifConversionError(error.code, error.message, error.retryable);
      }
      const remaining = deadline - Date.now();
      if (remaining <= 0) throw new Error(`Timed out waiting for GIF conversion ${conversionId}`);
      await wait(Math.min(pollIntervalMs, remaining), options.signal);
    }
  }

  async uploadAndConvert(filePath: string, options: UploadAndConvertGifOptions = {}): Promise<GifConversionJob> {
    const gifMediaId = await this.media.uploadFile(filePath);
    const created = await this.create(
      { gifMediaId, backgroundColor: options.backgroundColor },
      { idempotencyKey: options.idempotencyKey ?? crypto.randomUUID() },
    );
    return this.wait(created.id, options);
  }
}

export class Media {
  readonly audioOverlays: AudioOverlays;
  readonly gifConversions: GifConversions;

  constructor(private readonly http: HttpClient) {
    this.audioOverlays = new AudioOverlays(http);
    this.gifConversions = new GifConversions(http, this);
  }

  /** Request a presigned upload URL. */
  async upload(params: MediaUploadRequest): Promise<MediaUploadResponse> {
    const body: Record<string, unknown> = {
      filename: params.filename,
      content_type: params.contentType,
    };
    if (params.sizeBytes !== undefined) body.size_bytes = params.sizeBytes;
    if (params.contentHash) body.content_hash = params.contentHash;
    const res = await this.http.post<{ data: MediaUploadResponse }>("/v1/media", body);
    return normalize(res.data) as MediaUploadResponse;
  }

  /** Fetch metadata for a previously uploaded media item. */
  async get(mediaId: string): Promise<MediaUploadResponse> {
    const res = await this.http.get<{ data: MediaUploadResponse }>(`/v1/media/${mediaId}`);
    return res.data;
  }

  async delete(mediaId: string): Promise<void> {
    await this.http.delete(`/v1/media/${mediaId}`);
  }

  createGifConversion(params: GifConversionCreateParams, options?: GifConversionRequestOptions) {
    return this.gifConversions.create(params, options);
  }

  getGifConversion(conversionId: string) {
    return this.gifConversions.get(conversionId);
  }

  waitForGifConversion(conversionId: string, options?: GifConversionWaitOptions) {
    return this.gifConversions.wait(conversionId, options);
  }

  uploadAndConvertGif(filePath: string, options?: UploadAndConvertGifOptions) {
    return this.gifConversions.uploadAndConvert(filePath, options);
  }

  /**
   * Convenience: upload a local file (Node.js only).
   * Requests a presigned URL, PUTs the file, and returns the mediaId.
   */
  async uploadFile(filePath: string): Promise<string> {
    const { readFileSync, statSync } = await import("node:fs");
    const { basename } = await import("node:path");

    const stats = statSync(filePath);
    const filename = basename(filePath);
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    const result = await this.upload({
      filename,
      contentType,
      sizeBytes: stats.size,
    });
    const mediaId = result.mediaId ?? result.media_id ?? result.id;
    const uploadUrl = result.uploadUrl ?? result.upload_url;
    if (!mediaId || !uploadUrl) {
      throw new Error("unipost: media upload missing mediaId or uploadUrl");
    }

    const fileBuffer = readFileSync(filePath);
    const uploadResponse = await fetch(uploadUrl, {
      method: "PUT",
      body: fileBuffer,
      headers: { "Content-Type": contentType },
    });
    if (!uploadResponse.ok) {
      throw new Error(`Media upload failed with status ${uploadResponse.status}`);
    }

    return mediaId;
  }
}
