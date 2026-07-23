export type Platform =
  | "twitter"
  | "linkedin"
  | "instagram"
  | "threads"
  | "tiktok"
  | "youtube"
  | "bluesky"
  | "facebook"
  | "pinterest"
  | string;

export type AccountStatus = "active" | "reconnect_required" | "disconnected" | string;
export type ConnectionType = "byo" | "managed" | string;

export interface SocialAccount {
  id: string;
  profile_id?: string;
  profile_name?: string;
  platform: Platform;
  account_name?: string | null;
  external_account_id?: string;
  connected_at?: string;
  external_user_id?: string;
  external_user_email?: string;
  status: AccountStatus;
  connection_type?: ConnectionType;
  scope?: string[];
}

export interface AccountHealth {
  social_account_id: string;
  platform: Platform;
  status: "ok" | "degraded" | "disconnected" | string;
  last_successful_post_at?: string;
  token_expires_at?: string;
  last_error?: Record<string, unknown>;
}

export interface ListAccountsParams {
  platform?: Platform;
  externalUserId?: string;
  status?: AccountStatus;
  profileId?: string;
}

export interface ConnectAccountParams {
  profileId?: string;
  platform: Platform;
  credentials: Record<string, string>;
}
