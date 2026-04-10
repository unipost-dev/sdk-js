import { HttpClient } from "./http.js";
import { Accounts } from "./resources/accounts.js";
import { Posts } from "./resources/posts.js";
import { Media } from "./resources/media.js";
import { Analytics } from "./resources/analytics.js";
import { Connect } from "./resources/connect.js";
import { Users } from "./resources/users.js";
import type { UniPostClientOptions } from "./types/index.js";

const DEFAULT_BASE_URL = "https://api.unipost.dev";
const DEFAULT_TIMEOUT = 30_000;

/**
 * Official UniPost API client.
 *
 * @example
 * ```ts
 * import { UniPost } from '@unipost/sdk'
 *
 * const client = new UniPost() // reads UNIPOST_API_KEY env var
 *
 * const post = await client.posts.create({
 *   caption: 'Hello from UniPost!',
 *   accountIds: ['sa_twitter_xxx'],
 * })
 * ```
 */
export class UniPost {
  readonly accounts: Accounts;
  readonly posts: Posts;
  readonly media: Media;
  readonly analytics: Analytics;
  readonly connect: Connect;
  readonly users: Users;

  constructor(options: UniPostClientOptions = {}) {
    const apiKey = options.apiKey ?? getEnvVar("UNIPOST_API_KEY");
    if (!apiKey) {
      throw new Error(
        "UniPost API key is required. Pass it as `new UniPost({ apiKey })` or set the UNIPOST_API_KEY environment variable.",
      );
    }

    const http = new HttpClient({
      apiKey,
      baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
      timeout: options.timeout ?? DEFAULT_TIMEOUT,
    });

    this.accounts = new Accounts(http);
    this.posts = new Posts(http);
    this.media = new Media(http);
    this.analytics = new Analytics(http);
    this.connect = new Connect(http);
    this.users = new Users(http);
  }
}

function getEnvVar(name: string): string | undefined {
  // Node.js / Bun / Deno
  if (typeof process !== "undefined" && process.env) {
    return process.env[name];
  }
  // Deno
  if (typeof globalThis !== "undefined" && "Deno" in globalThis) {
    try {
      return (globalThis as any).Deno.env.get(name);
    } catch {
      return undefined;
    }
  }
  return undefined;
}
