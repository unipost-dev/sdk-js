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

export interface InboxReplyRequest {
  text: string;
}

export interface InboxReplyOptions {
  idempotencyKey?: string;
}

export type InboxReplyResult =
  | { state: "completed"; item: InboxItem; operationId?: string }
  | {
      state: "reconciling";
      operationId: string;
      code: "X_REMOTE_ACCEPTED_RECONCILING";
      message: string;
      requestId?: string;
    };

export interface InboxUnreadCountResult {
  count: number;
}

export interface InboxMarkAllReadResult {
  marked: number;
}

export interface InboxThreadStateRequest {
  threadStatus: InboxThreadStatus;
  assignedTo?: string;
}

export interface InboxMediaContext {
  id: string;
  caption: string;
  media_url: string;
  timestamp: string;
  media_type: string;
  permalink: string;
}

export interface XInboxBackfillRequest {
  accountId?: string;
  lookbackDays?: number;
  maxItems?: number;
  includeReplies: boolean;
  includeDms: boolean;
  confirmationToken?: string;
}

export interface InboxSyncRequest {
  xBackfill: XInboxBackfillRequest;
}

export interface InboxSyncError {
  account_id: string;
  platform: string;
  step: string;
  error: string;
}

export interface InboxSyncAccountDetail {
  account_id: string;
  platform: string;
  account_name: string;
  media_found: number;
  comments_found: number;
}

export interface InboxSyncResult {
  new_items: number;
  accounts_checked: number;
  errors: InboxSyncError[];
  details: InboxSyncAccountDetail[];
}

export interface XInboxBackfillAccountResult {
  account_id: string;
  accepted: number;
  suppressed: number;
  duplicates: number;
  read: number;
  stopped_at_boundary?: boolean;
  stop_reason?: string;
  missing_scopes?: string[];
}

export type XInboxBackfillResult =
  | {
      status: "in_progress";
      confirmation_operation_id: string;
      execution_lease_expires_at: string;
      estimated_x_credits?: number;
      confirmation_required?: boolean;
      confirmation_token?: string;
      confirmation_expires_at?: string;
      accounts_checked?: number;
      accepted?: number;
      suppressed?: number;
      duplicates?: number;
      read?: number;
      details?: XInboxBackfillAccountResult[];
    }
  | {
      status?: never;
      confirmation_required: true;
      confirmation_token: string;
      confirmation_expires_at: string;
      accounts_checked: number;
      estimated_x_credits?: number;
      confirmation_operation_id?: string;
      execution_lease_expires_at?: string;
      accepted?: number;
      suppressed?: number;
      duplicates?: number;
      read?: number;
      details?: XInboxBackfillAccountResult[];
    }
  | {
      status?: never;
      confirmation_required: false;
      accounts_checked: number;
      accepted: number;
      suppressed: number;
      duplicates: number;
      read: number;
      estimated_x_credits?: number;
      confirmation_operation_id?: string;
      confirmation_token?: string;
      confirmation_expires_at?: string;
      execution_lease_expires_at?: string;
      details?: XInboxBackfillAccountResult[];
    };

export interface XInboxOutboundStatus {
  id: string;
  status: string;
  completion_attempts: number;
  reconciliation_deadline?: string;
  reconciliation_required: boolean;
  response_inbox_item_id?: string;
  updated_at: string;
}

export interface InboxWebSocketConnectionDetails {
  readonly url: string;
  readonly headers: Readonly<{ Authorization: string }>;
}
