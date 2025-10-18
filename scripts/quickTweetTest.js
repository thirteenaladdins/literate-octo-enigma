#!/usr/bin/env node

require("dotenv").config();
const { TwitterApi } = require("twitter-api-v2");
const { getRWClientFromTokens } = require("./services/twitterOAuth2");

async function main() {
  try {
    // Try OAuth2 tokens first
    let client = await getRWClientFromTokens();
    if (!client) {
      // Fallback to OAuth1 keys
      if (
        process.env.TWITTER_API_KEY &&
        process.env.TWITTER_API_SECRET &&
        process.env.TWITTER_ACCESS_TOKEN &&
        process.env.TWITTER_ACCESS_TOKEN_SECRET
      ) {
        client = new TwitterApi({
          appKey: process.env.TWITTER_API_KEY,
          appSecret: process.env.TWITTER_API_SECRET,
          accessToken: process.env.TWITTER_ACCESS_TOKEN,
          accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
        }).readWrite;
      } else {
        console.error(
          "No OAuth2 tokens or OAuth1 credentials available. Start OAuth2: GET http://localhost:3001/api/twitter/oauth2/auth"
        );
        process.exit(1);
      }
    }

    const text = `Quick test post ${new Date().toISOString()}`;
    console.log("Attempting to tweet:", text);

    const res = await client.v2.tweet({ text });
    console.log("Tweet posted:", res.data);
    console.log(
      `Tweet URL (approx): https://twitter.com/i/web/status/${res.data.id}`
    );
    process.exit(0);
  } catch (err) {
    console.error("Quick tweet failed:", err?.message || err);
    if (err?.data) console.error("Details:", JSON.stringify(err.data));
    process.exit(1);
  }
}

main();
