// Package self-reference exercises the export map and its built dist declarations.
import {
  InvalidResponseError,
  ManagedUserNotFoundError,
  ProfileAccessError,
  ServiceUnavailableError,
  TimeoutError,
  UniPost,
} from "@unipost/sdk";
import type {
  InboxListResponse,
  InboxReplyResult,
  InboxSyncRequest,
  InboxSyncResult,
  InboxWebSocketConnectionDetails,
  ManagedUser,
  ManagedUserDetail,
  ManagedUserSummary,
  PaginatedResponse,
  PlatformResult,
  XInboxBackfillResult,
} from "@unipost/sdk";

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends
    (<Value>() => Value extends Right ? 1 : 2)
    ? true
    : false;
type Assert<Condition extends true> = Condition;

async function declarationConsumer(): Promise<void> {
  const client = new UniPost({
    apiKey: "package_consumer_dummy_key",
    baseUrl: "https://example.test",
  });
  const managed = client.inbox.managedUser("authenticated_user_123");
  const workspace = client.inbox.workspace();

  const legacyListPromise = client.users.list();
  type LegacyListIsExact = Assert<
    Equal<Awaited<typeof legacyListPromise>, PaginatedResponse<ManagedUser>>
  >;
  const scopedListPromise = client.users.list({ profileId: "prof_1", limit: 100 });
  type ScopedListIsExact = Assert<
    Equal<
      Awaited<typeof scopedListPromise>,
      PaginatedResponse<ManagedUserSummary>
    >
  >;
  const legacyUserPromise = client.users.get("user_1");
  type LegacyUserIsExact = Assert<
    Equal<Awaited<typeof legacyUserPromise>, ManagedUser>
  >;
  const scopedUserPromise = client.users.get({
    profileId: "prof_1",
    externalUserId: "user_1",
  });
  type ScopedUserIsExact = Assert<
    Equal<Awaited<typeof scopedUserPromise>, ManagedUserDetail>
  >;

  const platformResult: PlatformResult = {
    social_account_id: "sa_1",
    status: "failed",
    error_code: "platform_publish_failed",
    failure_stage: "publish",
    platform_error_code: "187",
    is_retriable: false,
    next_action: "edit_content",
    error_source: "platform",
    error_temporality: "permanent",
    provider_error: { provider: "twitter", code: "187" },
    retry_policy: {
      is_retriable: false,
      will_retry: false,
      retry_state: "not_retriable",
      manual_retry_allowed: false,
    },
  };
  const errorCode: string | undefined = platformResult.error_code;
  const failureStage: string | undefined = platformResult.failure_stage;
  const platformErrorCode: string | undefined = platformResult.platform_error_code;
  const isRetriable: boolean | undefined = platformResult.is_retriable;
  const nextAction: string | undefined = platformResult.next_action;

  const createdPost = await client.posts.create({ caption: "created" });
  const fetchedPost = await client.posts.get("post_1");
  const listedPosts = await client.posts.list({ status: "failed" });
  const updatedPost = await client.posts.update("post_1", { caption: "updated" });
  const createdResultContract = [
    createdPost.results?.[0]?.error_code,
    createdPost.results?.[0]?.failure_stage,
    createdPost.results?.[0]?.platform_error_code,
    createdPost.results?.[0]?.is_retriable,
    createdPost.results?.[0]?.next_action,
    createdPost.results?.[0]?.error_source,
    createdPost.results?.[0]?.error_temporality,
    createdPost.results?.[0]?.provider_error,
    createdPost.results?.[0]?.retry_policy,
  ];
  const fetchedResultContract = [
    fetchedPost.results?.[0]?.error_code,
    fetchedPost.results?.[0]?.failure_stage,
    fetchedPost.results?.[0]?.platform_error_code,
    fetchedPost.results?.[0]?.is_retriable,
    fetchedPost.results?.[0]?.next_action,
    fetchedPost.results?.[0]?.error_source,
    fetchedPost.results?.[0]?.error_temporality,
    fetchedPost.results?.[0]?.provider_error,
    fetchedPost.results?.[0]?.retry_policy,
  ];
  const listedResultContract = [
    listedPosts.data[0]?.results?.[0]?.error_code,
    listedPosts.data[0]?.results?.[0]?.failure_stage,
    listedPosts.data[0]?.results?.[0]?.platform_error_code,
    listedPosts.data[0]?.results?.[0]?.is_retriable,
    listedPosts.data[0]?.results?.[0]?.next_action,
    listedPosts.data[0]?.results?.[0]?.error_source,
    listedPosts.data[0]?.results?.[0]?.error_temporality,
    listedPosts.data[0]?.results?.[0]?.provider_error,
    listedPosts.data[0]?.results?.[0]?.retry_policy,
  ];
  const updatedResultContract = [
    updatedPost.results?.[0]?.error_code,
    updatedPost.results?.[0]?.failure_stage,
    updatedPost.results?.[0]?.platform_error_code,
    updatedPost.results?.[0]?.is_retriable,
    updatedPost.results?.[0]?.next_action,
    updatedPost.results?.[0]?.error_source,
    updatedPost.results?.[0]?.error_temporality,
    updatedPost.results?.[0]?.provider_error,
    updatedPost.results?.[0]?.retry_policy,
  ];

  const managedPage: InboxListResponse = await managed.list({
    isRead: false,
    isOwn: false,
    limit: 1,
  });
  const workspacePage: InboxListResponse = await workspace.list({ limit: 1 });

  const replyPromise = managed.reply(
    "inbox_123",
    { text: "Thanks" },
    { idempotencyKey: "stable_reply_123" },
  );
  type ReplyResultIsExact = Assert<
    Equal<Awaited<typeof replyPromise>, InboxReplyResult>
  >;
  const reply = await replyPromise;
  if (reply.state === "completed") {
    const itemId: string = reply.item.id;
    void itemId;
  } else {
    const operationId: string = reply.operationId;
    await managed.xOutboundStatus(operationId);
  }

  const ordinaryPromise = managed.sync();
  type OrdinarySyncIsExact = Assert<
    Equal<Awaited<typeof ordinaryPromise>, InboxSyncResult>
  >;
  const ordinary = await ordinaryPromise;
  const backfillRequest: InboxSyncRequest = {
    xBackfill: {
      accountId: "sa_x_123",
      includeReplies: true,
      includeDms: false,
    },
  };
  const backfillPromise = workspace.sync(backfillRequest);
  type BackfillSyncIsExact = Assert<
    Equal<Awaited<typeof backfillPromise>, XInboxBackfillResult>
  >;
  const backfill = await backfillPromise;
  const managedWebSocket: InboxWebSocketConnectionDetails =
    managed.webSocketConnectionDetails();
  const workspaceWebSocket: InboxWebSocketConnectionDetails =
    workspace.webSocketConnectionDetails();

  void [
    managedPage,
    workspacePage,
    ordinary,
    backfill,
    managedWebSocket,
    workspaceWebSocket,
    InvalidResponseError,
    ManagedUserNotFoundError,
    ProfileAccessError,
    ServiceUnavailableError,
    TimeoutError,
    errorCode,
    failureStage,
    platformErrorCode,
    isRetriable,
    nextAction,
    createdResultContract,
    fetchedResultContract,
    listedResultContract,
    updatedResultContract,
  ];
  void (0 as unknown as ReplyResultIsExact);
  void (0 as unknown as OrdinarySyncIsExact);
  void (0 as unknown as BackfillSyncIsExact);
  void (0 as unknown as LegacyListIsExact);
  void (0 as unknown as ScopedListIsExact);
  void (0 as unknown as LegacyUserIsExact);
  void (0 as unknown as ScopedUserIsExact);
}

void declarationConsumer;
