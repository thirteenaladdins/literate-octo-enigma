#!/usr/bin/env node

const { TwitterApi } = require("twitter-api-v2");
const fs = require("fs");
const path = require("path");

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
  const callback =
    process.env.TWITTER_REDIRECT_URL ||
    "http://localhost:3001/api/twitter/oauth2/callback";
  if (!clientId || !clientSecret) return null;
  return new TwitterApi({ clientId, clientSecret });
}

// Step 1: generate the auth link
async function getAuthLink() {
  const client = getOAuth2Client();
  if (!client)
    throw new Error(
      "OAuth2 client not configured (missing TWITTER_CLIENT_ID/SECRET)"
    );
  const { url, codeVerifier, state } = client.generateOAuth2AuthLink(
    process.env.TWITTER_REDIRECT_URL ||
      "http://localhost:3001/api/twitter/oauth2/callback",
    {
      scope: [
        "tweet.read",
        "tweet.write",
        "media.write",
        "users.read",
        "offline.access",
      ],
    }
  );
  // persist verifier/state temporarily
  writeTokens({ pending: { codeVerifier, state } });
  return { url, state };
}

// Step 2: handle callback and store tokens
async function handleCallback(code, stateParam) {
  const client = getOAuth2Client();
  if (!client) throw new Error("OAuth2 client not configured");
  const saved = readTokens();
  if (!saved?.pending) throw new Error("Missing pending verifier/state");
  const { codeVerifier, state } = saved.pending;
  if (state !== stateParam) throw new Error("Invalid OAuth2 state");

  const {
    client: loggedClient,
    accessToken,
    refreshToken,
    expiresIn,
    scope,
  } = await client.loginWithOAuth2({
    code,
    codeVerifier,
    redirectUri:
      process.env.TWITTER_REDIRECT_URL ||
      "http://localhost:3001/api/twitter/oauth2/callback",
  });

  const tokens = {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + expiresIn * 1000,
    scope,
  };
  writeTokens({ tokens });
  return tokens;
}

// Get a read-write client using stored tokens, auto-refresh if needed
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

  try {
    // Try to refresh proactively
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
    // If refresh fails, fall back to current tokens
    return client.readWrite;
  }
}

module.exports = {
  getAuthLink,
  handleCallback,
  getRWClientFromTokens,
  readTokens,
};
