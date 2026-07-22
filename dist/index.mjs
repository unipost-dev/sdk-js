var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/errors.ts
var UniPostError = class extends Error {
  status;
  code;
  error_source;
  error_temporality;
  provider_error;
  retry_policy;
  constructor(message, status, code, contract = {}) {
    super(message);
    this.name = "UniPostError";
    this.status = status;
    this.code = code;
    this.error_source = contract.error_source;
    this.error_temporality = contract.error_temporality;
    this.provider_error = contract.provider_error;
    this.retry_policy = contract.retry_policy;
  }
};
var AuthError = class extends UniPostError {
  constructor(message = "Authentication failed", contract = {}) {
    super(message, 401, "auth_error", contract);
    this.name = "AuthError";
  }
};
var NotFoundError = class extends UniPostError {
  constructor(message = "Resource not found", contract = {}) {
    super(message, 404, "not_found", contract);
    this.name = "NotFoundError";
  }
};
var ValidationError = class extends UniPostError {
  errors;
  constructor(message = "Validation failed", errors = {}, contract = {}, code = "validation_error") {
    super(message, 422, code, contract);
    this.name = "ValidationError";
    this.errors = errors;
  }
};
var RateLimitError = class extends UniPostError {
  retryAfter;
  constructor(retryAfter, message = "Rate limit exceeded", contract = {}) {
    super(message, 429, "rate_limit", contract);
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
};
var PlatformError = class extends UniPostError {
  platform;
  constructor(message, platform, contract = {}) {
    super(message, 502, "platform_error", contract);
    this.name = "PlatformError";
    this.platform = platform;
  }
};
var QuotaError = class extends UniPostError {
  constructor(message = "Monthly quota exceeded", contract = {}) {
    super(message, 403, "quota_exceeded", contract);
    this.name = "QuotaError";
  }
};
function parseApiError(status, body, options = {}) {
  const msg = body?.error?.message || "Unknown API error";
  const code = options.preserveCode ? body?.error?.code || body?.error?.normalized_code || "unknown" : body?.error?.normalized_code || body?.error?.code || "unknown";
  const contract = {
    error_source: body?.error?.error_source,
    error_temporality: body?.error?.error_temporality,
    provider_error: body?.error?.provider_error,
    retry_policy: body?.error?.retry_policy
  };
  switch (status) {
    case 401:
      return new AuthError(msg, contract);
    case 404:
      return new NotFoundError(msg, contract);
    case 422:
      return new ValidationError(
        msg,
        body?.error?.errors || {},
        contract,
        options.preserveCode ? code : void 0
      );
    case 429: {
      const retryAfter = parseInt(String(body?.error?.retry_after ?? "1"), 10);
      return new RateLimitError(retryAfter, msg, contract);
    }
    case 403:
      if (code === "quota_exceeded") return new QuotaError(msg, contract);
      return new UniPostError(msg, status, code, contract);
    case 502:
      if (body?.error?.platform) return new PlatformError(msg, body.error.platform, contract);
      return new UniPostError(msg, status, code, contract);
    default:
      return new UniPostError(msg, status, code, contract);
  }
}

// src/http.ts
var MAX_RETRIES = 2;
var SDK_VERSION = "0.5.0";
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
    const response = await this.requestWithResponse(method, path, options);
    return response.body;
  }
  async requestWithResponse(method, path, options) {
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
    const retryRateLimits = options?.retryRateLimits !== false;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url.toString(), init);
        if (response.ok) {
          let body2;
          if (response.status === 204) {
            body2 = void 0;
          } else {
            const text = await response.text();
            body2 = text ? JSON.parse(text) : void 0;
          }
          return {
            status: response.status,
            headers: new Headers(response.headers),
            body: body2
          };
        }
        if (response.status === 429 && retryRateLimits) {
          const retryAfter = parseInt(response.headers.get("Retry-After") || "1", 10);
          if (attempt < MAX_RETRIES) {
            await sleep(retryAfter * 1e3);
            continue;
          }
          throw new RateLimitError(retryAfter);
        }
        const body = await response.json().catch(() => ({}));
        throw parseApiError(response.status, body, {
          preserveCode: options?.preserveErrorCode
        });
      } catch (err) {
        if (retryRateLimits && err instanceof RateLimitError && attempt < MAX_RETRIES) {
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
  async *streamSSE(path, options) {
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
      Accept: "text/event-stream",
      ...options?.headers
    };
    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
      signal: options?.signal
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw parseApiError(response.status, body);
    }
    if (!response.body) {
      throw new Error("SSE response body is not readable");
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let eventName;
    let eventId;
    let dataLines = [];
    const flush = () => {
      if (dataLines.length === 0) {
        eventName = void 0;
        eventId = void 0;
        return void 0;
      }
      const event = {
        event: eventName,
        id: eventId,
        data: JSON.parse(dataLines.join("\n"))
      };
      eventName = void 0;
      eventId = void 0;
      dataLines = [];
      return event;
    };
    const consumeLine = (line) => {
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line === "") return flush();
      if (line.startsWith(":")) return void 0;
      const separator = line.indexOf(":");
      const field = separator === -1 ? line : line.slice(0, separator);
      const rawValue = separator === -1 ? "" : line.slice(separator + 1);
      const value = rawValue.startsWith(" ") ? rawValue.slice(1) : rawValue;
      if (field === "event") eventName = value;
      if (field === "id") eventId = value;
      if (field === "data") dataLines.push(value);
      return void 0;
    };
    let completed = false;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          completed = true;
          break;
        }
        buffer += decoder.decode(value, { stream: true });
        let newline = buffer.indexOf("\n");
        while (newline !== -1) {
          const line = buffer.slice(0, newline);
          buffer = buffer.slice(newline + 1);
          const event2 = consumeLine(line);
          if (event2) yield event2;
          newline = buffer.indexOf("\n");
        }
      }
      buffer += decoder.decode();
      if (buffer) {
        const event2 = consumeLine(buffer);
        if (event2) yield event2;
      }
      const event = flush();
      if (event) yield event;
    } finally {
      if (!completed) {
        await reader.cancel().catch(() => void 0);
      }
      reader.releaseLock();
    }
  }
  inboxWebSocketConnectionDetails(query) {
    const url = new URL("/v1/inbox/ws", this.baseUrl);
    if (url.protocol === "https:") {
      url.protocol = "wss:";
    } else if (url.protocol === "http:") {
      url.protocol = "ws:";
    } else {
      throw new Error("WebSocket connections require an HTTP or HTTPS base URL protocol.");
    }
    for (const [key, value] of Object.entries(query)) {
      if (value !== void 0 && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
    const headers = Object.freeze({ Authorization: `Bearer ${this.apiKey}` });
    return Object.freeze({ url: url.toString(), headers });
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
  webm: "video/webm",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  aac: "audio/aac",
  m4a: "audio/mp4"
};
function normalize(data) {
  if (!data) return data ?? void 0;
  return {
    ...data,
    mediaId: data.media_id ?? data.id ?? data.mediaId,
    uploadUrl: data.upload_url ?? data.uploadUrl
  };
}
function normalizeAudioOverlayJob(data) {
  if (!data) return data ?? void 0;
  return {
    ...data,
    videoMediaId: data.video_media_id ?? data.videoMediaId,
    audioMediaId: data.audio_media_id ?? data.audioMediaId,
    outputMediaId: data.output_media_id ?? data.outputMediaId ?? null,
    createdAt: data.created_at ?? data.createdAt,
    startedAt: data.started_at ?? data.startedAt ?? null,
    completedAt: data.completed_at ?? data.completedAt ?? null
  };
}
function audioOverlayBody(params) {
  const body = {
    video_media_id: params.videoMediaId,
    audio_media_id: params.audioMediaId
  };
  if (params.mode !== void 0) body.mode = params.mode;
  if (params.videoVolume !== void 0) body.video_volume = params.videoVolume;
  if (params.audioVolume !== void 0) body.audio_volume = params.audioVolume;
  if (params.audioStartMs !== void 0) body.audio_start_ms = params.audioStartMs;
  if (params.fit !== void 0) body.fit = params.fit;
  return body;
}
var AudioOverlays = class {
  constructor(http) {
    this.http = http;
  }
  http;
  /** Create an async job that combines uploaded video and audio media. */
  async create(params, options = {}) {
    const headers = {};
    if (options.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey;
    const res = await this.http.post(
      "/v1/media/audio-overlays",
      audioOverlayBody(params),
      headers
    );
    return normalizeAudioOverlayJob(res.data);
  }
  /** Fetch an audio overlay job by ID. */
  async get(jobId) {
    const res = await this.http.get(`/v1/media/audio-overlays/${jobId}`);
    return normalizeAudioOverlayJob(res.data);
  }
};
var Media = class {
  constructor(http) {
    this.http = http;
    this.audioOverlays = new AudioOverlays(http);
  }
  http;
  audioOverlays;
  /** Request a presigned upload URL. */
  async upload(params) {
    const body = {
      filename: params.filename,
      content_type: params.contentType
    };
    if (params.sizeBytes !== void 0) body.size_bytes = params.sizeBytes;
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

// src/resources/logs.ts
function buildQuery2(params = {}) {
  return {
    category: params.category,
    action: "action" in params ? params.action : void 0,
    source: "source" in params ? params.source : void 0,
    level: params.level,
    status: params.status,
    platform: params.platform,
    profile_id: params.profileId,
    social_account_id: params.socialAccountId,
    post_id: params.postId,
    request_id: params.requestId,
    error_code: params.errorCode,
    q: "q" in params ? params.q : void 0,
    from: "from" in params ? params.from : void 0,
    to: "to" in params ? params.to : void 0,
    limit: "limit" in params ? params.limit : void 0,
    cursor: "cursor" in params ? params.cursor : void 0,
    after_id: "afterId" in params ? params.afterId : void 0
  };
}
var Logs = class {
  constructor(http) {
    this.http = http;
  }
  http;
  async list(params = {}) {
    const response = await this.http.get(
      "/v1/logs",
      buildQuery2(params)
    );
    const nextCursor = response?.meta?.next_cursor ?? response?.nextCursor ?? response?.next_cursor;
    return { ...response, nextCursor };
  }
  async get(logId) {
    const res = await this.http.get(`/v1/logs/${encodeURIComponent(String(logId))}`);
    return res.data;
  }
  async *stream(params = {}, options = {}) {
    const headers = {};
    if (options.lastEventId !== void 0) headers["Last-Event-ID"] = String(options.lastEventId);
    for await (const event of this.http.streamSSE("/v1/logs/stream", {
      query: buildQuery2(params),
      headers,
      signal: options.signal
    })) {
      if (!event.event || event.event === "log.created") {
        yield event.data;
      }
    }
  }
};

// src/resources/inbox.ts
var ScopedInbox = class {
  #http;
  #scope;
  constructor(http, scope) {
    this.#http = http;
    this.#scope = scope;
  }
  #scopeQuery() {
    const query = { inbox_scope: this.#scope.kind };
    if (this.#scope.kind === "managed_user") {
      query.external_user_id = this.#scope.externalUserId;
    }
    return query;
  }
  #post(path, body) {
    return this.#http.request("POST", path, {
      body,
      query: this.#scopeQuery(),
      retryRateLimits: false
    });
  }
  async list(params) {
    const query = this.#scopeQuery();
    if (params?.source !== void 0) query.source = params.source;
    if (params?.isRead !== void 0) query.is_read = params.isRead;
    if (params?.isOwn !== void 0) query.is_own = params.isOwn;
    if (params?.limit !== void 0) query.limit = params.limit;
    const response = await this.#http.get("/v1/inbox", query);
    const result = { data: response.data };
    if (response.request_id !== void 0) result.requestId = response.request_id;
    return result;
  }
  async unreadCount() {
    const response = await this.#http.get(
      "/v1/inbox/unread-count",
      this.#scopeQuery()
    );
    return response.data;
  }
  async get(id) {
    const response = await this.#http.get(
      `/v1/inbox/${encodeInboxPathSegment(id, "item")}`,
      this.#scopeQuery()
    );
    return response.data;
  }
  async markRead(id) {
    await this.#post(`/v1/inbox/${encodeInboxPathSegment(id, "item")}/read`);
  }
  async markAllRead() {
    const response = await this.#post(
      "/v1/inbox/mark-all-read"
    );
    return response.data;
  }
  async updateThreadState(id, request) {
    const body = {
      thread_status: request.threadStatus
    };
    if (request.assignedTo !== void 0) body.assigned_to = request.assignedTo;
    const response = await this.#post(
      `/v1/inbox/${encodeInboxPathSegment(id, "item")}/thread-state`,
      body
    );
    return response.data;
  }
  async mediaContext(id) {
    const response = await this.#http.get(
      `/v1/inbox/${encodeInboxPathSegment(id, "item")}/media-context`,
      this.#scopeQuery()
    );
    return response.data;
  }
  async sync(request) {
    if (request === void 0) {
      const response2 = await this.#post(
        "/v1/inbox/sync"
      );
      return response2.data;
    }
    const source = request.xBackfill;
    if (source === void 0) {
      throw new Error("Inbox sync request requires xBackfill.");
    }
    const xBackfill = {
      include_replies: source.includeReplies,
      include_dms: source.includeDms
    };
    if (source.accountId !== void 0) xBackfill.account_id = source.accountId;
    if (source.lookbackDays !== void 0) xBackfill.lookback_days = source.lookbackDays;
    if (source.maxItems !== void 0) xBackfill.max_items = source.maxItems;
    if (source.confirmationToken !== void 0) {
      xBackfill.confirmation_token = source.confirmationToken;
    }
    const response = await this.#post(
      "/v1/inbox/sync",
      { x_backfill: xBackfill }
    );
    return response.data;
  }
  async xOutboundStatus(requestId) {
    const response = await this.#http.get(
      `/v1/inbox/x-outbound-operations/${encodeInboxPathSegment(requestId, "request")}`,
      this.#scopeQuery()
    );
    return response.data;
  }
  webSocketConnectionDetails() {
    return this.#http.inboxWebSocketConnectionDetails(this.#scopeQuery());
  }
  async reply(id, request, options) {
    const headers = options?.idempotencyKey === void 0 ? void 0 : { "Idempotency-Key": options.idempotencyKey };
    const response = await this.#http.requestWithResponse(
      "POST",
      `/v1/inbox/${encodeInboxPathSegment(id, "item")}/reply`,
      {
        body: { text: request.text },
        query: this.#scopeQuery(),
        headers,
        retryRateLimits: false,
        preserveErrorCode: true
      }
    ).catch((error) => {
      if (error instanceof SyntaxError) {
        throw new Error("Failed to decode Inbox reply response.");
      }
      throw error;
    });
    const operationId = response.headers.get("X-UniPost-Operation-Id")?.trim();
    if (response.status === 200 && isRecord(response.body?.data)) {
      const result = {
        state: "completed",
        item: response.body.data
      };
      if (operationId) result.operationId = operationId;
      return result;
    }
    if (response.status === 202 && operationId && response.body?.error?.code === "X_REMOTE_ACCEPTED_RECONCILING" && typeof response.body.error.message === "string" && (response.body.request_id === void 0 || typeof response.body.request_id === "string")) {
      const result = {
        state: "reconciling",
        operationId,
        code: "X_REMOTE_ACCEPTED_RECONCILING",
        message: response.body.error.message
      };
      if (response.body.request_id !== void 0) result.requestId = response.body.request_id;
      return result;
    }
    throw new Error(`Failed to decode Inbox reply response with status ${response.status}.`);
  }
};
function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function encodeInboxPathSegment(value, kind) {
  if (value === "" || value === "." || value === "..") {
    throw new Error(`Inbox ${kind} ID must be a non-empty, non-dot path segment.`);
  }
  return encodeURIComponent(value);
}
var Inbox = class {
  #http;
  constructor(http) {
    this.#http = http;
  }
  managedUser(externalUserId) {
    if (externalUserId.trim().length === 0) {
      throw new Error("Managed-user Inbox scope requires a non-empty external user ID.");
    }
    return new ScopedInbox(
      this.#http,
      Object.freeze({ kind: "managed_user", externalUserId })
    );
  }
  workspace() {
    return new ScopedInbox(this.#http, Object.freeze({ kind: "workspace" }));
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
  logs;
  inbox;
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
    this.logs = new Logs(http);
    this.inbox = new Inbox(http);
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
  return __require("crypto").webcrypto.subtle;
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
export {
  AuthError,
  NotFoundError,
  PlatformError,
  QuotaError,
  RateLimitError,
  UniPost,
  UniPostError,
  ValidationError,
  verifyWebhookSignature
};
