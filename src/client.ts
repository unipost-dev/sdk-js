import { HttpClient } from "./http.js";
import { WorkspaceApi } from "./resources/workspace.js";
import { Profiles } from "./resources/profiles.js";
import { Accounts } from "./resources/accounts.js";
import { Platforms } from "./resources/platforms.js";
import { Plans } from "./resources/plans.js";
import { PlatformCredentials } from "./resources/platform-credentials.js";
import { ApiKeys } from "./resources/api-keys.js";
import { Posts } from "./resources/posts.js";
import { DeliveryJobs } from "./resources/delivery-jobs.js";
import { Media } from "./resources/media.js";
import { Analytics } from "./resources/analytics.js";
import { Connect } from "./resources/connect.js";
import { Users } from "./resources/users.js";
import { Webhooks } from "./resources/webhooks.js";
import { OAuth } from "./resources/oauth.js";
import { UsageApi } from "./resources/usage.js";
import { Logs } from "./resources/logs.js";
import { Inbox } from "./resources/inbox.js";
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
 * // reads UNIPOST_API_KEY from the environment
 * const client = new UniPost()
 *
 * const post = await client.posts.create({
 *   caption: 'Hello from UniPost!',
 *   accountIds: ['sa_twitter_xxx'],
 * })
 * ```
 */
export class UniPost {
  readonly workspace: WorkspaceApi;
  readonly profiles: Profiles;
  readonly accounts: Accounts;
  readonly platforms: Platforms;
  readonly plans: Plans;
  readonly platformCredentials: PlatformCredentials;
  readonly apiKeys: ApiKeys;
  readonly posts: Posts;
  readonly deliveryJobs: DeliveryJobs;
  readonly media: Media;
  readonly analytics: Analytics;
  readonly connect: Connect;
  readonly users: Users;
  readonly webhooks: Webhooks;
  readonly oauth: OAuth;
  readonly usage: UsageApi;
  readonly logs: Logs;
  readonly inbox: Inbox;

  constructor(options: UniPostClientOptions = {}) {
    const apiKey = options.apiKey ?? getEnvVar("UNIPOST_API_KEY");
    if (!apiKey) {
      throw new Error(
        "UniPost API key is required. Pass `new UniPost({ apiKey })` or set UNIPOST_API_KEY.",
      );
    }

    const http = new HttpClient({
      apiKey,
      baseUrl: options.baseUrl ?? DEFAULT_BASE_URL,
      timeout: options.timeout ?? DEFAULT_TIMEOUT,
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
}

function getEnvVar(name: string): string | undefined {
  if (typeof process !== "undefined" && process.env) {
    return process.env[name];
  }
  if (typeof globalThis !== "undefined" && "Deno" in globalThis) {
    try {
      return (globalThis as { Deno?: { env?: { get(name: string): string | undefined } } }).Deno?.env?.get(name);
    } catch {
      return undefined;
    }
  }
  return undefined;
}
