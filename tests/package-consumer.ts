// Package self-reference exercises the export map and its built dist declarations.
import { UniPost } from "@unipost/sdk";
import type {
  InboxListResponse,
  InboxReplyResult,
  InboxSyncRequest,
  InboxSyncResult,
  InboxWebSocketConnectionDetails,
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
  ];
  void (0 as unknown as ReplyResultIsExact);
  void (0 as unknown as OrdinarySyncIsExact);
  void (0 as unknown as BackfillSyncIsExact);
}

void declarationConsumer;
