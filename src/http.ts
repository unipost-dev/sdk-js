import { parseApiError, RateLimitError } from "./errors.js";

const DEFAULT_BASE_URL = "https://api.unipost.dev";
const DEFAULT_TIMEOUT = 30_000;
const MAX_RETRIES = 2;

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
      query?: Record<string, string | number | undefined>;
      headers?: Record<string, string>;
    },
  ): Promise<T> {
    const url = new URL(path, this.baseUrl);

    if (options?.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      "User-Agent": "@unipost/sdk/0.1.0",
      ...options?.headers,
    };

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
          return (await response.json()) as T;
        }

        // Rate limit — retry with backoff
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get("Retry-After") || "1", 10);
          if (attempt < MAX_RETRIES) {
            await sleep(retryAfter * 1000);
            continue;
          }
          throw new RateLimitError(retryAfter);
        }

        // Non-retryable error
        const body = await response.json().catch(() => ({})) as { error?: { code?: string; message?: string; errors?: Record<string, string[]>; platform?: string } };
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

  get<T>(path: string, query?: Record<string, string | number | undefined>) {
    return this.request<T>("GET", path, { query });
  }

  post<T>(path: string, body?: unknown, headers?: Record<string, string>) {
    return this.request<T>("POST", path, { body, headers });
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
