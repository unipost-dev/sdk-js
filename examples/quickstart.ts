import { UniPost } from "@unipost/sdk";

// Reads UNIPOST_API_KEY from environment automatically
const client = new UniPost();

async function main() {
  // 1. List connected accounts
  const { data: accounts } = await client.accounts.list();
  console.log(`Found ${accounts.length} connected accounts`);

  if (accounts.length === 0) {
    console.log("Connect an account first at https://app.unipost.dev");
    return;
  }

  // 2. Create a post
  const post = await client.posts.create({
    caption: "Hello from UniPost SDK! 🚀",
    accountIds: accounts.map((a) => a.id),
  });

  console.log(`Post created: ${post.id} (status: ${post.status})`);
}

main().catch(console.error);
