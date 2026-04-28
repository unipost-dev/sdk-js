import { parseApiError, RateLimitError } from "./errors.js";

const MAX_RETRIES = 2;
const SDK_VERSION = "0.2.5";
const USER_AGENT = `@unipost/sdk/${SDK_VERSION}`;

export interface HttpClientOptions {
  apiKey: string;
  baseUrl: string;
  timeout: number;
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
    options?: {
      body?: unknown;
      query?: Record<string, string | number | boolean | undefined | null>;
      headers?: Record<string, string>;
    },
  ): Promise<T> {
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

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch(url.toString(), init);

        if (response.ok) {
          if (response.status === 204) return undefined as T;
          const text = await response.text();
          return (text ? JSON.parse(text) : undefined) as T;
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

  get<T>(path: string, query?: Record<string, string | number | boolean | undefined | null>) {
    return this.request<T>("GET", path, { query });
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
