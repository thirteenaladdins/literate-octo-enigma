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

# Use curl's --data-urlencode for refresh_token to avoid encoding issues
# Sanitize envs to avoid stray quotes/newlines
TWITTER_CLIENT_ID="$(printf '%s' "${TWITTER_CLIENT_ID:-}" | tr -d '\r' | sed 's/^"//; s/"$//')"
TWITTER_CLIENT_SECRET="$(printf '%s' "${TWITTER_CLIENT_SECRET:-}" | tr -d '\r' | sed 's/^"//; s/"$//')"
TWITTER_OAUTH2_REFRESH_TOKEN="$(printf '%s' "${TWITTER_OAUTH2_REFRESH_TOKEN:-}" | tr -d '\r' | sed 's/^"//; s/"$//')"

token_post() {
  local URL="$1"
  if [[ -n "${TWITTER_CLIENT_SECRET:-}" ]]; then
    # Confidential client: use Basic auth; do NOT include client_id in body
    local AUTH_B64
    AUTH_B64=$(printf '%s:%s' "$TWITTER_CLIENT_ID" "$TWITTER_CLIENT_SECRET" | base64 -w0 2>/dev/null || printf '%s:%s' "$TWITTER_CLIENT_ID" "$TWITTER_CLIENT_SECRET" | base64 | tr -d '\n')
    curl -sS -X POST "$URL" \
      -H 'Content-Type: application/x-www-form-urlencoded' \
      -H "Authorization: Basic ${AUTH_B64}" \
      --data 'grant_type=refresh_token' \
      --data-urlencode "refresh_token=${TWITTER_OAUTH2_REFRESH_TOKEN}"
  else
    # PKCE/public: no secret; include client_id
    curl -sS -X POST "$URL" \
      -H 'Content-Type: application/x-www-form-urlencoded' \
      --data 'grant_type=refresh_token' \
      --data-urlencode "refresh_token=${TWITTER_OAUTH2_REFRESH_TOKEN}" \
      --data "client_id=${TWITTER_CLIENT_ID}"
  fi
}

# Try twitter.com first, then x.com
RESP="$(token_post 'https://api.twitter.com/2/oauth2/token' || true)"
if jq -e '.error' >/dev/null 2>&1 <<<"$RESP"; then
  ALT_RESP="$(token_post 'https://api.x.com/2/oauth2/token' || true)"
  # Use ALT if it produced an access_token
  if [[ -n "$(jq -r '.access_token // empty' <<<"$ALT_RESP")" ]]; then
    RESP="$ALT_RESP"
  fi
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

  # --- Self-check: verify the secret we just stored actually works ---
  echo "Verifying rotated refresh token works (second refresh)..."
  VERIFY_RESP="$(
    TWITTER_OAUTH2_REFRESH_TOKEN="$NEW_REFRESH" \
    TWITTER_CLIENT_ID="$TWITTER_CLIENT_ID" \
    TWITTER_CLIENT_SECRET="${TWITTER_CLIENT_SECRET:-}" \
    bash -c '
      post() {
        local url="$1"
        if [[ -n "${TWITTER_CLIENT_SECRET:-}" ]]; then
          local auth_b64
          if base64 --help 2>&1 | grep -q -- "-w"; then
            auth_b64="$(printf "%s:%s" "$TWITTER_CLIENT_ID" "$TWITTER_CLIENT_SECRET" | base64 -w0)"
          else
            auth_b64="$(printf "%s:%s" "$TWITTER_CLIENT_ID" "$TWITTER_CLIENT_SECRET" | base64 | tr -d "\n")"
          fi
          curl -sS -X POST "$url" \
            -H "Content-Type: application/x-www-form-urlencoded" \
            -H "Authorization: Basic ${auth_b64}" \
            --data "grant_type=refresh_token" \
            --data-urlencode "refresh_token=${TWITTER_OAUTH2_REFRESH_TOKEN}"
        else
          curl -sS -X POST "$url" \
            -H "Content-Type: application/x-www-form-urlencoded" \
            --data "grant_type=refresh_token" \
            --data-urlencode "refresh_token=${TWITTER_OAUTH2_REFRESH_TOKEN}" \
            --data "client_id=${TWITTER_CLIENT_ID}"
        fi
      }
      RESP="$(post "https://api.twitter.com/2/oauth2/token" || true)"
      if ! jq -e . >/dev/null 2>&1 <<<"$RESP" || [[ -z "$(jq -r ".access_token // empty" <<<"$RESP")" ]]; then
        ALT="$(post "https://api.x.com/2/oauth2/token" || true)"
        if jq -e . >/dev/null 2>&1 <<<"$ALT" && [[ -n "$(jq -r ".access_token // empty" <<<"$ALT")" ]]; then
          RESP="$ALT"
        fi
      fi
      printf "%s" "$RESP"
    '
  )"

  if jq -e '.access_token // empty' >/dev/null 2>&1 <<<"$VERIFY_RESP"; then
    echo "Verification succeeded: rotated refresh token is valid and stored."
  else
    echo "WARNING: verification refresh failed. Response:" >&2
    echo "$VERIFY_RESP" >&2
    echo "The secret may not have been updated or the PAT lacks scopes." >&2
    exit 1
  fi
else
  echo "Skipping secret update (no GH_PAT provided or refresh token not rotated)"
fi


