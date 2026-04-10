export type WebhookEventType =
  | "post.published"
  | "post.failed"
  | "post.scheduled"
  | "post.cancelled"
  | "account.connected"
  | "account.disconnected"
  | "account.reconnect_required";

export interface WebhookEvent {
  id: string;
  event: WebhookEventType;
  created_at: string;
  data: Record<string, unknown>;
}

export interface VerifyWebhookOptions {
  payload: string | Buffer;
  signature: string;
  secret: string;
}
