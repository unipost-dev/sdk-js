import type { HttpClient } from "../http.js";
import type {
  GetManagedUserParams,
  ListManagedUsersParams,
  ManagedUserDetail,
  ManagedUserSummary,
  PaginatedResponse,
} from "../types/index.js";

export class Users {
  constructor(private readonly http: HttpClient) {}

  /** List managed users inside a profile. */
  async list(params: ListManagedUsersParams): Promise<PaginatedResponse<ManagedUserSummary>> {
    const profileId = encodeURIComponent(params.profileId);
    return this.http.get(`/v1/profiles/${profileId}/users`, {
      limit: params.limit,
    });
  }

  /** Get one managed user inside a profile by external_user_id. */
  async get(params: GetManagedUserParams): Promise<ManagedUserDetail> {
    const profileId = encodeURIComponent(params.profileId);
    const externalUserId = encodeURIComponent(params.externalUserId);
    const res = await this.http.get<{ data: ManagedUserDetail }>(
      `/v1/profiles/${profileId}/users/${externalUserId}`,
    );
    return res.data;
  }
}
