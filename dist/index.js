"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  AuthError: () => AuthError,
  NotFoundError: () => NotFoundError,
  PlatformError: () => PlatformError,
  QuotaError: () => QuotaError,
  RateLimitError: () => RateLimitError,
  UniPost: () => UniPost,
  UniPostError: () => UniPostError,
  ValidationError: () => ValidationError,
  verifyWebhookSignature: () => verifyWebhookSignature
});
module.exports = __toCommonJS(index_exports);

// src/errors.ts
var UniPostError = class extends Error {
  status;
  code;
  constructor(message, status, code) {
    super(message);
    this.name = "UniPostError";
    this.status = status;
    this.code = code;
  }
};
var AuthError = class extends UniPostError {
  constructor(message = "Authentication failed") {
    super(message, 401, "auth_error");
    this.name = "AuthError";
  }
};
var NotFoundError = class extends UniPostError {
  constructor(message = "Resource not found") {
    super(message, 404, "not_found");
    this.name = "NotFoundError";
  }
};
var ValidationError = class extends UniPostError {
  errors;
  constructor(message = "Validation failed", errors = {}) {
    super(message, 422, "validation_error");
    this.name = "ValidationError";
    this.errors = errors;
  }
};
var RateLimitError = class extends UniPostError {
  retryAfter;
  constructor(retryAfter, message = "Rate limit exceeded") {
    super(message, 429, "rate_limit");
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
};
var PlatformError = class extends UniPostError {
  platform;
  constructor(message, platform) {
    super(message, 502, "platform_error");
    this.name = "PlatformError";
    this.platform = platform;
  }
};
var QuotaError = class extends UniPostError {
  constructor(message = "Monthly quota exceeded") {
    super(message, 403, "quota_exceeded");
    this.name = "QuotaError";
  }
};
function parseApiError(status, body) {
  const msg = body?.error?.message || "Unknown API error";
  const code = body?.error?.normalized_code || body?.error?.code || "unknown";
  switch (status) {
    case 401:
      return new AuthError(msg);
    case 404:
      return new NotFoundError(msg);
    case 422:
      return new ValidationError(msg, body?.error?.errors || {});
    case 429: {
      const retryAfter = parseInt(String(body?.error?.retry_after ?? "1"), 10);
      return new RateLimitError(retryAfter, msg);
    }
    case 403:
      if (code === "quota_exceeded") return new QuotaError(msg);
      return new UniPostError(msg, status, code);
    case 502:
      if (body?.error?.platform) return new PlatformError(msg, body.error.platform);
      return new UniPostError(msg, status, code);
    default:
      return new UniPostError(msg, status, code);
  }
}

// src/http.ts
var MAX_RETRIES = 2;
var SDK_VERSION = "0.3.0";
var USER_AGENT = `@unipost/sdk/${SDK_VERSION}`;
var HttpClient = class {
  apiKey;
  baseUrl;
  timeout;
  constructor(options) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl;
    this.timeout = options.timeout;
  }
  async request(method, path, options) {
    const url = new URL(path, this.baseUrl);
    if (options?.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== void 0 && value !== null && value !== "") {
          url.searchParams.set(key, String(value));
        }
      }
    }
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      "User-Agent": USER_AGENT,
      ...options?.headers
    };
    if (options?.body !== void 0 && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }
    const init = {
      method,
      headers,
      signal: AbortSignal.timeout(this.timeout)
    };
    if (options?.body !== void 0) {
      init.body = JSON.stringify(options.body);
    }
    let lastError = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url.toString(), init);
        if (response.ok) {
          if (response.status === 204) return void 0;
          const text = await response.text();
          return text ? JSON.parse(text) : void 0;
        }
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get("Retry-After") || "1", 10);
          if (attempt < MAX_RETRIES) {
            await sleep(retryAfter * 1e3);
            continue;
          }
          throw new RateLimitError(retryAfter);
        }
        const body = await response.json().catch(() => ({}));
        throw parseApiError(response.status, body);
      } catch (err) {
        if (err instanceof RateLimitError && attempt < MAX_RETRIES) {
          await sleep(err.retryAfter * 1e3);
          lastError = err;
          continue;
        }
        throw err;
      }
    }
    throw lastError || new Error("Request failed after retries");
  }
  async requestText(method, path, options) {
    const url = new URL(path, this.baseUrl);
    if (options?.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== void 0 && value !== null && value !== "") {
          url.searchParams.set(key, String(value));
        }
      }
    }
    const headers = {
      Authorization: `Bearer ${this.apiKey}`,
      "User-Agent": USER_AGENT,
      ...options?.headers
    };
    let lastError = null;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url.toString(), {
          method,
          headers,
          signal: AbortSignal.timeout(this.timeout)
        });
        if (response.ok) {
          return await response.text();
        }
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get("Retry-After") || "1", 10);
          if (attempt < MAX_RETRIES) {
            await sleep(retryAfter * 1e3);
            continue;
          }
          throw new RateLimitError(retryAfter);
        }
        const body = await response.json().catch(() => ({}));
        throw parseApiError(response.status, body);
      } catch (err) {
        if (err instanceof RateLimitError && attempt < MAX_RETRIES) {
          await sleep(err.retryAfter * 1e3);
          lastError = err;
          continue;
        }
        throw err;
      }
    }
    throw lastError || new Error("Request failed after retries");
  }
  get(path, query) {
    return this.request("GET", path, { query });
  }
  getText(path, query) {
    return this.requestText("GET", path, { query });
  }
  post(path, body, headers) {
    return this.request("POST", path, { body, headers });
  }
  patch(path, body) {
    return this.request("PATCH", path, { body });
  }
  put(path, body) {
    return this.request("PUT", path, { body });
  }
  delete(path) {
    return this.request("DELETE", path);
  }
};
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// src/resources/workspace.ts
var WorkspaceApi = class {
  constructor(http) {
    this.http = http;
  }
  http;
  /** Get the workspace bound to the authenticated caller. */
  async get() {
    const res = await this.http.get("/v1/workspace");
    return res.data;
  }
  /** Update workspace fields. */
  async update(params = {}) {
    const body = {};
    if (params.name !== void 0) body.name = params.name;
    if (params.perAccountMonthlyLimit !== void 0) {
      body.per_account_monthly_limit = params.perAccountMonthlyLimit;
    }
    const res = await this.http.patch("/v1/workspace", body);
    return res.data;
  }
};

// src/resources/profiles.ts
function brandingBody(params) {
  const body = {};
  if (params.name !== void 0) body.name = params.name;
  if (params.brandingLogoUrl !== void 0) body.branding_logo_url = params.brandingLogoUrl;
  if (params.brandingDisplayName !== void 0) body.branding_display_name = params.brandingDisplayName;
  if (params.brandingPrimaryColor !== void 0) body.branding_primary_color = params.brandingPrimaryColor;
  return body;
}
var Profiles = class {
  constructor(http) {
    this.http = http;
  }
  http;
  /** List all profiles in the workspace. */
  async list() {
    return this.http.get("/v1/profiles");
  }
  /** Create a new profile. */
  async create(params) {
    const res = await this.http.post("/v1/profiles", brandingBody(params));
    return res.data;
  }
  /** Get a single profile by ID. */
  async get(profileId) {
    const res = await this.http.get(`/v1/profiles/${profileId}`);
    return res.data;
  }
  /** Update a profile. */
  async update(profileId, params = {}) {
    const res = await this.http.patch(`/v1/profiles/${profileId}`, brandingBody(params));
    return res.data;
  }
  /** Delete a profile (and its accounts). */
  async delete(profileId) {
    await this.http.delete(`/v1/profiles/${profileId}`);
  }
};

// src/resources/accounts.ts
var Accounts = class {
  constructor(http) {
    this.http = http;
  }
  http;
  /** List all connected social accounts. */
  async list(params) {
    const query = {};
    if (params?.platform) query.platform = params.platform;
    if (params?.profileId) query.profile_id = params.profileId;
    if (params?.externalUserId) query.external_user_id = params.externalUserId;
    if (params?.status) query.status = params.status;
    return this.http.get("/v1/accounts", query);
  }
  /** Get a single account by ID. The API has no per-id GET, so this scans the list. */
  async get(accountId) {
    const page = await this.list();
    const match = (page.data || []).find((a) => a.id === accountId);
    if (!match) throw new NotFoundError("Account not found");
    return match;
  }
  /** Connect an account using BYO OAuth credentials. */
  async connect(params) {
    const res = await this.http.post("/v1/accounts/connect", {
      profile_id: params.profileId,
      platform: params.platform,
      credentials: params.credentials
    });
    return res.data;
  }
  /** Disconnect a connected account. */
  async disconnect(accountId) {
    await this.http.delete(`/v1/accounts/${accountId}`);
  }
  /** Capability matrix for an account's platform. */
  async capabilities(accountId) {
    const res = await this.http.get(`/v1/accounts/${accountId}/capabilities`);
    return res.data;
  }
  /** Connection health for an account. */
  async health(accountId) {
    const res = await this.http.get(`/v1/accounts/${accountId}/health`);
    return res.data;
  }
  /** TikTok creator info needed before publishing. */
  async tikTokCreatorInfo(accountId) {
    const res = await this.http.get(`/v1/accounts/${accountId}/tiktok/creator-info`);
    return res.data;
  }
  /** Facebook page insights. */
  async facebookPageInsights(accountId) {
    const res = await this.http.get(`/v1/accounts/${accountId}/facebook/page-insights`);
    return res.data;
  }
};

// src/resources/platforms.ts
var Platforms = class {
  constructor(http) {
    this.http = http;
  }
  http;
  /** Per-platform capability matrix. */
  async capabilities() {
    const res = await this.http.get("/v1/platforms/capabilities");
    return res.data;
  }
};

// src/resources/plans.ts
var Plans = class {
  constructor(http) {
    this.http = http;
  }
  http;
  /** List available subscription plans. */
  async list() {
    const res = await this.http.get("/v1/plans");
    return res.data;
  }
};

// src/resources/platform-credentials.ts
var PlatformCredentials = class {
  constructor(http) {
    this.http = http;
  }
  http;
  /** Store a BYO platform OAuth credential. */
  async create(params) {
    const res = await this.http.post("/v1/platform-credentials", {
      platform: params.platform,
      client_id: params.clientId,
      client_secret: params.clientSecret
    });
    return res.data;
  }
  /** List stored platform credentials. */
  async list() {
    return this.http.get("/v1/platform-credentials");
  }
  /** Remove a stored platform credential. */
  async delete(platform) {
    await this.http.delete(`/v1/platform-credentials/${platform}`);
  }
};

// src/resources/api-keys.ts
var ApiKeys = class {
  constructor(http) {
    this.http = http;
  }
  http;
  /** List API keys for the authenticated workspace. */
  async list() {
    return this.http.get("/v1/api-keys");
  }
  /**
   * Create a new API key. The plaintext `key` is only returned once; store it
   * before navigating away.
   */
  async create(params) {
    const body = { name: params.name };
    if (params.environment !== void 0) body.environment = params.environment;
    if (params.expiresAt !== void 0) body.expires_at = params.expiresAt;
    const res = await this.http.post("/v1/api-keys", body);
    return res.data;
  }
  /** Revoke an API key. The next request authenticated with it will fail. */
  async revoke(keyId) {
    await this.http.delete(`/v1/api-keys/${keyId}`);
  }
};

// src/resources/posts.ts
function toSnakeCase(params = {}) {
  const body = {};
  if (params.caption !== void 0) body.caption = params.caption;
  if (params.accountIds) body.account_ids = params.accountIds;
  if (params.mediaUrls) body.media_urls = params.mediaUrls;
  if (params.mediaIds) body.media_ids = params.mediaIds;
  if (params.scheduledAt) body.scheduled_at = params.scheduledAt;
  if (params.status) body.status = params.status;
  if (params.archived !== void 0) body.archived = params.archived;
  if (params.platformPosts) {
    body.platform_posts = params.platformPosts.map((pp) => {
      const entry = { account_id: pp.accountId };
      if (pp.caption !== void 0) entry.caption = pp.caption;
      if (pp.mediaUrls) entry.media_urls = pp.mediaUrls;
      if (pp.mediaIds) entry.media_ids = pp.mediaIds;
      if (pp.threadPosition !== void 0) entry.thread_position = pp.threadPosition;
      if (pp.firstComment !== void 0) entry.first_comment = pp.firstComment;
      if (pp.inReplyTo !== void 0) entry.in_reply_to = pp.inReplyTo;
      if (pp.platformOptions !== void 0) entry.platform_options = pp.platformOptions;
      return entry;
    });
  }
  return body;
}
var Posts = class {
  constructor(http) {
    this.http = http;
  }
  http;
  /** Create a new post. */
  async create(params) {
    const body = toSnakeCase(params);
    const headers = {};
    if (params.idempotencyKey) headers["Idempotency-Key"] = params.idempotencyKey;
    const res = await this.http.post("/v1/posts", body, headers);
    return res.data;
  }
  /** Validate post params without persisting anything. */
  async validate(params) {
    const res = await this.http.post("/v1/posts/validate", toSnakeCase(params));
    return res.data;
  }
  /** List posts with optional filters and cursor pagination. */
  async list(params) {
    const query = {};
    if (params?.status) query.status = params.status;
    if (params?.platform) query.platform = params.platform;
    if (params?.from) query.from = params.from;
    if (params?.to) query.to = params.to;
    if (params?.limit) query.limit = params.limit;
    if (params?.cursor) query.cursor = params.cursor;
    const response = await this.http.get(
      "/v1/posts",
      query
    );
    const nextCursor = response?.meta?.next_cursor ?? response?.nextCursor ?? response?.next_cursor;
    return { ...response, nextCursor };
  }
  /** Iterate every post via cursor pagination. */
  async *listAll(params) {
    let cursor;
    do {
      const page = await this.list({ ...params, cursor });
      for (const post of page.data || []) yield post;
      cursor = page.nextCursor;
    } while (cursor);
  }
  /** Get a single post by ID. */
  async get(postId) {
    const res = await this.http.get(`/v1/posts/${postId}`);
    return res.data;
  }
  /** Get the dispatch queue snapshot for a post. */
  async getQueue(postId) {
    const res = await this.http.get(`/v1/posts/${postId}/queue`);
    return res.data;
  }
  /** Per-platform analytics rows for a post. Pass `{ refresh: true }` to force a live fetch. */
  async analytics(postId, params = {}) {
    const query = {};
    if (params.refresh) query.refresh = "true";
    const res = await this.http.get(`/v1/posts/${postId}/analytics`, query);
    return res.data ?? [];
  }
  /** Publish a draft or queued post. */
  async publish(postId) {
    const res = await this.http.post(`/v1/posts/${postId}/publish`);
    return res.data;
  }
  /** Update a post's fields. */
  async update(postId, params = {}) {
    const res = await this.http.patch(`/v1/posts/${postId}`, toSnakeCase(params));
    return res.data;
  }
  async archive(postId) {
    const res = await this.http.post(`/v1/posts/${postId}/archive`);
    return res.data;
  }
  async restore(postId) {
    const res = await this.http.post(`/v1/posts/${postId}/restore`);
    return res.data;
  }
  async cancel(postId) {
    const res = await this.http.post(`/v1/posts/${postId}/cancel`);
    return res.data;
  }
  async delete(postId) {
    await this.http.delete(`/v1/posts/${postId}`);
  }
  /** Generate a shareable preview link for a draft post. */
  async previewLink(postId) {
    const res = await this.http.post(`/v1/posts/${postId}/preview-link`);
    return res.data;
  }
  /** Retry a failed per-platform delivery for a post. */
  async retryResult(postId, resultId) {
    const res = await this.http.post(`/v1/posts/${postId}/results/${resultId}/retry`);
    return res.data;
  }
  /** Bulk-create up to 50 posts. */
  async bulkCreate(posts) {
    const body = { posts: posts.map((p) => toSnakeCase(p)) };
    const res = await this.http.post("/v1/posts/bulk", body);
    return res.data;
  }
};

// src/resources/delivery-jobs.ts
var DeliveryJobs = class {
  constructor(http) {
    this.http = http;
  }
  http;
  async list(params = {}) {
    const query = {};
    if (params.limit !== void 0) query.limit = params.limit;
    if (params.offset !== void 0) query.offset = params.offset;
    if (params.states !== void 0) {
      query.states = Array.isArray(params.states) ? params.states.join(",") : params.states;
    }
    return this.http.get("/v1/post-delivery-jobs", query);
  }
  async summary() {
    const res = await this.http.get("/v1/post-delivery-jobs/summary");
    return res.data;
  }
  async retry(jobId) {
    const res = await this.http.post(`/v1/post-delivery-jobs/${jobId}/retry`);
    return res.data;
  }
  async cancel(jobId) {
    const res = await this.http.post(`/v1/post-delivery-jobs/${jobId}/cancel`);
    return res.data;
  }
};

// src/resources/media.ts
var MIME_TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  mp4: "video/mp4",
  mov: "video/quicktime",
  webm: "video/webm"
};
function normalize(data) {
  if (!data) return data ?? void 0;
  return {
    ...data,
    mediaId: data.media_id ?? data.id ?? data.mediaId,
    uploadUrl: data.upload_url ?? data.uploadUrl
  };
}
var Media = class {
  constructor(http) {
    this.http = http;
  }
  http;
  /** Request a presigned upload URL. */
  async upload(params) {
    const body = {
      filename: params.filename,
      content_type: params.contentType,
      size_bytes: params.sizeBytes
    };
    if (params.contentHash) body.content_hash = params.contentHash;
    const res = await this.http.post("/v1/media", body);
    return normalize(res.data);
  }
  /** Fetch metadata for a previously uploaded media item. */
  async get(mediaId) {
    const res = await this.http.get(`/v1/media/${mediaId}`);
    return res.data;
  }
  async delete(mediaId) {
    await this.http.delete(`/v1/media/${mediaId}`);
  }
  /**
   * Convenience: upload a local file (Node.js only).
   * Requests a presigned URL, PUTs the file, and returns the mediaId.
   */
  async uploadFile(filePath) {
    const { readFileSync, statSync } = await import("fs");
    const { basename } = await import("path");
    const stats = statSync(filePath);
    const filename = basename(filePath);
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    const result = await this.upload({
      filename,
      contentType,
      sizeBytes: stats.size
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
      headers: { "Content-Type": contentType }
    });
    if (!uploadResponse.ok) {
      throw new Error(`Media upload failed with status ${uploadResponse.status}`);
    }
    return mediaId;
  }
};

// src/resources/analytics.ts
function buildQuery(params = {}) {
  const query = {};
  if (params.from) query.from = params.from;
  if (params.to) query.to = params.to;
  if (params.profileId) query.profile_id = params.profileId;
  if (params.platform) query.platform = params.platform;
  if (params.status) query.status = params.status;
  return query;
}
function buildPostsQuery(params = {}) {
  return {
    ...buildQuery(params),
    account_id: params.accountId,
    post_id: params.postId,
    limit: params.limit,
    cursor: params.cursor,
    sort: params.sort
  };
}
function buildPlatformQuery(params = {}) {
  return {
    from: params.from,
    to: params.to,
    profile_id: params.profileId
  };
}
function buildRefreshBody(params = {}) {
  return {
    platform: params.platform,
    profile_id: params.profileId,
    account_id: params.accountId,
    post_id: params.postId,
    from: params.from,
    to: params.to,
    limit: params.limit
  };
}
var Analytics = class {
  constructor(http) {
    this.http = http;
  }
  http;
  async summary(params = {}) {
    const res = await this.http.get("/v1/analytics/summary", buildQuery(params));
    return res.data;
  }
  async trend(params = {}) {
    const res = await this.http.get("/v1/analytics/trend", buildQuery(params));
    return res.data;
  }
  async byPlatform(params = {}) {
    const res = await this.http.get("/v1/analytics/by-platform", buildQuery(params));
    return res.data;
  }
  /** Aggregated rollup with a granularity (day/week/month) and group_by axis. */
  async rollup(params) {
    const res = await this.http.get("/v1/analytics/rollup", {
      from: params.from,
      to: params.to,
      granularity: params.granularity,
      group_by: params.groupBy
    });
    return res.data;
  }
  /** Paginated post-level analytics rows across UniPost-published content. */
  async posts(params = {}) {
    const res = await this.http.get("/v1/analytics/posts", buildPostsQuery(params));
    return {
      data: res.data || [],
      meta: res.meta,
      nextCursor: res.meta?.next_cursor || res.next_cursor
    };
  }
  /** Export post-level analytics rows as CSV text. */
  async exportPostsCsv(params = {}) {
    return this.http.getText("/v1/analytics/posts/export", buildPostsQuery(params));
  }
  /** Analytics availability and health by destination platform. */
  async platforms(params = {}) {
    const res = await this.http.get("/v1/analytics/platforms", buildPlatformQuery(params));
    return res.data || [];
  }
  /** Detailed analytics for one platform, including summary, trend, accounts, and top posts. */
  async platform(platform, params = {}) {
    const res = await this.http.get(
      `/v1/analytics/platforms/${encodeURIComponent(platform)}`,
      buildPlatformQuery(params)
    );
    return res.data;
  }
  /** Mark matching analytics rows stale so background workers refresh platform metrics. */
  async refresh(params = {}) {
    const res = await this.http.post("/v1/analytics/refresh", buildRefreshBody(params));
    return res.data;
  }
};

// src/resources/connect.ts
var Connect = class {
  constructor(http) {
    this.http = http;
  }
  http;
  /** Get an OAuth auth URL for connecting one self-owned social account. */
  async getConnectUrl(params) {
    const res = await this.http.post("/v1/oauth/connect", {
      profile_id: params.profileId,
      platform: params.platform,
      redirect_url: params.redirectUrl
    });
    return res.data;
  }
  /** Create a Connect session for end-user OAuth. */
  async createSession(params) {
    const res = await this.http.post("/v1/connect/sessions", {
      platform: params.platform,
      profile_id: params.profileId,
      external_user_id: params.externalUserId,
      external_user_email: params.externalUserEmail,
      return_url: params.returnUrl,
      allow_quickstart_creds: params.allowQuickstartCreds
    });
    return res.data;
  }
  /** Get the status of a Connect session. */
  async getSession(sessionId) {
    const res = await this.http.get(`/v1/connect/sessions/${sessionId}`);
    return res.data;
  }
};

// src/resources/users.ts
var Users = class {
  constructor(http) {
    this.http = http;
  }
  http;
  /** List all managed users. */
  async list() {
    return this.http.get("/v1/users");
  }
  /** Get a single managed user by external_user_id. */
  async get(externalUserId) {
    const res = await this.http.get(
      `/v1/users/${encodeURIComponent(externalUserId)}`
    );
    return res.data;
  }
};

// src/resources/webhooks.ts
var Webhooks = class {
  constructor(http) {
    this.http = http;
  }
  http;
  async create(params) {
    const res = await this.http.post("/v1/webhooks", {
      name: params.name,
      url: params.url,
      events: params.events,
      active: params.active,
      secret: params.secret
    });
    return res.data;
  }
  async list() {
    return this.http.get("/v1/webhooks");
  }
  async get(webhookId) {
    const res = await this.http.get(`/v1/webhooks/${webhookId}`);
    return res.data;
  }
  async update(webhookId, params) {
    const body = {};
    if (params.name !== void 0) body.name = params.name;
    if (params.url !== void 0) body.url = params.url;
    if (params.events !== void 0) body.events = params.events;
    if (params.active !== void 0) body.active = params.active;
    const res = await this.http.patch(`/v1/webhooks/${webhookId}`, body);
    return res.data;
  }
  async rotate(webhookId) {
    const res = await this.http.post(`/v1/webhooks/${webhookId}/rotate`);
    return res.data;
  }
  async delete(webhookId) {
    await this.http.delete(`/v1/webhooks/${webhookId}`);
  }
};

// src/resources/oauth.ts
var OAuth = class {
  constructor(http) {
    this.http = http;
  }
  http;
  /**
   * Get the platform-specific OAuth auth URL to redirect the user to.
   * Pass `redirectUrl` to override the default callback.
   */
  async connect(platform, params = {}) {
    const res = await this.http.post("/v1/oauth/connect", {
      platform,
      redirect_url: params.redirectUrl
    });
    return res.data;
  }
};

// src/resources/usage.ts
var UsageApi = class {
  constructor(http) {
    this.http = http;
  }
  http;
  async get() {
    const res = await this.http.get("/v1/usage");
    return res.data;
  }
};

// src/client.ts
var DEFAULT_BASE_URL = "https://api.unipost.dev";
var DEFAULT_TIMEOUT = 3e4;
var UniPost = class {
  workspace;
  profiles;
  accounts;
  platforms;
  plans;
  platformCredentials;
  apiKeys;
  posts;
  deliveryJobs;
  media;
  analytics;
  connect;
  users;
  webhooks;
  oauth;
  usage;
  constructor(options = {}) {
    const apiKey = options.apiKey ?? getEnvVar("UNIPOST_API_KEY");
    if (!apiKey) {
      throw new Error(
        "UniPost API key is required. Pass `new UniPost({ apiKey })` or set UNIPOST_API_KEY."
      );
    }
    const http = new HttpClient({
      apiKey,
      baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
      timeout: options.timeout ?? DEFAULT_TIMEOUT
    });
    this.workspace = new WorkspaceApi(http);
    this.profiles = new Profiles(http);
    this.accounts = new Accounts(http);
    this.platforms = new Platforms(http);
    this.plans = new Plans(http);
    this.platformCredentials = new PlatformCredentials(http);
    this.apiKeys = new ApiKeys(http);
    this.posts = new Posts(http);
    this.deliveryJobs = new DeliveryJobs(http);
    this.media = new Media(http);
    this.analytics = new Analytics(http);
    this.connect = new Connect(http);
    this.users = new Users(http);
    this.webhooks = new Webhooks(http);
    this.oauth = new OAuth(http);
    this.usage = new UsageApi(http);
  }
};
function getEnvVar(name) {
  if (typeof process !== "undefined" && process.env) {
    return process.env[name];
  }
  if (typeof globalThis !== "undefined" && "Deno" in globalThis) {
    try {
      return globalThis.Deno?.env?.get(name);
    } catch {
      return void 0;
    }
  }
  return void 0;
}

// src/webhook.ts
function getSubtle() {
  if (globalThis.crypto?.subtle) return globalThis.crypto.subtle;
  return require("crypto").webcrypto.subtle;
}
async function verifyWebhookSignature(options) {
  const { payload, signature, secret } = options;
  if (!signature || !secret) return false;
  const subtle = getSubtle();
  const normalized = String(signature).trim().replace(/^sha256=/i, "");
  if (!normalized) return false;
  const encoder = new TextEncoder();
  const key = await subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const payloadBytes = typeof payload === "string" ? encoder.encode(payload) : new Uint8Array(payload);
  const signatureBytes = await subtle.sign("HMAC", key, payloadBytes);
  const computed = bufferToHex(signatureBytes);
  return timingSafeEqual(computed, normalized);
}
function bufferToHex(buffer) {
  return Array.from(new Uint8Array(buffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  AuthError,
  NotFoundError,
  PlatformError,
  QuotaError,
  RateLimitError,
  UniPost,
  UniPostError,
  ValidationError,
  verifyWebhookSignature
});
