import { UniPost } from "@unipost/sdk";

const client = new UniPost();

async function main() {
  const post = await client.posts.create({
    platformPosts: [
      {
        accountId: "sa_twitter_xxx",
        caption: "Short and punchy for Twitter 🐦",
      },
      {
        accountId: "sa_linkedin_xxx",
        caption:
          "I'm excited to announce that we've shipped UniPost SDK — a unified API client that lets you post to 7 social platforms with a single integration.\n\nThis means less code, fewer bugs, and faster time-to-market for social features.\n\n#DevTools #SocialMedia #API",
      },
      {
        accountId: "sa_bluesky_xxx",
        caption: "Just shipped @unipost/sdk — post to 7 platforms with one API call 🦋",
      },
    ],
  });

  console.log("Multi-platform post created:", post.id);
}

main().catch(console.error);
