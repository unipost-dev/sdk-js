import type { HttpClient } from "../http.js";
import type {
  ApiKey,
  CreatedApiKey,
  CreateApiKeyParams,
  PaginatedResponse,
} from "../types/index.js";

export class ApiKeys {
  constructor(private readonly http: HttpClient) {}

  /** List API keys for the authenticated workspace. */
  async list(): Promise<PaginatedResponse<ApiKey>> {
    return this.http.get("/v1/api-keys");
  }

  /**
   * Create a new API key. The plaintext `key` is only returned once; store it
   * before navigating away.
   */
  async create(params: CreateApiKeyParams): Promise<CreatedApiKey> {
    const body: Record<string, unknown> = { name: params.name };
    if (params.environment !== undefined) body.environment = params.environment;
    if (params.expiresAt !== undefined) body.expires_at = params.expiresAt;
    const res = await this.http.post<{ data: CreatedApiKey }>("/v1/api-keys", body);
    return res.data;
  }

  /** Revoke an API key. The next request authenticated with it will fail. */
  async revoke(keyId: string): Promise<void> {
    await this.http.delete(`/v1/api-keys/${keyId}`);
  }
}
