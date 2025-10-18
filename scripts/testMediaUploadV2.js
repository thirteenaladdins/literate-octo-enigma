#!/usr/bin/env node

/**
 * Test script to verify v2 media upload works with OAuth2
 */

require("dotenv").config();
const TwitterService = require("./services/twitterService");
const { readTokens } = require("./services/twitterOAuth2");

async function testMediaUploadV2() {
  console.log("\n🧪 Testing Twitter v2 Media Upload\n");

  // Check for OAuth2 tokens
  const tokens = readTokens();
  if (!tokens?.tokens) {
    console.error("❌ No OAuth2 tokens found!");
    console.error(
      "   Please authorize first: http://localhost:3001/auth/twitter"
    );
    process.exit(1);
  }

  console.log("✅ OAuth2 tokens found");
  console.log(
    `   Access token: ${tokens.tokens.accessToken.substring(0, 30)}...`
  );
  console.log(`   Token length: ${tokens.tokens.accessToken.length} chars`);

  if (tokens.tokens.scope) {
    console.log(`   Scopes: ${tokens.tokens.scope.join(", ")}`);
    if (!tokens.tokens.scope.includes("media.write")) {
      console.warn("\n⚠️  WARNING: media.write scope not found!");
      console.warn("   You need to re-authorize with updated scopes.");
      console.warn("   Visit: http://localhost:3001/auth/twitter\n");
    } else {
      console.log("✅ media.write scope present");
    }
  } else {
    console.log("ℹ️  Scope information not stored in token file");
    console.log("   This is normal - scopes are validated on Twitter's side");
  }

  // Create a test image (simple 1x1 PNG)
  const testImageBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );

  console.log("\n📤 Attempting to upload test image...");

  const twitterService = new TwitterService();

  try {
    await twitterService.ensureClient();
    console.log("✅ Twitter client initialized");

    if (twitterService.oauth2Token) {
      console.log(`✅ OAuth2 token extracted for direct API call`);
      console.log(
        `   Token preview: ${twitterService.oauth2Token.substring(0, 30)}...`
      );
    } else {
      console.log("⚠️  No OAuth2 token found - may fall back to OAuth1");
    }

    const mediaId = await twitterService.uploadMediaV2(testImageBuffer);
    console.log(`\n✅ Media uploaded successfully!`);
    console.log(`   Media ID: ${mediaId}`);

    console.log("\n✨ Success! v2 media upload is working correctly.\n");
    console.log(
      "You can now use 'npm run test:artwork' with dryRun=false to post with images.\n"
    );
  } catch (error) {
    console.error("\n❌ Media upload failed:");
    console.error(`   Error: ${error.message}`);

    if (error.response?.data) {
      console.error("\n📋 API Error Details:");
      console.error(JSON.stringify(error.response.data, null, 2));

      if (error.response.data.title === "Unauthorized") {
        console.error("\n🔑 Authentication Issue:");
        console.error("   Your token may not have media.write permission.");
        console.error("   Please re-authorize with updated scopes.");
      }
    }

    if (error.response?.status) {
      console.error(`   HTTP Status: ${error.response.status}`);
    }

    console.error("\n💡 Troubleshooting:");
    console.error("   1. Re-authorize with media.write scope:");
    console.error("      → Visit: http://localhost:3001/auth/twitter");
    console.error("   2. Check your Twitter API tier supports v2 media upload");
    console.error(
      "   3. Verify TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET in .env"
    );
    console.error("   4. Try deleting .twitter-oauth2.json and re-authorize\n");

    process.exit(1);
  }
}

// Run the test
testMediaUploadV2().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
