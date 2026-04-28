import type { HttpClient } from "../http.js";
import type { Workspace, UpdateWorkspaceParams } from "../types/index.js";

export class WorkspaceApi {
  constructor(private readonly http: HttpClient) {}

  /** Get the workspace bound to the authenticated caller. */
  async get(): Promise<Workspace> {
    const res = await this.http.get<{ data: Workspace }>("/v1/workspace");
    return res.data;
  }

  /** Update workspace fields. */
  async update(params: UpdateWorkspaceParams = {}): Promise<Workspace> {
    const body: Record<string, unknown> = {};
    if (params.name !== undefined) body.name = params.name;
    if (params.perAccountMonthlyLimit !== undefined) {
      body.per_account_monthly_limit = params.perAccountMonthlyLimit;
    }
    const res = await this.http.patch<{ data: Workspace }>("/v1/workspace", body);
    return res.data;
  }
}
