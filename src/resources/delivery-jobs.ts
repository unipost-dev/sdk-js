import type { HttpClient } from "../http.js";
import type {
  DeliveryJob,
  ListDeliveryJobsParams,
  PaginatedResponse,
} from "../types/index.js";

export class DeliveryJobs {
  constructor(private readonly http: HttpClient) {}

  async list(params: ListDeliveryJobsParams = {}): Promise<PaginatedResponse<DeliveryJob>> {
    const query: Record<string, string | number | undefined> = {};
    if (params.limit !== undefined) query.limit = params.limit;
    if (params.offset !== undefined) query.offset = params.offset;
    if (params.states !== undefined) {
      query.states = Array.isArray(params.states) ? params.states.join(",") : params.states;
    }
    return this.http.get("/v1/post-delivery-jobs", query);
  }

  async summary(): Promise<Record<string, unknown>> {
    const res = await this.http.get<{ data: Record<string, unknown> }>("/v1/post-delivery-jobs/summary");
    return res.data;
  }

  async retry(jobId: string): Promise<DeliveryJob> {
    const res = await this.http.post<{ data: DeliveryJob }>(`/v1/post-delivery-jobs/${jobId}/retry`);
    return res.data;
  }

  async cancel(jobId: string): Promise<DeliveryJob> {
    const res = await this.http.post<{ data: DeliveryJob }>(`/v1/post-delivery-jobs/${jobId}/cancel`);
    return res.data;
  }
}
