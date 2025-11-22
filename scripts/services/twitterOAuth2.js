#!/usr/bin/env node

const { TwitterApi } = require("twitter-api-v2");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const crypto = require("crypto");

const TOKENS_PATH = path.join(process.cwd(), ".twitter-oauth2.json");

function readTokens() {
  try {
    const raw = fs.readFileSync(TOKENS_PATH, "utf8");
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

function writeTokens(tokens) {
  fs.writeFileSync(TOKENS_PATH, JSON.stringify(tokens, null, 2));
}

function getOAuth2Client() {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;
  const callback = (
    process.env.TWITTER_REDIRECT_URL ||
    "http://localhost:3001/api/twitter/oauth2/callback"
  ).trim();
  if (!clientId || !clientSecret) return null;
  return new TwitterApi({ clientId, clientSecret });
}

// Generate PKCE code verifier and challenge
function generatePKCE() {
  // Generate code_verifier: random 32-byte string, base64url encoded
  const codeVerifier = crypto
    .randomBytes(32)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  // Generate code_challenge: SHA256 hash of verifier, base64url encoded
  const codeChallenge = crypto
    .createHash("sha256")
    .update(codeVerifier)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");

  return { codeVerifier, codeChallenge };
}

// Step 1: generate the auth link (with PKCE - now required by Twitter)
async function getAuthLink() {
  const client = getOAuth2Client();
  if (!client)
    throw new Error(
      "OAuth2 client not configured (missing TWITTER_CLIENT_ID/SECRET)"
    );

  const redirectUri = (
    process.env.TWITTER_REDIRECT_URL ||
    "http://localhost:3001/api/twitter/oauth2/callback"
  ).trim();

  // All required scopes including media.write for image uploads
  const scopeArray = [
    "tweet.read",
    "tweet.write",
    "media.write", // Required for image uploads with tweets
    "users.read",
    "offline.access",
  ];

  // OAuth 2.0 standard: space-separated scopes
  const scope = scopeArray.join(" ");

  // Generate PKCE parameters
  const { codeVerifier, codeChallenge } = generatePKCE();
  const state = `state_${Math.random().toString(36).slice(2, 10)}`;

  console.log("🔐 Generated PKCE code verifier and challenge");

  // Manually construct URL params to ensure proper encoding
  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.TWITTER_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: scope, // Space-separated scopes (will be encoded as %20)
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  // Try x.com directly (Twitter/X now uses this domain)
  const url = `https://x.com/i/oauth2/authorize?${params.toString()}`;

  const clientId = process.env.TWITTER_CLIENT_ID;
  console.log("🔗 Generated OAuth authorization URL with PKCE");
  console.log("  Redirect URI:", redirectUri);
  console.log(
    "  Client ID:",
    clientId ? `${clientId.substring(0, 15)}...` : "MISSING"
  );
  console.log("  Code challenge method: S256");

  // Store state and code_verifier (needed for token exchange)
  writeTokens({ pending: { state, codeVerifier } });
  return { url, state };
}

// Step 2: handle callback and store tokens (with PKCE)
async function handleCallback(code, stateParam) {
  console.log("🔄 handleCallback called");
  const baseClient = getOAuth2Client();
  if (!baseClient) throw new Error("OAuth2 client not configured");
  const saved = readTokens();
  if (!saved?.pending) throw new Error("Missing pending state");
  const { state, codeVerifier } = saved.pending;

  if (!codeVerifier) {
    throw new Error("Missing code_verifier - PKCE is required");
  }

  console.log("State comparison:", { saved: state, received: stateParam });
  if (state !== stateParam) throw new Error("Invalid OAuth2 state");
  console.log("✅ State validation passed");
  console.log("🔐 Using PKCE code_verifier for token exchange");

  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;
  const redirectUri = (
    process.env.TWITTER_REDIRECT_URL ||
    "http://localhost:3001/api/twitter/oauth2/callback"
  ).trim();

  const authB64 = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const body = new URLSearchParams();
  body.set("grant_type", "authorization_code");
  body.set("code", code);
  body.set("redirect_uri", redirectUri);
  body.set("client_id", clientId);
  body.set("code_verifier", codeVerifier); // PKCE code verifier

  // Try twitter.com then x.com as a fallback
  const tokenEndpoints = [
    "https://api.twitter.com/2/oauth2/token",
    "https://api.x.com/2/oauth2/token",
  ];

  let respData = null;
  let lastError = null;

  for (const endpoint of tokenEndpoints) {
    try {
      const resp = await axios.post(endpoint, body.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${authB64}`,
        },
        timeout: 15000,
        validateStatus: () => true,
      });

      // Log response for debugging
      console.log(`Token exchange attempt at ${endpoint}:`, {
        status: resp.status,
        hasAccessToken: !!resp?.data?.access_token,
        error: resp?.data?.error,
        errorDescription: resp?.data?.error_description,
      });

      if (resp?.data?.access_token) {
        respData = resp.data;
        break;
      } else if (resp?.data?.error) {
        // Store error for better error message
        lastError = {
          error: resp.data.error,
          error_description: resp.data.error_description,
          endpoint,
        };
      }
    } catch (err) {
      console.error(`Token exchange error at ${endpoint}:`, err.message);
      lastError = { error: err.message, endpoint };
    }
  }

  if (!respData?.access_token) {
    const errorMsg = lastError
      ? `Failed to exchange authorization code: ${lastError.error} - ${
          lastError.error_description || ""
        } (endpoint: ${lastError.endpoint})`
      : "Failed to exchange authorization code for tokens. No access token in response.";
    throw new Error(errorMsg);
  }

  const accessToken = respData.access_token;
  const refreshToken = respData.refresh_token;
  const expiresIn = respData.expires_in || 0;
  const scope = respData.scope || "";

  const tokens = {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + Number(expiresIn) * 1000,
    scope,
  };
  writeTokens({ tokens });
  return tokens;
}

// Get a read-write client using stored tokens
async function getRWClientFromTokens() {
  const base = getOAuth2Client();
  if (!base) return null;
  const saved = readTokens();
  if (!saved?.tokens) return null;

  const { accessToken, refreshToken } = saved.tokens;
  const client = new TwitterApi({
    clientId: process.env.TWITTER_CLIENT_ID,
    clientSecret: process.env.TWITTER_CLIENT_SECRET,
    accessToken,
    refreshToken,
  });

  // Avoid local refresh by default; CI handles rotation.
  const allowLocalRefresh =
    String(process.env.OAUTH2_ALLOW_LOCAL_REFRESH || "").toLowerCase() ===
    "true";

  if (!allowLocalRefresh) {
    return client.readWrite;
  }

  try {
    const {
      client: refreshedClient,
      accessToken: at,
      refreshToken: rt,
      expiresIn,
    } = await client.refreshOAuth2Token(refreshToken);
    writeTokens({
      tokens: {
        accessToken: at,
        refreshToken: rt,
        expiresAt: Date.now() + expiresIn * 1000,
      },
    });
    return refreshedClient.readWrite;
  } catch (_) {
    return client.readWrite;
  }
}

module.exports = {
  getAuthLink,
  handleCallback,
  getRWClientFromTokens,
  readTokens,
};
