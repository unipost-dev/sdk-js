import type { HttpClient } from "../http.js";
import type {
  PlatformCredential,
  CreatePlatformCredentialParams,
  PaginatedResponse,
} from "../types/index.js";

export class PlatformCredentials {
  constructor(private readonly http: HttpClient) {}

  /** Store a BYO platform OAuth credential. */
  async create(params: CreatePlatformCredentialParams): Promise<PlatformCredential> {
    const res = await this.http.post<{ data: PlatformCredential }>("/v1/platform-credentials", {
      platform: params.platform,
      client_id: params.clientId,
      client_secret: params.clientSecret,
    });
    return res.data;
  }

  /** List stored platform credentials. */
  async list(): Promise<PaginatedResponse<PlatformCredential>> {
    return this.http.get("/v1/platform-credentials");
  }

  /** Remove a stored platform credential. */
  async delete(platform: string): Promise<void> {
    await this.http.delete(`/v1/platform-credentials/${platform}`);
  }
}
