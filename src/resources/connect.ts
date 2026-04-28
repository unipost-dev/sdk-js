import type { HttpClient } from "../http.js";
import type { ConnectSession, CreateConnectSessionParams } from "../types/index.js";

export class Connect {
  constructor(private readonly http: HttpClient) {}

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
