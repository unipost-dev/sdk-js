interface HttpClientOptions {
    apiKey: string;
    baseUrl: string;
    timeout: number;
}
declare class HttpClient {
    private readonly apiKey;
    private readonly baseUrl;
    private readonly timeout;
    constructor(options: HttpClientOptions);
    request<T>(method: string, path: string, options?: {
        body?: unknown;
        query?: Record<string, string | number | boolean | undefined | null>;
        headers?: Record<string, string>;
    }): Promise<T>;
    get<T>(path: string, query?: Record<string, string | number | boolean | undefined | null>): Promise<T>;
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
    external_user_id?: string;
    external_user_email?: string;
    status: AccountStatus;
    connection_type?: ConnectionType;
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
}
interface ManagedUser {
    external_user_id: string;
    external_user_email?: string;
    account_count?: number;
    platform_counts?: Record<string, number>;
    reconnect_count?: number;
}
interface MediaUploadRequest {
    filename: string;
    contentType: string;
    sizeBytes: number;
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

declare class Media {
    private readonly http;
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
}

declare class Connect {
    private readonly http;
    constructor(http: HttpClient);
    /** Create a Connect session for end-user OAuth. */
    createSession(params: CreateConnectSessionParams): Promise<ConnectSession>;
    /** Get the status of a Connect session. */
    getSession(sessionId: string): Promise<ConnectSession>;
}

declare class Users {
    private readonly http;
    constructor(http: HttpClient);
    /** List all managed users. */
    list(): Promise<PaginatedResponse<ManagedUser>>;
    /** Get a single managed user by external_user_id. */
    get(externalUserId: string): Promise<ManagedUser>;
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
    constructor(options?: UniPostClientOptions);
}

/**
 * Base error class for all UniPost API errors.
 */
declare class UniPostError extends Error {
    readonly status: number;
    readonly code: string;
    constructor(message: string, status: number, code: string);
}
/** 401 - API key invalid or expired. */
declare class AuthError extends UniPostError {
    constructor(message?: string);
}
/** 404 - Resource not found. */
declare class NotFoundError extends UniPostError {
    constructor(message?: string);
}
/** 422 - Validation error. */
declare class ValidationError extends UniPostError {
    readonly errors: Record<string, string[]>;
    constructor(message?: string, errors?: Record<string, string[]>);
}
/** 429 - Rate limit exceeded. */
declare class RateLimitError extends UniPostError {
    readonly retryAfter: number;
    constructor(retryAfter: number, message?: string);
}
/** Platform-side error (e.g. Twitter rejected the post). */
declare class PlatformError extends UniPostError {
    readonly platform: string;
    constructor(message: string, platform: string);
}
/** Monthly quota exceeded. */
declare class QuotaError extends UniPostError {
    constructor(message?: string);
}

/**
 * Verify the signature of a UniPost webhook request.
 *
 * Uses HMAC-SHA256 with the webhook secret. The signature value may
 * optionally be prefixed with `sha256=` (case-insensitive).
 */
declare function verifyWebhookSignature(options: VerifyWebhookOptions): Promise<boolean>;

export { type AccountHealth, type AccountStatus, type AnalyticsQueryParams, type AnalyticsRollup, type AnalyticsRollupParams, type ApiKey, type ApiKeyEnvironment, AuthError, type BulkPostError, type BulkPostResult, type ConnectAccountParams, type ConnectSession, type ConnectionType, type CreateApiKeyParams, type CreateConnectSessionParams, type CreatePlatformCredentialParams, type CreatePostParams, type CreatePostPlatformPost, type CreateProfileParams, type CreateWebhookParams, type CreatedApiKey, type DeliveryJob, type Granularity, type GroupBy, type ListAccountsParams, type ListDeliveryJobsParams, type ListPostsParams, type ManagedUser, type MediaUploadRequest, type MediaUploadResponse, NotFoundError, type OAuthConnectResponse, type PaginatedResponse, type Plan, type Platform, type PlatformCredential, PlatformError, type PlatformResult, type Post, type PostAnalyticsItem, type PostPreviewLink, type PostQueueSnapshot, type PostStatus, type Profile, QuotaError, RateLimitError, type SocialAccount, UniPost, type UniPostClientOptions, UniPostError, type UpdatePostParams, type UpdateProfileParams, type UpdateWebhookParams, type UpdateWorkspaceParams, type Usage, ValidationError, type ValidationIssue, type ValidationResult, type VerifyWebhookOptions, type WebhookEvent, type WebhookEventType, type WebhookSubscription, type WebhookSubscriptionSecret, type Workspace, verifyWebhookSignature };
