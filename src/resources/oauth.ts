import type { HttpClient } from "../http.js";
import type { OAuthConnectResponse } from "../types/index.js";

export class OAuth {
  constructor(private readonly http: HttpClient) {}

  /**
   * Get the platform-specific OAuth auth URL to redirect the user to.
   * Pass `redirectUrl` to override the default callback.
   */
  async connect(platform: string, params: { redirectUrl?: string } = {}): Promise<OAuthConnectResponse> {
    const res = await this.http.post<{ data: OAuthConnectResponse }>("/v1/oauth/connect", {
      platform,
      redirect_url: params.redirectUrl,
    });
    return res.data;
  }
}
