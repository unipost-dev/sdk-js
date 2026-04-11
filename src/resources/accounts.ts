import type { HttpClient } from "../http.js";
import type { SocialAccount, AccountHealth, ListAccountsParams, PaginatedResponse } from "../types/index.js";

export class Accounts {
  constructor(private readonly http: HttpClient) {}

  /** List all connected social accounts. */
  async list(params?: ListAccountsParams): Promise<PaginatedResponse<SocialAccount>> {
    const query: Record<string, string | undefined> = {};
    if (params?.platform) query.platform = params.platform;
    if (params?.profileId) query.profile_id = params.profileId;
    if (params?.externalUserId) query.external_user_id = params.externalUserId;
    if (params?.status) query.status = params.status;
    return this.http.get("/v1/social-accounts", query);
  }

  /** Get a single account by ID. */
  async get(accountId: string): Promise<SocialAccount> {
    const res = await this.http.get<{ data: SocialAccount }>(`/v1/social-accounts/${accountId}`);
    return res.data;
  }

  /** Check account health status. */
  async health(accountId: string): Promise<AccountHealth> {
    const res = await this.http.get<{ data: AccountHealth }>(`/v1/social-accounts/${accountId}/health`);
    return res.data;
  }
}
