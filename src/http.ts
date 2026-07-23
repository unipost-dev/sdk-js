import { parseApiError, RateLimitError } from "./errors.js";
import type { InboxWebSocketConnectionDetails } from "./types/inbox.js";

const MAX_RETRIES = 2;
const SDK_VERSION = "0.7.0";
const USER_AGENT = `@unipost/sdk/${SDK_VERSION}`;

export interface HttpClientOptions {
  apiKey: string;
  baseUrl: string;
  timeout: number;
}

export interface SSEEvent<T> {
  event?: string;
  id?: string;
  data: T;
}

interface HttpRequestOptions {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  headers?: Record<string, string>;
  retryRateLimits?: boolean;
  preserveErrorCode?: boolean;
  redirect?: RequestInit["redirect"];
}

interface HttpResponse<T> {
  status: number;
  headers: Headers;
  body: T;
}

export class HttpClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(options: HttpClientOptions) {
    this.apiKey = options.apiKey;
    this.baseUrl = options.baseUrl;
    this.timeout = options.timeout;
  }

  async request<T>(
    method: string,
    path: string,
    options?: HttpRequestOptions,
  ): Promise<T> {
    const response = await this.requestWithResponse<T>(method, path, options);
    return response.body;
  }

  async requestWithResponse<T>(
    method: string,
    path: string,
    options?: HttpRequestOptions,
  ): Promise<HttpResponse<T>> {
    const url = new URL(path, this.baseUrl);

    if (options?.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "User-Agent": USER_AGENT,
      ...options?.headers,
    };

    if (options?.body !== undefined && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const init: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(this.timeout),
    };

    if (options?.body !== undefined) {
      init.body = JSON.stringify(options.body);
    }
    if (options?.redirect !== undefined) {
      init.redirect = options.redirect;
    }

    let lastError: Error | null = null;
    const retryRateLimits = options?.retryRateLimits !== false;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url.toString(), init);

        if (response.ok) {
          let body: T;
          if (response.status === 204) {
            body = undefined as T;
          } else {
            const text = await response.text();
            body = (text ? JSON.parse(text) : undefined) as T;
          }
          return {
            status: response.status,
            headers: new Headers(response.headers),
            body,
          };
        }

        if (response.status === 429 && retryRateLimits) {
          const retryAfter = parseInt(response.headers.get("Retry-After") || "1", 10);
          if (attempt < MAX_RETRIES) {
            await sleep(retryAfter * 1000);
            continue;
          }
          throw new RateLimitError(retryAfter);
        }

        const body = (await response.json().catch(() => ({}))) as Parameters<typeof parseApiError>[1];
        throw parseApiError(response.status, body, {
          preserveCode: options?.preserveErrorCode,
        });
      } catch (err) {
        if (retryRateLimits && err instanceof RateLimitError && attempt < MAX_RETRIES) {
          await sleep(err.retryAfter * 1000);
          lastError = err;
          continue;
        }
        throw err;
      }
    }

    throw lastError || new Error("Request failed after retries");
  }

  async requestText(
    method: string,
    path: string,
    options?: {
      query?: Record<string, string | number | boolean | undefined | null>;
      headers?: Record<string, string>;
    },
  ): Promise<string> {
    const url = new URL(path, this.baseUrl);

    if (options?.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "User-Agent": USER_AGENT,
      ...options?.headers,
    };

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url.toString(), {
          method,
          headers,
          signal: AbortSignal.timeout(this.timeout),
        });

        if (response.ok) {
          return await response.text();
        }

        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get("Retry-After") || "1", 10);
          if (attempt < MAX_RETRIES) {
            await sleep(retryAfter * 1000);
            continue;
          }
          throw new RateLimitError(retryAfter);
        }

        const body = (await response.json().catch(() => ({}))) as Parameters<typeof parseApiError>[1];
        throw parseApiError(response.status, body);
      } catch (err) {
        if (err instanceof RateLimitError && attempt < MAX_RETRIES) {
          await sleep(err.retryAfter * 1000);
          lastError = err;
          continue;
        }
        throw err;
      }
    }

    throw lastError || new Error("Request failed after retries");
  }

  async *streamSSE<T>(
    path: string,
    options?: {
      query?: Record<string, string | number | boolean | undefined | null>;
      headers?: Record<string, string>;
      signal?: AbortSignal;
    },
  ): AsyncGenerator<SSEEvent<T>> {
    const url = new URL(path, this.baseUrl);

    if (options?.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined && value !== null && value !== "") {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "User-Agent": USER_AGENT,
      Accept: "text/event-stream",
      ...options?.headers,
    };

    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
      signal: options?.signal,
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as Parameters<typeof parseApiError>[1];
      throw parseApiError(response.status, body);
    }
    if (!response.body) {
      throw new Error("SSE response body is not readable");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let eventName: string | undefined;
    let eventId: string | undefined;
    let dataLines: string[] = [];

    const flush = (): SSEEvent<T> | undefined => {
      if (dataLines.length === 0) {
        eventName = undefined;
        eventId = undefined;
        return undefined;
      }
      const event: SSEEvent<T> = {
        event: eventName,
        id: eventId,
        data: JSON.parse(dataLines.join("\n")) as T,
      };
      eventName = undefined;
      eventId = undefined;
      dataLines = [];
      return event;
    };

    const consumeLine = (line: string): SSEEvent<T> | undefined => {
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line === "") return flush();
      if (line.startsWith(":")) return undefined;

      const separator = line.indexOf(":");
      const field = separator === -1 ? line : line.slice(0, separator);
      const rawValue = separator === -1 ? "" : line.slice(separator + 1);
      const value = rawValue.startsWith(" ") ? rawValue.slice(1) : rawValue;

      if (field === "event") eventName = value;
      if (field === "id") eventId = value;
      if (field === "data") dataLines.push(value);
      return undefined;
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
          const event = consumeLine(line);
          if (event) yield event;
          newline = buffer.indexOf("\n");
        }
      }
      buffer += decoder.decode();
      if (buffer) {
        const event = consumeLine(buffer);
        if (event) yield event;
      }
      const event = flush();
      if (event) yield event;
    } finally {
      if (!completed) {
        await reader.cancel().catch(() => undefined);
      }
      reader.releaseLock();
    }
  }

  inboxWebSocketConnectionDetails(
    query: Record<string, string | number | boolean | undefined | null>,
  ): InboxWebSocketConnectionDetails {
    const url = new URL("/v1/inbox/ws", this.baseUrl);
    if (url.protocol === "https:") {
      url.protocol = "wss:";
    } else if (url.protocol === "http:") {
      url.protocol = "ws:";
    } else {
      throw new Error("WebSocket connections require an HTTP or HTTPS base URL protocol.");
    }

    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }

    const headers = Object.freeze({ Authorization: `Bearer ${this.apiKey}` });
    return Object.freeze({ url: url.toString(), headers });
  }

  get<T>(path: string, query?: Record<string, string | number | boolean | undefined | null>) {
    return this.request<T>("GET", path, { query });
  }

  getText(path: string, query?: Record<string, string | number | boolean | undefined | null>) {
    return this.requestText("GET", path, { query });
  }

  post<T>(path: string, body?: unknown, headers?: Record<string, string>) {
    return this.request<T>("POST", path, { body, headers });
  }

  patch<T>(path: string, body?: unknown) {
    return this.request<T>("PATCH", path, { body });
  }

  put<T>(path: string, body?: unknown) {
    return this.request<T>("PUT", path, { body });
  }

  delete<T>(path: string) {
    return this.request<T>("DELETE", path);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
