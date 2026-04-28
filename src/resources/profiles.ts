import type { HttpClient } from "../http.js";
import type {
  Profile,
  CreateProfileParams,
  UpdateProfileParams,
  PaginatedResponse,
} from "../types/index.js";

function brandingBody(params: CreateProfileParams | UpdateProfileParams): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  if (params.name !== undefined) body.name = params.name;
  if (params.brandingLogoUrl !== undefined) body.branding_logo_url = params.brandingLogoUrl;
  if (params.brandingDisplayName !== undefined) body.branding_display_name = params.brandingDisplayName;
  if (params.brandingPrimaryColor !== undefined) body.branding_primary_color = params.brandingPrimaryColor;
  return body;
}

export class Profiles {
  constructor(private readonly http: HttpClient) {}

  /** List all profiles in the workspace. */
  async list(): Promise<PaginatedResponse<Profile>> {
    return this.http.get("/v1/profiles");
  }

  /** Create a new profile. */
  async create(params: CreateProfileParams): Promise<Profile> {
    const res = await this.http.post<{ data: Profile }>("/v1/profiles", brandingBody(params));
    return res.data;
  }

  /** Get a single profile by ID. */
  async get(profileId: string): Promise<Profile> {
    const res = await this.http.get<{ data: Profile }>(`/v1/profiles/${profileId}`);
    return res.data;
  }

  /** Update a profile. */
  async update(profileId: string, params: UpdateProfileParams = {}): Promise<Profile> {
    const res = await this.http.patch<{ data: Profile }>(`/v1/profiles/${profileId}`, brandingBody(params));
    return res.data;
  }

  /** Delete a profile (and its accounts). */
  async delete(profileId: string): Promise<void> {
    await this.http.delete(`/v1/profiles/${profileId}`);
  }
}
