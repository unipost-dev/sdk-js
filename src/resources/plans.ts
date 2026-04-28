import type { HttpClient } from "../http.js";
import type { Plan } from "../types/index.js";

export class Plans {
  constructor(private readonly http: HttpClient) {}

  /** List available subscription plans. */
  async list(): Promise<Plan[]> {
    const res = await this.http.get<{ data: Plan[] }>("/v1/plans");
    return res.data;
  }
}
