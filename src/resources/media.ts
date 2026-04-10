import type { HttpClient } from "../http.js";
import type { MediaUploadRequest, MediaUploadResponse } from "../types/index.js";

export class Media {
  constructor(private readonly http: HttpClient) {}

  /** Request a presigned upload URL. */
  async upload(params: MediaUploadRequest): Promise<MediaUploadResponse> {
    const res = await this.http.post<{ data: MediaUploadResponse }>("/v1/media/upload", {
      filename: params.filename,
      content_type: params.contentType,
      size_bytes: params.sizeBytes,
    });
    return res.data;
  }

  /**
   * Convenience: upload a local file (Node.js only).
   * Reads the file, requests a presigned URL, uploads, and returns the mediaId.
   */
  async uploadFile(filePath: string): Promise<string> {
    // Dynamic import to avoid breaking browser/edge environments
    const { readFileSync, statSync } = await import("node:fs");
    const { basename } = await import("node:path");

    const stats = statSync(filePath);
    const filename = basename(filePath);
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    const { mediaId, uploadUrl } = await this.upload({
      filename,
      contentType,
      sizeBytes: stats.size,
    });

    const fileBuffer = readFileSync(filePath);
    await fetch(uploadUrl, {
      method: "PUT",
      body: fileBuffer,
      headers: { "Content-Type": contentType },
    });

    return mediaId;
  }
}

const MIME_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  mp4: "video/mp4",
  mov: "video/quicktime",
};
