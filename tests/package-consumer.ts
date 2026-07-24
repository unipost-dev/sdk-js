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
