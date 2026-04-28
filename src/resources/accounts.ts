import type { HttpClient } from "../http.js";
import type {
  SocialAccount,
  AccountHealth,
  ListAccountsParams,
  ConnectAccountParams,
  PaginatedResponse,
} from "../types/index.js";
import { NotFoundError } from "../errors.js";

export class Accounts {
  constructor(private readonly http: HttpClient) {}

  /** List all connected social accounts. */
  async list(params?: ListAccountsParams): Promise<PaginatedResponse<SocialAccount>> {
    const query: Record<string, string | undefined> = {};
    if (params?.platform) query.platform = params.platform;
    if (params?.profileId) query.profile_id = params.profileId;
    if (params?.externalUserId) query.external_user_id = params.externalUserId;
    if (params?.status) query.status = params.status;
    return this.http.get("/v1/accounts", query);
  }

  /** Get a single account by ID. The API has no per-id GET, so this scans the list. */
  async get(accountId: string): Promise<SocialAccount> {
    const page = await this.list();
    const match = (page.data || []).find((a) => a.id === accountId);
    if (!match) throw new NotFoundError("Account not found");
    return match;
  }

  /** Connect an account using BYO OAuth credentials. */
  async connect(params: ConnectAccountParams): Promise<SocialAccount> {
    const res = await this.http.post<{ data: SocialAccount }>("/v1/accounts/connect", {
      profile_id: params.profileId,
      platform: params.platform,
      credentials: params.credentials,
    });
    return res.data;
  }

  /** Disconnect a connected account. */
  async disconnect(accountId: string): Promise<void> {
    await this.http.delete(`/v1/accounts/${accountId}`);
  }

  /** Capability matrix for an account's platform. */
  async capabilities(accountId: string): Promise<Record<string, unknown>> {
    const res = await this.http.get<{ data: Record<string, unknown> }>(`/v1/accounts/${accountId}/capabilities`);
    return res.data;
  }

  /** Connection health for an account. */
  async health(accountId: string): Promise<AccountHealth> {
    const res = await this.http.get<{ data: AccountHealth }>(`/v1/accounts/${accountId}/health`);
    return res.data;
  }

  /** TikTok creator info needed before publishing. */
  async tikTokCreatorInfo(accountId: string): Promise<Record<string, unknown>> {
    const res = await this.http.get<{ data: Record<string, unknown> }>(`/v1/accounts/${accountId}/tiktok/creator-info`);
    return res.data;
  }

  /** Facebook page insights. */
  async facebookPageInsights(accountId: string): Promise<Record<string, unknown>> {
    const res = await this.http.get<{ data: Record<string, unknown> }>(`/v1/accounts/${accountId}/facebook/page-insights`);
    return res.data;
  }
}
