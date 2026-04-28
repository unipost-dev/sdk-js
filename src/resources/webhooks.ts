import type { HttpClient } from "../http.js";
import type {
  WebhookSubscription,
  WebhookSubscriptionSecret,
  CreateWebhookParams,
  UpdateWebhookParams,
  PaginatedResponse,
} from "../types/index.js";

export class Webhooks {
  constructor(private readonly http: HttpClient) {}

  async create(params: CreateWebhookParams): Promise<WebhookSubscriptionSecret> {
    const res = await this.http.post<{ data: WebhookSubscriptionSecret }>("/v1/webhooks", {
      name: params.name,
      url: params.url,
      events: params.events,
      active: params.active,
      secret: params.secret,
    });
    return res.data;
  }

  async list(): Promise<PaginatedResponse<WebhookSubscription>> {
    return this.http.get("/v1/webhooks");
  }

  async get(webhookId: string): Promise<WebhookSubscription> {
    const res = await this.http.get<{ data: WebhookSubscription }>(`/v1/webhooks/${webhookId}`);
    return res.data;
  }

  async update(webhookId: string, params: UpdateWebhookParams): Promise<WebhookSubscription> {
    const body: Record<string, unknown> = {};
    if (params.name !== undefined) body.name = params.name;
    if (params.url !== undefined) body.url = params.url;
    if (params.events !== undefined) body.events = params.events;
    if (params.active !== undefined) body.active = params.active;
    const res = await this.http.patch<{ data: WebhookSubscription }>(`/v1/webhooks/${webhookId}`, body);
    return res.data;
  }

  async rotate(webhookId: string): Promise<WebhookSubscriptionSecret> {
    const res = await this.http.post<{ data: WebhookSubscriptionSecret }>(`/v1/webhooks/${webhookId}/rotate`);
    return res.data;
  }

  async delete(webhookId: string): Promise<void> {
    await this.http.delete(`/v1/webhooks/${webhookId}`);
  }
}
