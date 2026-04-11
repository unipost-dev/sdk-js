import type { HttpClient } from "../http.js";
import type { Profile, PaginatedResponse } from "../types/index.js";

export class Profiles {
  constructor(private readonly http: HttpClient) {}

  /** List all profiles in the workspace. */
  async list(): Promise<PaginatedResponse<Profile>> {
    return this.http.get("/v1/profiles");
  }

  /** Get a single profile by ID. */
  async get(profileId: string): Promise<Profile> {
    const res = await this.http.get<{ data: Profile }>(`/v1/profiles/${profileId}`);
    return res.data;
  }
}
