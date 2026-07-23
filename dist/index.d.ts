type InboxSource = "ig_comment" | "ig_dm" | "threads_reply" | "fb_comment" | "fb_dm" | "x_reply" | "x_dm";
type InboxThreadStatus = "open" | "assigned" | "resolved";
interface InboxItem {
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
interface InboxListParams {
    source?: InboxSource;
    isRead?: boolean;
    isOwn?: boolean;
    limit?: number;
}
interface InboxListResponse {
    data: InboxItem[];
    requestId?: string;
}
interface InboxReplyRequest {
    text: string;
}
interface InboxReplyOptions {
    idempotencyKey?: string;
}
type InboxReplyResult = {
    state: "completed";
    item: InboxItem;
    operationId?: string;
} | {
    state: "reconciling";
    operationId: string;
    code: "X_REMOTE_ACCEPTED_RECONCILING";
    message: string;
    requestId?: string;
};
interface InboxUnreadCountResult {
    count: number;
}
interface InboxMarkAllReadResult {
    marked: number;
}
interface InboxThreadStateRequest {
    threadStatus: InboxThreadStatus;
    assignedTo?: string;
}
interface InboxMediaContext {
    id: string;
    caption: string;
    media_url: string;
    timestamp: string;
    media_type: string;
    permalink: string;
}
interface XInboxBackfillRequest {
    accountId?: string;
    lookbackDays?: number;
    maxItems?: number;
    includeReplies: boolean;
    includeDms: boolean;
    confirmationToken?: string;
}
interface InboxSyncRequest {
    xBackfill: XInboxBackfillRequest;
}
interface InboxSyncError {
    account_id: string;
    platform: string;
    step: string;
    error: string;
}
interface InboxSyncAccountDetail {
    account_id: string;
    platform: string;
    account_name: string;
    media_found: number;
    comments_found: number;
}
interface InboxSyncResult {
    new_items: number;
    accounts_checked: number;
    errors: InboxSyncError[];
    details: InboxSyncAccountDetail[];
}
interface XInboxBackfillAccountResult {
    account_id: string;
    accepted: number;
    suppressed: number;
    duplicates: number;
    read: number;
    stopped_at_boundary?: boolean;
    stop_reason?: string;
    missing_scopes?: string[];
}
type XInboxBackfillResult = {
    status: "in_progress";
    confirmation_operation_id: string;
    execution_lease_expires_at: string;
    estimated_x_credits?: number;
    confirmation_required?: false;
    confirmation_token?: string;
    confirmation_expires_at?: string;
    accounts_checked?: number;
    accepted?: number;
    suppressed?: number;
    duplicates?: number;
    read?: number;
    details?: XInboxBackfillAccountResult[];
} | {
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
} | {
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
interface XInboxOutboundStatus {
    id: string;
    status: string;
    completion_attempts: number;
    reconciliation_deadline?: string;
    reconciliation_required: boolean;
    response_inbox_item_id?: string;
    updated_at: string;
}
interface InboxWebSocketConnectionDetails {
    readonly url: string;
    readonly headers: Readonly<{
        Authorization: string;
    }>;
}

interface HttpClientOptions {
    apiKey: string;
    baseUrl: string;
    timeout: number;
}
interface SSEEvent<T> {
    event?: string;
    id?: string;
    data: T;
}
interface HttpRequestOptions {
    body?: unknown;
    query?: Record<string, string | number | boolean | undefined | null>;
    headers?: Record<string, string>;
    retryRateLimits?: boolean;
    preserveErrorCode?: boolean;
    redirect?: RequestInit["redirect"];
}
interface HttpResponse<T> {
    status: number;
    headers: Headers;
    body: T;
}
declare class HttpClient {
    private readonly apiKey;
    private readonly baseUrl;
    private readonly timeout;
    constructor(options: HttpClientOptions);
    request<T>(method: string, path: string, options?: HttpRequestOptions): Promise<T>;
    requestWithResponse<T>(method: string, path: string, options?: HttpRequestOptions): Promise<HttpResponse<T>>;
    requestText(method: string, path: string, options?: {
        query?: Record<string, string | number | boolean | undefined | null>;
        headers?: Record<string, string>;
    }): Promise<string>;
    streamSSE<T>(path: string, options?: {
        query?: Record<string, string | number | boolean | undefined | null>;
        headers?: Record<string, string>;
        signal?: AbortSignal;
    }): AsyncGenerator<SSEEvent<T>>;
    inboxWebSocketConnectionDetails(query: Record<string, string | number | boolean | undefined | null>): InboxWebSocketConnectionDetails;
    get<T>(path: string, query?: Record<string, string | number | boolean | undefined | null>): Promise<T>;
    getText(path: string, query?: Record<string, string | number | boolean | undefined | null>): Promise<string>;
    post<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T>;
    patch<T>(path: string, body?: unknown): Promise<T>;
    put<T>(path: string, body?: unknown): Promise<T>;
    delete<T>(path: string): Promise<T>;
}

type Platform = "twitter" | "linkedin" | "instagram" | "threads" | "tiktok" | "youtube" | "bluesky" | "facebook" | "pinterest" | string;
type AccountStatus = "active" | "reconnect_required" | "disconnected" | string;
type ConnectionType = "byo" | "managed" | string;
interface SocialAccount {
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
interface AccountHealth {
    social_account_id: string;
    platform: Platform;
    status: "ok" | "degraded" | "disconnected" | string;
    last_successful_post_at?: string;
    token_expires_at?: string;
    last_error?: Record<string, unknown>;
}
interface ListAccountsParams {
    platform?: Platform;
    externalUserId?: string;
    status?: AccountStatus;
    profileId?: string;
}
interface ConnectAccountParams {
    profileId?: string;
    platform: Platform;
    credentials: Record<string, string>;
}

type PostStatus = "draft" | "scheduled" | "queued" | "publishing" | "dispatching" | "retrying" | "processing" | "published" | "partial" | "failed" | "cancelled" | "canceled" | string;
type ErrorSource = "unipost" | "platform" | "worker" | "unknown" | (string & {});
type ErrorTemporality = "temporary" | "permanent" | "unknown" | (string & {});
type RetryState = "not_retriable" | "scheduled" | "running" | "exhausted" | "manual_only" | "unknown" | (string & {});
interface ProviderError {
    provider?: string;
    http_status?: number;
    code?: string;
    subcode?: string;
    type?: string;
    reason?: string;
    domain?: string;
    quota_limit?: string;
    quota_location?: string;
    is_transient?: boolean;
}
interface RetryPolicy {
    is_retriable: boolean;
    will_retry: boolean;
    retry_state: RetryState;
    next_run_at?: string;
    attempts_made?: number;
    max_attempts?: number;
    attempts_remaining?: number;
    manual_retry_allowed: boolean;
    reason?: string;
}
interface PlatformResult {
    id?: string;
    social_account_id: string;
    platform?: Platform | string;
    account_name?: string;
    caption?: string;
    status: string;
    external_id?: string;
    url?: string;
    error_message?: string;
    error_source?: ErrorSource;
    error_temporality?: ErrorTemporality;
    provider_error?: ProviderError | null;
    retry_policy?: RetryPolicy | null;
    published_at?: string;
    warnings?: string[];
}
interface Post {
    id: string;
    caption: string | null;
    media_urls?: string[];
    status: PostStatus;
    execution_mode?: string;
    queued_results_count?: number;
    active_job_count?: number;
    retrying_count?: number;
    dead_count?: number;
    created_at: string;
    scheduled_at?: string;
    published_at?: string;
    results?: PlatformResult[];
}
interface CreatePostPlatformPost {
    accountId: string;
    caption?: string;
    mediaUrls?: string[];
    mediaIds?: string[];
    threadPosition?: number;
    firstComment?: string;
    inReplyTo?: string;
    platformOptions?: Record<string, unknown>;
}
interface CreatePostParams {
    caption?: string;
    accountIds?: string[];
    mediaUrls?: string[];
    mediaIds?: string[];
    scheduledAt?: string;
    status?: "draft" | "canceled" | "cancelled";
    archived?: boolean;
    idempotencyKey?: string;
    platformPosts?: CreatePostPlatformPost[];
}
type UpdatePostParams = CreatePostParams;
interface ValidationIssue {
    platform_post_index: number;
    account_id?: string;
    platform?: string;
    field: string;
    code: string;
    message: string;
    severity: string;
}
interface ValidationResult {
    valid: boolean;
    errors: ValidationIssue[];
    warnings: ValidationIssue[];
}
interface ListPostsParams {
    status?: PostStatus;
    platform?: Platform;
    from?: string;
    to?: string;
    limit?: number;
    cursor?: string;
}
interface DeliveryJob {
    id: string;
    post_id: string;
    social_post_result_id: string;
    social_account_id: string;
    platform: string;
    kind: string;
    state: string;
    attempts: number;
    max_attempts: number;
    failure_stage?: string;
    error_code?: string;
    platform_error_code?: string;
    last_error?: string;
    next_run_at?: string;
    last_attempt_at?: string;
    created_at: string;
    updated_at: string;
}
interface ListDeliveryJobsParams {
    limit?: number;
    offset?: number;
    states?: string[] | string;
}
interface PostQueueSnapshot {
    post: Post;
    jobs: DeliveryJob[];
}
interface PostAnalyticsItem {
    post_id: string;
    social_account_id: string;
    platform: string;
    external_id: string;
    impressions: number;
    reach: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    clicks: number;
    video_views: number;
    views: number;
    engagement_rate: number;
    consecutive_failures?: number;
    last_failure_reason?: string;
}
interface PostPreviewLink {
    url: string;
    token: string;
    expires_at: string;
}
interface BulkPostError {
    code: string;
    message: string;
}
interface BulkPostResult {
    status: number;
    data?: Post;
    error?: BulkPostError;
}

type WebhookEventType = "post.published" | "post.partial" | "post.failed" | "post.scheduled" | "post.cancelled" | "account.connected" | "account.disconnected" | "account.refreshed" | "account.reconnect_required" | "account.quota_warning" | "account.quota_exceeded" | string;
interface WebhookEvent<TData = Record<string, unknown>> {
    event: WebhookEventType;
    timestamp: string;
    data: TData;
}
interface VerifyWebhookOptions {
    payload: string | Uint8Array | Buffer;
    signature?: string | null;
    secret: string;
}
interface WebhookSubscription {
    id: string;
    name: string;
    url: string;
    events: string[];
    active: boolean;
    secret_preview: string;
    created_at: string;
}
interface WebhookSubscriptionSecret extends WebhookSubscription {
    secret: string;
}
interface CreateWebhookParams {
    name: string;
    url: string;
    events: string[];
    active?: boolean;
    secret?: string;
}
interface UpdateWebhookParams {
    name?: string;
    url?: string;
    events?: string[];
    active?: boolean;
}

interface Workspace {
    id: string;
    name: string;
    per_account_monthly_limit?: number | null;
    usage_modes?: string[];
    created_at: string;
    updated_at: string;
}
interface UpdateWorkspaceParams {
    name?: string;
    perAccountMonthlyLimit?: number | null;
}
interface Profile {
    id: string;
    workspace_id: string;
    name: string;
    account_count?: number;
    created_at: string;
    updated_at: string;
    branding_logo_url?: string | null;
    branding_display_name?: string | null;
    branding_primary_color?: string | null;
}
interface CreateProfileParams {
    name: string;
    brandingLogoUrl?: string | null;
    brandingDisplayName?: string | null;
    brandingPrimaryColor?: string | null;
}
interface UpdateProfileParams {
    name?: string;
    brandingLogoUrl?: string | null;
    brandingDisplayName?: string | null;
    brandingPrimaryColor?: string | null;
}
type ApiKeyEnvironment = "production" | "test";
interface ApiKey {
    id: string;
    name: string;
    prefix: string;
    environment: ApiKeyEnvironment;
    created_at: string;
    last_used_at: string | null;
    expires_at: string | null;
}
interface CreatedApiKey extends ApiKey {
    key: string;
}
interface CreateApiKeyParams {
    name: string;
    environment?: ApiKeyEnvironment;
    expiresAt?: string;
}
interface PlatformCredential {
    platform: string;
    client_id: string;
    created_at: string;
}
interface CreatePlatformCredentialParams {
    platform: string;
    clientId: string;
    clientSecret: string;
}
interface Plan {
    id: string;
    name: string;
    price_cents: number;
    post_limit: number;
}
interface ConnectSession {
    id: string;
    url: string;
    allow_quickstart_creds?: boolean;
    status: "pending" | "completed" | "expired" | string;
    expires_at: string;
    platform: string;
    external_user_id: string;
    external_user_email?: string;
    return_url?: string;
    created_at?: string;
    completed_at?: string;
    completed_social_account_id?: string;
}
interface CreateConnectSessionParams {
    platform: string;
    profileId?: string;
    externalUserId: string;
    externalUserEmail?: string;
    returnUrl?: string;
    allowQuickstartCreds?: boolean;
}
interface GetConnectUrlParams {
    profileId: string;
    platform: string;
    redirectUrl?: string;
}
interface ListManagedUsersParams {
    profileId: string;
    limit?: number;
}
interface GetManagedUserParams {
    profileId: string;
    externalUserId: string;
}
interface ManagedUserSummary {
    external_user_id: string;
    external_user_email?: string;
    account_count?: number;
    platform_counts?: Record<string, number>;
    reconnect_count?: number;
    disconnected_count?: number;
    first_connected_at?: string;
    last_refreshed_at?: string;
}
interface ManagedUserDetail {
    external_user_id: string;
    external_user_email?: string;
    account_count: number;
    accounts: SocialAccount[];
}
/** @deprecated Use ManagedUserSummary for list responses. */
type ManagedUser = ManagedUserSummary;
interface MediaUploadRequest {
    filename: string;
    contentType: string;
    sizeBytes?: number;
    contentHash?: string;
}
interface MediaUploadResponse {
    id?: string;
    media_id?: string;
    mediaId?: string;
    upload_url?: string;
    uploadUrl?: string;
    status: string;
    content_type?: string;
    size_bytes?: number;
    download_url?: string;
    expires_at?: string;
    created_at?: string;
}
type AudioOverlayMode = "mix" | "replace" | string;
type AudioOverlayFit = "trim_to_video" | "loop_to_video" | string;
type AudioOverlayStatus = "queued" | "processing" | "succeeded" | "failed" | string;
interface AudioOverlayCreateParams {
    videoMediaId: string;
    audioMediaId: string;
    mode?: AudioOverlayMode;
    videoVolume?: number;
    audioVolume?: number;
    audioStartMs?: number;
    fit?: AudioOverlayFit;
}
interface AudioOverlayRequestOptions {
    idempotencyKey?: string;
}
interface AudioOverlayError {
    code: string;
    message: string;
    retryable: boolean;
}
interface AudioOverlayJob {
    id: string;
    status: AudioOverlayStatus;
    video_media_id?: string;
    audio_media_id?: string;
    output_media_id?: string | null;
    videoMediaId?: string;
    audioMediaId?: string;
    outputMediaId?: string | null;
    mode: AudioOverlayMode;
    fit: AudioOverlayFit;
    created_at?: string;
    started_at?: string | null;
    completed_at?: string | null;
    createdAt?: string;
    startedAt?: string | null;
    completedAt?: string | null;
    error?: AudioOverlayError | null;
}
type Granularity = "day" | "week" | "month" | string;
type GroupBy = "platform" | "social_account_id" | "status" | "external_user_id" | string;
interface AnalyticsRollupParams {
    from: string;
    to: string;
    granularity?: Granularity;
    groupBy?: GroupBy;
}
interface AnalyticsQueryParams {
    from?: string;
    to?: string;
    profileId?: string;
    platform?: string;
    status?: string;
}
interface AnalyticsRollup {
    granularity: string;
    group_by: string[];
    series: Record<string, unknown>[];
}
type AnalyticsPostsSort = "published_at" | "published_at_asc" | "published_at_desc" | "created_at" | "created_at_asc" | "created_at_desc" | "impressions" | "impressions_asc" | "reach" | "reach_asc" | "likes" | "likes_asc" | "comments" | "comments_asc" | "shares" | "shares_asc" | "saves" | "saves_asc" | "clicks" | "clicks_asc" | "video_views" | "video_views_asc" | "engagement_rate" | "engagement_rate_asc" | string;
interface AnalyticsPostsParams extends AnalyticsQueryParams {
    accountId?: string;
    postId?: string;
    limit?: number;
    cursor?: string;
    sort?: AnalyticsPostsSort;
}
interface AnalyticsPostRow {
    post_id: string;
    social_post_result_id: string;
    social_account_id: string;
    profile_id: string;
    platform: string;
    external_id?: string;
    external_user_id?: string;
    result_status: string;
    post_status: string;
    caption?: string;
    url?: string;
    created_at: string;
    published_at?: string;
    impressions: number;
    reach: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    clicks: number;
    video_views: number;
    engagement_rate: number;
    platform_specific?: Record<string, unknown>;
    fetched_at?: string;
    consecutive_failures: number;
    last_failure_reason?: string;
}
interface AnalyticsPlatformParams {
    from?: string;
    to?: string;
    profileId?: string;
}
interface AnalyticsPlatformAvailability {
    platform: string;
    supported_metrics: string[];
    refresh_supported: boolean;
    account_count: number;
    active_account_count: number;
    needs_reconnect_count: number;
    analytics_row_count: number;
    last_successful_fetch_at?: string;
    last_failure_reason?: string;
    health: string;
    notes?: string[];
}
interface AnalyticsPlatformSummary {
    posts: number;
    accounts: number;
    impressions: number;
    reach: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    clicks: number;
    video_views: number;
    engagement_rate: number;
}
interface AnalyticsPlatformTrendRow {
    date: string;
    posts: number;
    impressions: number;
    reach: number;
    likes: number;
    comments: number;
    shares: number;
    saves: number;
    clicks: number;
    video_views: number;
}
interface AnalyticsAccountAvailability {
    social_account_id: string;
    profile_id: string;
    account_name?: string;
    external_user_id?: string;
    status: string;
    post_count: number;
    last_successful_fetch_at?: string;
    last_failure_reason?: string;
}
interface AnalyticsPlatformDetail {
    platform: string;
    period: {
        start: string;
        end: string;
    };
    availability: AnalyticsPlatformAvailability;
    summary: AnalyticsPlatformSummary;
    trend: AnalyticsPlatformTrendRow[];
    accounts: AnalyticsAccountAvailability[];
    top_posts: AnalyticsPostRow[];
}
interface AnalyticsRefreshParams extends AnalyticsPlatformParams {
    platform?: string;
    accountId?: string;
    postId?: string;
    limit?: number;
}
interface AnalyticsRefreshResponse {
    status: string;
    matched_count: number;
    requested_count: number;
    limit: number;
    processed_by?: string;
    filters?: Record<string, unknown>;
}
interface Usage {
    period: string;
    post_count: number;
    post_limit: number;
    plan: string;
    percentage: number;
    warning?: string;
}
interface OAuthConnectResponse {
    auth_url: string;
}
type LogLevel = "debug" | "info" | "warn" | "error" | string;
type LogStatus = "success" | "warning" | "error" | string;
type LogCategory = "publishing" | "api_request" | "oauth" | "webhook" | "system" | string;
type LogSource = "api" | "dashboard" | "worker" | "webhook" | "oauth" | string;
interface LogEntry {
    id: number;
    workspace_id: string;
    ts: string;
    level: LogLevel;
    status: LogStatus;
    category: LogCategory;
    action: string;
    source: LogSource;
    message?: string;
    request_id?: string;
    platform?: string;
    profile_id?: string;
    social_account_id?: string;
    post_id?: string;
    error_code?: string;
    metadata?: Record<string, unknown> | null;
    request_payload?: Record<string, unknown> | null;
    response_payload?: Record<string, unknown> | null;
}
interface ListLogsParams {
    category?: LogCategory;
    action?: string;
    source?: LogSource;
    level?: LogLevel;
    status?: LogStatus;
    platform?: string;
    profileId?: string;
    socialAccountId?: string;
    postId?: string;
    requestId?: string;
    errorCode?: string;
    q?: string;
    from?: string;
    to?: string;
    limit?: number;
    cursor?: string;
}
interface LogStreamParams {
    category?: LogCategory;
    level?: LogLevel;
    status?: LogStatus;
    platform?: string;
    profileId?: string;
    socialAccountId?: string;
    postId?: string;
    requestId?: string;
    errorCode?: string;
    afterId?: number;
}
interface LogStreamOptions {
    lastEventId?: number | string;
    signal?: AbortSignal;
}
interface PaginatedResponse<T> {
    data: T[];
    nextCursor?: string;
    meta?: {
        total?: number;
        limit?: number;
        has_more?: boolean;
        next_cursor?: string;
    };
}
interface UniPostClientOptions {
    apiKey?: string;
    baseUrl?: string;
    timeout?: number;
}

declare class WorkspaceApi {
    private readonly http;
    constructor(http: HttpClient);
    /** Get the workspace bound to the authenticated caller. */
    get(): Promise<Workspace>;
    /** Update workspace fields. */
    update(params?: UpdateWorkspaceParams): Promise<Workspace>;
}

declare class Profiles {
    private readonly http;
    constructor(http: HttpClient);
    /** List all profiles in the workspace. */
    list(): Promise<PaginatedResponse<Profile>>;
    /** Create a new profile. */
    create(params: CreateProfileParams): Promise<Profile>;
    /** Get a single profile by ID. */
    get(profileId: string): Promise<Profile>;
    /** Update a profile. */
    update(profileId: string, params?: UpdateProfileParams): Promise<Profile>;
    /** Delete a profile (and its accounts). */
    delete(profileId: string): Promise<void>;
}

declare class Accounts {
    private readonly http;
    constructor(http: HttpClient);
    /** List all connected social accounts. */
    list(params?: ListAccountsParams): Promise<PaginatedResponse<SocialAccount>>;
    /** Get a single account by ID. The API has no per-id GET, so this scans the list. */
    get(accountId: string): Promise<SocialAccount>;
    /** Connect an account using BYO OAuth credentials. */
    connect(params: ConnectAccountParams): Promise<SocialAccount>;
    /** Disconnect a connected account. */
    disconnect(accountId: string): Promise<void>;
    /** Capability matrix for an account's platform. */
    capabilities(accountId: string): Promise<Record<string, unknown>>;
    /** Connection health for an account. */
    health(accountId: string): Promise<AccountHealth>;
    /** TikTok creator info needed before publishing. */
    tikTokCreatorInfo(accountId: string): Promise<Record<string, unknown>>;
    /** Facebook page insights. */
    facebookPageInsights(accountId: string): Promise<Record<string, unknown>>;
}

declare class Platforms {
    private readonly http;
    constructor(http: HttpClient);
    /** Per-platform capability matrix. */
    capabilities(): Promise<Record<string, unknown>>;
}

declare class Plans {
    private readonly http;
    constructor(http: HttpClient);
    /** List available subscription plans. */
    list(): Promise<Plan[]>;
}

declare class PlatformCredentials {
    private readonly http;
    constructor(http: HttpClient);
    /** Store a BYO platform OAuth credential. */
    create(params: CreatePlatformCredentialParams): Promise<PlatformCredential>;
    /** List stored platform credentials. */
    list(): Promise<PaginatedResponse<PlatformCredential>>;
    /** Remove a stored platform credential. */
    delete(platform: string): Promise<void>;
}

declare class ApiKeys {
    private readonly http;
    constructor(http: HttpClient);
    /** List API keys for the authenticated workspace. */
    list(): Promise<PaginatedResponse<ApiKey>>;
    /**
     * Create a new API key. The plaintext `key` is only returned once; store it
     * before navigating away.
     */
    create(params: CreateApiKeyParams): Promise<CreatedApiKey>;
    /** Revoke an API key. The next request authenticated with it will fail. */
    revoke(keyId: string): Promise<void>;
}

declare class Posts {
    private readonly http;
    constructor(http: HttpClient);
    /** Create a new post. */
    create(params: CreatePostParams): Promise<Post>;
    /** Validate post params without persisting anything. */
    validate(params: CreatePostParams): Promise<ValidationResult>;
    /** List posts with optional filters and cursor pagination. */
    list(params?: ListPostsParams): Promise<PaginatedResponse<Post> & {
        nextCursor?: string;
    }>;
    /** Iterate every post via cursor pagination. */
    listAll(params?: Omit<ListPostsParams, "cursor">): AsyncGenerator<Post>;
    /** Get a single post by ID. */
    get(postId: string): Promise<Post>;
    /** Get the dispatch queue snapshot for a post. */
    getQueue(postId: string): Promise<PostQueueSnapshot>;
    /** Per-platform analytics rows for a post. Pass `{ refresh: true }` to force a live fetch. */
    analytics(postId: string, params?: {
        refresh?: boolean;
    }): Promise<PostAnalyticsItem[]>;
    /** Publish a draft or queued post. */
    publish(postId: string): Promise<Post>;
    /** Update a post's fields. */
    update(postId: string, params?: UpdatePostParams): Promise<Post>;
    archive(postId: string): Promise<Post>;
    restore(postId: string): Promise<Post>;
    cancel(postId: string): Promise<Post>;
    delete(postId: string): Promise<void>;
    /** Generate a shareable preview link for a draft post. */
    previewLink(postId: string): Promise<PostPreviewLink>;
    /** Retry a failed per-platform delivery for a post. */
    retryResult(postId: string, resultId: string): Promise<PlatformResult>;
    /** Bulk-create up to 50 posts. */
    bulkCreate(posts: CreatePostParams[]): Promise<BulkPostResult[]>;
}

declare class DeliveryJobs {
    private readonly http;
    constructor(http: HttpClient);
    list(params?: ListDeliveryJobsParams): Promise<PaginatedResponse<DeliveryJob>>;
    summary(): Promise<Record<string, unknown>>;
    retry(jobId: string): Promise<DeliveryJob>;
    cancel(jobId: string): Promise<DeliveryJob>;
}

declare class AudioOverlays {
    private readonly http;
    constructor(http: HttpClient);
    /** Create an async job that combines uploaded video and audio media. */
    create(params: AudioOverlayCreateParams, options?: AudioOverlayRequestOptions): Promise<AudioOverlayJob>;
    /** Fetch an audio overlay job by ID. */
    get(jobId: string): Promise<AudioOverlayJob>;
}
declare class Media {
    private readonly http;
    readonly audioOverlays: AudioOverlays;
    constructor(http: HttpClient);
    /** Request a presigned upload URL. */
    upload(params: MediaUploadRequest): Promise<MediaUploadResponse>;
    /** Fetch metadata for a previously uploaded media item. */
    get(mediaId: string): Promise<MediaUploadResponse>;
    delete(mediaId: string): Promise<void>;
    /**
     * Convenience: upload a local file (Node.js only).
     * Requests a presigned URL, PUTs the file, and returns the mediaId.
     */
    uploadFile(filePath: string): Promise<string>;
}

declare class Analytics {
    private readonly http;
    constructor(http: HttpClient);
    summary(params?: AnalyticsQueryParams): Promise<Record<string, unknown>>;
    trend(params?: AnalyticsQueryParams): Promise<Record<string, unknown>>;
    byPlatform(params?: AnalyticsQueryParams): Promise<Record<string, unknown>[]>;
    /** Aggregated rollup with a granularity (day/week/month) and group_by axis. */
    rollup(params: AnalyticsRollupParams): Promise<AnalyticsRollup>;
    /** Paginated post-level analytics rows across UniPost-published content. */
    posts(params?: AnalyticsPostsParams): Promise<PaginatedResponse<AnalyticsPostRow>>;
    /** Export post-level analytics rows as CSV text. */
    exportPostsCsv(params?: AnalyticsPostsParams): Promise<string>;
    /** Analytics availability and health by destination platform. */
    platforms(params?: AnalyticsPlatformParams): Promise<AnalyticsPlatformAvailability[]>;
    /** Detailed analytics for one platform, including summary, trend, accounts, and top posts. */
    platform(platform: string, params?: AnalyticsPlatformParams): Promise<AnalyticsPlatformDetail>;
    /** Mark matching analytics rows stale so background workers refresh platform metrics. */
    refresh(params?: AnalyticsRefreshParams): Promise<AnalyticsRefreshResponse>;
}

declare class Connect {
    private readonly http;
    constructor(http: HttpClient);
    /** Get an OAuth auth URL for connecting one self-owned social account. */
    getConnectUrl(params: GetConnectUrlParams): Promise<OAuthConnectResponse>;
    /** Create a Connect session for end-user OAuth. */
    createSession(params: CreateConnectSessionParams): Promise<ConnectSession>;
    /** Get the status of a Connect session. */
    getSession(sessionId: string): Promise<ConnectSession>;
}

declare class Users {
    private readonly http;
    constructor(http: HttpClient);
    /** List managed users inside a profile. */
    list(params: ListManagedUsersParams): Promise<PaginatedResponse<ManagedUserSummary>>;
    /** Get one managed user inside a profile by external_user_id. */
    get(params: GetManagedUserParams): Promise<ManagedUserDetail>;
}

declare class Webhooks {
    private readonly http;
    constructor(http: HttpClient);
    create(params: CreateWebhookParams): Promise<WebhookSubscriptionSecret>;
    list(): Promise<PaginatedResponse<WebhookSubscription>>;
    get(webhookId: string): Promise<WebhookSubscription>;
    update(webhookId: string, params: UpdateWebhookParams): Promise<WebhookSubscription>;
    rotate(webhookId: string): Promise<WebhookSubscriptionSecret>;
    delete(webhookId: string): Promise<void>;
}

declare class OAuth {
    private readonly http;
    constructor(http: HttpClient);
    /**
     * Get the platform-specific OAuth auth URL to redirect the user to.
     * Pass `redirectUrl` to override the default callback.
     */
    connect(platform: string, params?: {
        redirectUrl?: string;
    }): Promise<OAuthConnectResponse>;
}

declare class UsageApi {
    private readonly http;
    constructor(http: HttpClient);
    get(): Promise<Usage>;
}

declare class Logs {
    private readonly http;
    constructor(http: HttpClient);
    list(params?: ListLogsParams): Promise<PaginatedResponse<LogEntry> & {
        nextCursor?: string;
    }>;
    get(logId: number | string): Promise<LogEntry>;
    stream(params?: LogStreamParams, options?: LogStreamOptions): AsyncGenerator<LogEntry>;
}

type InboxScope = Readonly<{
    kind: "managed_user";
    externalUserId: string;
}> | Readonly<{
    kind: "workspace";
}>;
declare class ScopedInbox {
    #private;
    constructor(http: HttpClient, scope: InboxScope);
    list(params?: InboxListParams): Promise<InboxListResponse>;
    unreadCount(): Promise<InboxUnreadCountResult>;
    get(id: string): Promise<InboxItem>;
    markRead(id: string): Promise<void>;
    markAllRead(): Promise<InboxMarkAllReadResult>;
    updateThreadState(id: string, request: InboxThreadStateRequest): Promise<InboxItem>;
    mediaContext(id: string): Promise<InboxMediaContext>;
    sync(): Promise<InboxSyncResult>;
    sync(request: undefined): Promise<InboxSyncResult>;
    sync(request: InboxSyncRequest): Promise<XInboxBackfillResult>;
    sync(request: InboxSyncRequest | undefined): Promise<InboxSyncResult | XInboxBackfillResult>;
    xOutboundStatus(requestId: string): Promise<XInboxOutboundStatus>;
    webSocketConnectionDetails(): InboxWebSocketConnectionDetails;
    reply(id: string, request: InboxReplyRequest, options?: InboxReplyOptions): Promise<InboxReplyResult>;
}
declare class Inbox {
    #private;
    constructor(http: HttpClient);
    managedUser(externalUserId: string): ScopedInbox;
    workspace(): ScopedInbox;
}

/**
 * Official UniPost API client.
 *
 * @example
 * ```ts
 * import { UniPost } from '@unipost/sdk'
 *
 * // reads UNIPOST_API_KEY from the environment
 * const client = new UniPost()
 *
 * const post = await client.posts.create({
 *   caption: 'Hello from UniPost!',
 *   accountIds: ['sa_twitter_xxx'],
 * })
 * ```
 */
declare class UniPost {
    readonly workspace: WorkspaceApi;
    readonly profiles: Profiles;
    readonly accounts: Accounts;
    readonly platforms: Platforms;
    readonly plans: Plans;
    readonly platformCredentials: PlatformCredentials;
    readonly apiKeys: ApiKeys;
    readonly posts: Posts;
    readonly deliveryJobs: DeliveryJobs;
    readonly media: Media;
    readonly analytics: Analytics;
    readonly connect: Connect;
    readonly users: Users;
    readonly webhooks: Webhooks;
    readonly oauth: OAuth;
    readonly usage: UsageApi;
    readonly logs: Logs;
    readonly inbox: Inbox;
    constructor(options?: UniPostClientOptions);
}

interface ErrorContract {
    error_source?: ErrorSource;
    error_temporality?: ErrorTemporality;
    provider_error?: ProviderError | null;
    retry_policy?: RetryPolicy | null;
}
/**
 * Base error class for all UniPost API errors.
 */
declare class UniPostError extends Error {
    readonly status: number;
    readonly code: string;
    readonly error_source?: ErrorSource;
    readonly error_temporality?: ErrorTemporality;
    readonly provider_error?: ProviderError | null;
    readonly retry_policy?: RetryPolicy | null;
    constructor(message: string, status: number, code: string, contract?: ErrorContract);
}
/** 401 - API key invalid or expired. */
declare class AuthError extends UniPostError {
    constructor(message?: string, contract?: ErrorContract);
}
/** 404 - Resource not found. */
declare class NotFoundError extends UniPostError {
    constructor(message?: string, contract?: ErrorContract);
}
/** 422 - Validation error. */
declare class ValidationError extends UniPostError {
    readonly errors: Record<string, string[]>;
    constructor(message?: string, errors?: Record<string, string[]>, contract?: ErrorContract, code?: string);
}
/** 429 - Rate limit exceeded. */
declare class RateLimitError extends UniPostError {
    readonly retryAfter: number;
    constructor(retryAfter: number, message?: string, contract?: ErrorContract);
}
/** Platform-side error (e.g. Twitter rejected the post). */
declare class PlatformError extends UniPostError {
    readonly platform: string;
    constructor(message: string, platform: string, contract?: ErrorContract);
}
/** Monthly quota exceeded. */
declare class QuotaError extends UniPostError {
    constructor(message?: string, contract?: ErrorContract);
}

/**
 * Verify the signature of a UniPost webhook request.
 *
 * Uses HMAC-SHA256 with the webhook secret. The signature value may
 * optionally be prefixed with `sha256=` (case-insensitive).
 */
declare function verifyWebhookSignature(options: VerifyWebhookOptions): Promise<boolean>;

export { type AccountHealth, type AccountStatus, type AnalyticsQueryParams, type AnalyticsRollup, type AnalyticsRollupParams, type ApiKey, type ApiKeyEnvironment, type AudioOverlayCreateParams, type AudioOverlayError, type AudioOverlayFit, type AudioOverlayJob, type AudioOverlayMode, type AudioOverlayRequestOptions, type AudioOverlayStatus, AuthError, type BulkPostError, type BulkPostResult, type ConnectAccountParams, type ConnectSession, type ConnectionType, type CreateApiKeyParams, type CreateConnectSessionParams, type CreatePlatformCredentialParams, type CreatePostParams, type CreatePostPlatformPost, type CreateProfileParams, type CreateWebhookParams, type CreatedApiKey, type DeliveryJob, type ErrorContract, type ErrorSource, type ErrorTemporality, type GetConnectUrlParams, type GetManagedUserParams, type Granularity, type GroupBy, type InboxItem, type InboxListParams, type InboxListResponse, type InboxMarkAllReadResult, type InboxMediaContext, type InboxReplyOptions, type InboxReplyRequest, type InboxReplyResult, type InboxSource, type InboxSyncAccountDetail, type InboxSyncError, type InboxSyncRequest, type InboxSyncResult, type InboxThreadStateRequest, type InboxThreadStatus, type InboxUnreadCountResult, type InboxWebSocketConnectionDetails, type ListAccountsParams, type ListDeliveryJobsParams, type ListLogsParams, type ListManagedUsersParams, type ListPostsParams, type LogCategory, type LogEntry, type LogLevel, type LogSource, type LogStatus, type LogStreamOptions, type LogStreamParams, type ManagedUser, type ManagedUserDetail, type ManagedUserSummary, type MediaUploadRequest, type MediaUploadResponse, NotFoundError, type OAuthConnectResponse, type PaginatedResponse, type Plan, type Platform, type PlatformCredential, PlatformError, type PlatformResult, type Post, type PostAnalyticsItem, type PostPreviewLink, type PostQueueSnapshot, type PostStatus, type Profile, type ProviderError, QuotaError, RateLimitError, type RetryPolicy, type RetryState, type SocialAccount, UniPost, type UniPostClientOptions, UniPostError, type UpdatePostParams, type UpdateProfileParams, type UpdateWebhookParams, type UpdateWorkspaceParams, type Usage, ValidationError, type ValidationIssue, type ValidationResult, type VerifyWebhookOptions, type WebhookEvent, type WebhookEventType, type WebhookSubscription, type WebhookSubscriptionSecret, type Workspace, type XInboxBackfillAccountResult, type XInboxBackfillRequest, type XInboxBackfillResult, type XInboxOutboundStatus, verifyWebhookSignature };
