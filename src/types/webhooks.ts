export type WebhookEventType =
  | "post.published"
  | "post.partial"
  | "post.failed"
  | "post.scheduled"
  | "post.cancelled"
  | "account.connected"
  | "account.disconnected"
  | "account.refreshed"
  | "account.reconnect_required"
  | "account.quota_warning"
  | "account.quota_exceeded"
  | string;

export interface WebhookEvent<TData = Record<string, unknown>> {
  event: WebhookEventType;
  timestamp: string;
  data: TData;
}

export interface VerifyWebhookOptions {
  payload: string | Uint8Array | Buffer;
  signature?: string | null;
  secret: string;
}

export interface WebhookSubscription {
  id: string;
  name: string;
  url: string;
  events: string[];
  active: boolean;
  secret_preview: string;
  created_at: string;
}

export interface WebhookSubscriptionSecret extends WebhookSubscription {
  secret: string;
}

export interface CreateWebhookParams {
  name: string;
  url: string;
  events: string[];
  active?: boolean;
  secret?: string;
}

export interface UpdateWebhookParams {
  name?: string;
  url?: string;
  events?: string[];
  active?: boolean;
}
