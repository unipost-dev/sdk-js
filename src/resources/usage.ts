import type { HttpClient } from "../http.js";
import type { Usage } from "../types/index.js";

export class UsageApi {
  constructor(private readonly http: HttpClient) {}

  async get(): Promise<Usage> {
    const res = await this.http.get<{ data: Usage }>("/v1/usage");
    return res.data;
  }
}
