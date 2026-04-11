export type Platform =
  | "twitter"
  | "linkedin"
  | "instagram"
  | "threads"
  | "tiktok"
  | "youtube"
  | "bluesky";

export type AccountStatus = "active" | "reconnect_required" | "disconnected";
export type ConnectionType = "byo" | "managed";

export interface SocialAccount {
  id: string;
  profile_id: string;
  platform: Platform;
  account_name: string | null;
  external_user_id?: string;
  external_user_email?: string;
  connected_at: string;
  status: AccountStatus;
  connection_type: ConnectionType;
}

export interface AccountHealth {
  account_id: string;
  status: "ok" | "degraded" | "disconnected";
  last_checked_at: string;
  error?: string;
}

export interface ListAccountsParams {
  platform?: Platform;
  profileId?: string;
  externalUserId?: string;
  status?: AccountStatus;
}
