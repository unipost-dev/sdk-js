import { UniPost } from "@unipost/sdk";

const client = new UniPost();

async function main() {
  // 1. Create a Connect session for your end user
  const session = await client.connect.createSession({
    platform: "twitter",
    externalUserId: "your_user_123",
    externalUserEmail: "user@example.com",
    returnUrl: "https://yourapp.com/settings/connected",
  });

  console.log("Send this URL to your user:", session.url);
  console.log("Session expires at:", session.expires_at);

  // 2. After they connect, list their accounts
  const userAccounts = await client.accounts.list({
    externalUserId: "your_user_123",
  });

  console.log(`User has ${userAccounts.data.length} connected accounts`);

  // 3. Post on their behalf
  if (userAccounts.data.length > 0) {
    const post = await client.posts.create({
      caption: "Posted via UniPost Connect!",
      accountIds: [userAccounts.data[0].id],
    });
    console.log("Post created:", post.id);
  }
}

main().catch(console.error);
