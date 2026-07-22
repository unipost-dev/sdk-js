export type InboxSource =
  | "ig_comment"
  | "ig_dm"
  | "threads_reply"
  | "fb_comment"
  | "fb_dm"
  | "x_reply"
  | "x_dm";

export type InboxThreadStatus = "open" | "assigned" | "resolved";

export interface InboxItem {
  id: string;
  social_account_id: string;
  workspace_id: string;
  source: InboxSource;
  external_id: string;
  thread_key: string;
  thread_status: InboxThreadStatus;
  is_read: boolean;
  is_own: boolean;
  received_at: string;
  created_at: string;
  parent_external_id?: string;
  assigned_to?: string;
  linked_post_id?: string;
  author_name?: string;
  author_id?: string;
  author_avatar_url?: string;
  body?: string;
  account_name?: string;
  account_platform?: string;
  account_avatar_url?: string;
  x_credits_counted?: number;
  x_credit_operation?: string;
  x_credit_catalog_version?: string;
  x_credit_billing_mode?: string;
  url?: string;
}

export interface InboxListParams {
  source?: InboxSource;
  isRead?: boolean;
  isOwn?: boolean;
  limit?: number;
}

export interface InboxListResponse {
  data: InboxItem[];
  requestId?: string;
}
