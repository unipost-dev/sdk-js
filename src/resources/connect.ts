import type { HttpClient } from "../http.js";
import type {
  ConnectSession,
  CreateConnectSessionParams,
  GetConnectUrlParams,
  OAuthConnectResponse,
} from "../types/index.js";

export class Connect {
  constructor(private readonly http: HttpClient) {}

  /** Get an OAuth auth URL for connecting one self-owned social account. */
  async getConnectUrl(params: GetConnectUrlParams): Promise<OAuthConnectResponse> {
    const query: Record<string, string | undefined> = {};
    if (params.redirectUrl) query.redirect_url = params.redirectUrl;
    const res = await this.http.get<{ data: OAuthConnectResponse }>(
      `/v1/profiles/${params.profileId}/oauth/connect/${params.platform}`,
      query,
    );
    return res.data;
  }

  /** Create a Connect session for end-user OAuth. */
  async createSession(params: CreateConnectSessionParams): Promise<ConnectSession> {
    const res = await this.http.post<{ data: ConnectSession }>("/v1/connect/sessions", {
      platform: params.platform,
      profile_id: params.profileId,
      external_user_id: params.externalUserId,
      external_user_email: params.externalUserEmail,
      return_url: params.returnUrl,
    });
    return res.data;
  }

  /** Get the status of a Connect session. */
  async getSession(sessionId: string): Promise<ConnectSession> {
    const res = await this.http.get<{ data: ConnectSession }>(`/v1/connect/sessions/${sessionId}`);
    return res.data;
  }
}
