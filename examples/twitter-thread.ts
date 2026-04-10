import { UniPost } from "@unipost/sdk";

const client = new UniPost();

async function main() {
  const post = await client.posts.create({
    platformPosts: [
      { accountId: "sa_twitter_xxx", caption: "1/ Introducing UniPost SDK", threadPosition: 1 },
      { accountId: "sa_twitter_xxx", caption: "2/ Post to 7 platforms with one API call", threadPosition: 2 },
      { accountId: "sa_twitter_xxx", caption: "3/ npm install @unipost/sdk — that's it!", threadPosition: 3 },
    ],
  });

  console.log("Thread created:", post.id);
}

main().catch(console.error);
