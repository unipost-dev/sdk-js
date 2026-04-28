import type { HttpClient } from "../http.js";

export class Platforms {
  constructor(private readonly http: HttpClient) {}

  /** Per-platform capability matrix. */
  async capabilities(): Promise<Record<string, unknown>> {
    const res = await this.http.get<{ data: Record<string, unknown> }>("/v1/platforms/capabilities");
    return res.data;
  }
}
