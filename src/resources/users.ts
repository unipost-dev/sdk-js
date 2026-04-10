import type { HttpClient } from "../http.js";
import type { ManagedUser, PaginatedResponse } from "../types/index.js";

export class Users {
  constructor(private readonly http: HttpClient) {}

  /** List all managed users (Connect). */
  async list(): Promise<PaginatedResponse<ManagedUser>> {
    return this.http.get("/v1/users");
  }

  /** Get a single managed user by external_user_id. */
  async get(externalUserId: string): Promise<ManagedUser> {
    const res = await this.http.get<{ data: ManagedUser }>(`/v1/users/${externalUserId}`);
    return res.data;
  }
}
