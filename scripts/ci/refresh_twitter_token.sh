#!/usr/bin/env bash

set -euo pipefail

# Required env vars:
# - TWITTER_CLIENT_ID
# - TWITTER_OAUTH2_REFRESH_TOKEN
# Optional:
# - TWITTER_CLIENT_SECRET (for confidential clients)
# - GH_PAT (to persist rotated refresh token back to repo secret)

sudo apt-get update -y >/dev/null
sudo apt-get install -y jq coreutils python3-minimal >/dev/null

if [[ -z "${TWITTER_OAUTH2_REFRESH_TOKEN:-}" || -z "${TWITTER_CLIENT_ID:-}" ]]; then
  echo "Missing TWITTER_OAUTH2_REFRESH_TOKEN or TWITTER_CLIENT_ID" >&2
  exit 1
fi

enc() { python3 -c 'import sys, urllib.parse; print(urllib.parse.quote(sys.argv[1], safe=""))' "$1"; }

RT_ENC="$(enc "$TWITTER_OAUTH2_REFRESH_TOKEN")"
DATA="grant_type=refresh_token&refresh_token=${RT_ENC}&client_id=${TWITTER_CLIENT_ID}"

if [[ -n "${TWITTER_CLIENT_SECRET:-}" ]]; then
  AUTH_B64=$(printf '%s:%s' "$TWITTER_CLIENT_ID" "$TWITTER_CLIENT_SECRET" | base64 -w0 2>/dev/null || printf '%s:%s' "$TWITTER_CLIENT_ID" "$TWITTER_CLIENT_SECRET" | base64 | tr -d '\n')
  RESP=$(curl -sS -X POST 'https://api.twitter.com/2/oauth2/token' \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    -H "Authorization: Basic ${AUTH_B64}" \
    --data "$DATA")
else
  RESP=$(curl -sS -X POST 'https://api.twitter.com/2/oauth2/token' \
    -H 'Content-Type: application/x-www-form-urlencoded' \
    --data "$DATA")
fi

ACCESS_TOKEN=$(jq -r '.access_token // empty' <<<"$RESP")
NEW_REFRESH=$(jq -r '.refresh_token // empty' <<<"$RESP")

if [[ -z "$ACCESS_TOKEN" || "$ACCESS_TOKEN" == "null" ]]; then
  echo "Failed to refresh access token:" >&2
  echo "$RESP" >&2
  exit 1
fi

echo "::add-mask::$ACCESS_TOKEN"
if [[ -n "${NEW_REFRESH:-}" && "$NEW_REFRESH" != "null" ]]; then
  echo "::add-mask::$NEW_REFRESH"
fi

cat > .twitter-oauth2.json <<JSON
{
  "tokens": {
    "accessToken": "$ACCESS_TOKEN",
    "refreshToken": "${NEW_REFRESH:-$TWITTER_OAUTH2_REFRESH_TOKEN}",
    "expiresAt": 0
  }
}
JSON

echo "OAuth2 access token refreshed and written to .twitter-oauth2.json"

# Optionally persist rotated refresh token back to repository secret, if GH_PAT is provided
if [[ -n "${GH_PAT:-}" && -n "${NEW_REFRESH:-}" && "$NEW_REFRESH" != "null" ]]; then
  echo "Updating repository secret TWITTER_OAUTH2_REFRESH_TOKEN via gh CLI"
  if ! command -v gh >/dev/null 2>&1; then
    sudo apt-get update -y >/dev/null
    sudo apt-get install -y gh >/dev/null 2>&1 || true
  fi
  echo "$GH_PAT" | gh auth login --with-token
  gh secret set TWITTER_OAUTH2_REFRESH_TOKEN \
    --repo "$GITHUB_REPOSITORY" \
    --app actions \
    --body "$NEW_REFRESH"
  echo "Repository secret updated"
else
  echo "Skipping secret update (no GH_PAT provided or refresh token not rotated)"
fi


