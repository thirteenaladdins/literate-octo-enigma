#!/usr/bin/env node

/**
 * Diagnostic script to check Twitter OAuth 2.0 configuration
 */

require("dotenv").config();
const axios = require("axios");

async function diagnose() {
  console.log("🔍 Twitter OAuth 2.0 Diagnostic\n");
  console.log("=".repeat(60));

  // 1. Check environment variables
  console.log("\n1. Checking environment variables...");
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;
  
  if (!clientId) {
    console.error("❌ TWITTER_CLIENT_ID is missing");
    process.exit(1);
  } else {
    console.log("✅ TWITTER_CLIENT_ID:", clientId.substring(0, 15) + "...");
    console.log("   Full:", clientId);
  }

  if (!clientSecret) {
    console.error("❌ TWITTER_CLIENT_SECRET is missing");
    process.exit(1);
  } else {
    console.log("✅ TWITTER_CLIENT_SECRET:", clientSecret.substring(0, 10) + "...");
  }

  // 2. Test client credentials with a token request (this will fail but gives us info)
  console.log("\n2. Testing client credentials...");
  const redirectUri = "http://localhost:3001/api/twitter/oauth2/callback";
  
  // Try to make a token request with invalid code (should give us a specific error about credentials)
  const authB64 = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  
  try {
    const resp = await axios.post(
      "https://api.twitter.com/2/oauth2/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        code: "invalid_test_code",
        redirect_uri: redirectUri,
        client_id: clientId,
      }).toString(),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${authB64}`,
        },
        validateStatus: () => true, // Don't throw on error
      }
    );

    console.log("   Status:", resp.status);
    if (resp.data?.error) {
      const error = resp.data.error;
      const desc = resp.data.error_description;
      
      if (error === "invalid_client") {
        console.error("❌ Invalid client credentials - Client ID/Secret mismatch");
      } else if (error === "invalid_grant") {
        console.log("✅ Client credentials are valid (expected error for invalid code)");
      } else {
        console.log("   Error:", error);
        console.log("   Description:", desc);
      }
    }
  } catch (err) {
    console.error("   Error testing credentials:", err.message);
  }

  // 3. Test authorization URL
  console.log("\n3. Testing authorization URL format...");
  const testUrl = new URL("https://twitter.com/i/oauth2/authorize");
  testUrl.searchParams.set("response_type", "code");
  testUrl.searchParams.set("client_id", clientId);
  testUrl.searchParams.set("redirect_uri", redirectUri);
  testUrl.searchParams.set("scope", "tweet.read tweet.write users.read offline.access");
  testUrl.searchParams.set("state", "test_state");

  console.log("   Authorization URL:", testUrl.toString());

  // 4. Check redirect URI format
  console.log("\n4. Verifying redirect URI format...");
  console.log("   Redirect URI:", redirectUri);
  console.log("   ✓ Must match exactly in Twitter Developer Portal");
  console.log("   ✓ No trailing slash");
  console.log("   ✓ Exact port number");

  // 5. Recommendations
  console.log("\n5. Recommendations:");
  console.log("   • Go to: https://developer.twitter.com/en/portal/dashboard");
  console.log("   • Open your app settings");
  console.log("   • Verify OAuth 2.0 is enabled");
  console.log("   • Check Callback URI matches:", redirectUri);
  console.log("   • Verify app type is 'Confidential client'");
  console.log("   • Check if app status is 'Active' (not suspended)");
  console.log("\n   If app was working before:");
  console.log("   • Check Twitter Developer status page");
  console.log("   • Try regenerating Client ID/Secret in portal");
  console.log("   • Check for any emails from Twitter/X about app changes");

  console.log("\n" + "=".repeat(60));
}

diagnose().catch((err) => {
  console.error("Diagnostic failed:", err.message);
  process.exit(1);
});

