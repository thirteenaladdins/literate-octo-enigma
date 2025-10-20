#!/usr/bin/env bash
set -euo pipefail

# Required env:
# - TWITTER_CLIENT_ID
# - TWITTER_OAUTH2_REFRESH_TOKEN
# Optional:
# - TWITTER_CLIENT_SECRET  (only if your X app is "confidential")
# - GH_PAT                 (PAT with permission to write repo Actions secrets)
# - GITHUB_REPOSITORY      (owner/repo; Actions sets this automatically)

# --- Deps ---
sudo apt-get update -y >/dev/null
sudo apt-get install -y jq >/dev/null

# --- Helpers ---
strip() { printf '%s' "${1-}" | tr -d '\r\n' | sed 's/^"//; s/"$//'; }
is_json() { jq -e . >/dev/null 2>&1 <<<"$1"; }

# --- Sanitize envs (remove CR/LF and accidental quotes) ---
: "${TWITTER_CLIENT_ID:?Missing TWITTER_CLIENT_ID}"
: "${TWITTER_OAUTH2_REFRESH_TOKEN:?Missing TWITTER_OAUTH2_REFRESH_TOKEN}"

TWITTER_CLIENT_ID="$(strip "$TWITTER_CLIENT_ID")"
TWITTER_CLIENT_SECRET="$(strip "${TWITTER_CLIENT_SECRET-}")"
TWITTER_OAUTH2_REFRESH_TOKEN="$(strip "$TWITTER_OAUTH2_REFRESH_TOKEN")"

# Optional non-leaky debug
echo "Debug: mode=$([[ -n "${TWITTER_CLIENT_SECRET:-}" ]] && echo confidential || echo public)"
echo "Debug: client_id hash: $(printf '%s' "$TWITTER_CLIENT_ID" | sha256sum | cut -c1-10)"
echo "Debug: refresh token length: ${#TWITTER_OAUTH2_REFRESH_TOKEN}"

token_post() {
  local url="$1"
  if [[ -n "${TWITTER_CLIENT_SECRET:-}" ]]; then
    # Confidential: Basic auth AND include client_id (X can require it)
    local auth_b64
    if base64 --help 2>&1 | grep -q -- '-w'; then
      auth_b64="$(printf '%s:%s' "$TWITTER_CLIENT_ID" "$TWITTER_CLIENT_SECRET" | base64 -w0)"
    else
      auth_b64="$(printf '%s:%s' "$TWITTER_CLIENT_ID" "$TWITTER_CLIENT_SECRET" | base64 | tr -d '\n')"
    fi
    curl -sS -X POST "$url" \
      -H 'Content-Type: application/x-www-form-urlencoded' \
      -H "Authorization: Basic ${auth_b64}" \
      --data 'grant_type=refresh_token' \
      --data-urlencode "refresh_token=${TWITTER_OAUTH2_REFRESH_TOKEN}" \
      --data "client_id=${TWITTER_CLIENT_ID}"
  else
    # Public/PKCE
    curl -sS -X POST "$url" \
      -H 'Content-Type: application/x-www-form-urlencoded' \
      --data 'grant_type=refresh_token' \
      --data-urlencode "refresh_token=${TWITTER_OAUTH2_REFRESH_TOKEN}" \
      --data "client_id=${TWITTER_CLIENT_ID}"
  fi
}

# --- Refresh (try twitter.com then x.com) ---
RESP="$(token_post 'https://api.twitter.com/2/oauth2/token' || true)"
if ! is_json "$RESP" || [[ -z "$(jq -r '.access_token // empty' <<<"$RESP")" ]]; then
  ALT_RESP="$(token_post 'https://api.x.com/2/oauth2/token' || true)"
  if is_json "$ALT_RESP" && [[ -n "$(jq -r '.access_token // empty' <<<"$ALT_RESP")" ]]; then
    RESP="$ALT_RESP"
  fi
fi

if ! is_json "$RESP"; then
  echo "Failed to refresh access token: non-JSON response" >&2
  echo "$RESP" >&2
  exit 1
fi

ACCESS_TOKEN="$(jq -r '.access_token // empty' <<<"$RESP")"
NEW_REFRESH="$(jq -r '.refresh_token // empty' <<<"$RESP")"
EXPIRES_IN="$(jq -r '.expires_in // empty' <<<"$RESP")"

if [[ -z "$ACCESS_TOKEN" || "$ACCESS_TOKEN" == "null" ]]; then
  echo "Failed to refresh access token:" >&2
  echo "$RESP" >&2
  exit 1
fi

# Mask sensitive values
echo "::add-mask::$ACCESS_TOKEN"
[[ -n "$NEW_REFRESH" && "$NEW_REFRESH" != "null" ]] && echo "::add-mask::$NEW_REFRESH"

# Compute expiresAt (epoch) with a small buffer
NOW_EPOCH="$(date +%s)"
if [[ -n "$EXPIRES_IN" && "$EXPIRES_IN" != "null" && "$EXPIRES_IN" =~ ^[0-9]+$ ]]; then
  EXPIRES_AT="$(( NOW_EPOCH + EXPIRES_IN - 60 ))"
else
  EXPIRES_AT="0"
fi

# Write JSON safely with jq (proper escaping)
jq -n \
  --arg access "$ACCESS_TOKEN" \
  --arg refresh "${NEW_REFRESH:-$TWITTER_OAUTH2_REFRESH_TOKEN}" \
  --argjson exp "$EXPIRES_AT" \
  '{tokens:{accessToken:$access, refreshToken:$refresh, expiresAt:$exp}}' \
  > .twitter-oauth2.json

echo "OAuth2 access token refreshed -> .twitter-oauth2.json"

# --- Optionally persist rotated refresh token back to repo secret ---
if [[ -n "${GH_PAT-}" && -n "${NEW_REFRESH-}" && "$NEW_REFRESH" != "null" ]]; then
  echo "Updating repository secret TWITTER_OAUTH2_REFRESH_TOKEN via gh CLI"
  if ! command -v gh >/dev/null 2>&1; then
    # Reliable GitHub CLI install
    type -p curl >/dev/null || sudo apt-get install -y curl >/dev/null
    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
      | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg >/dev/null 2>&1
    sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" \
      | sudo tee /etc/apt/sources.list.d/github-cli.list >/dev/null
    sudo apt-get update -y >/dev/null
    sudo apt-get install -y gh >/dev/null
  fi

  if command -v gh >/dev/null 2>&1; then
    echo "$GH_PAT" | gh auth login --with-token
    gh secret set TWITTER_OAUTH2_REFRESH_TOKEN \
      --repo "${GITHUB_REPOSITORY:?GITHUB_REPOSITORY not set}" \
      --app actions \
      --body "$NEW_REFRESH"
    echo "Repository secret updated"

    # --- Self-check: verify the rotated token actually works ---
    echo "Verifying rotated refresh token works (second refresh)..."
    VERIFY_RESP="$(
      TWITTER_OAUTH2_REFRESH_TOKEN="$NEW_REFRESH" \
      TWITTER_CLIENT_ID="$TWITTER_CLIENT_ID" \
      TWITTER_CLIENT_SECRET="${TWITTER_CLIENT_SECRET:-}" \
      bash -c '
        is_json(){ jq -e . >/dev/null 2>&1 <<<"$1"; }
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
              --data-urlencode "refresh_token=${TWITTER_OAUTH2_REFRESH_TOKEN}" \
              --data "client_id=${TWITTER_CLIENT_ID}"
          else
            curl -sS -X POST "$url" \
              -H "Content-Type: application/x-www-form-urlencoded" \
              --data "grant_type=refresh_token" \
              --data-urlencode "refresh_token=${TWITTER_OAUTH2_REFRESH_TOKEN}" \
              --data "client_id=${TWITTER_CLIENT_ID}"
          fi
        }
        R="$(post "https://api.twitter.com/2/oauth2/token" || true)"
        if ! is_json "$R" || [[ -z "$(jq -r ".access_token // empty" <<<"$R")" ]]; then
          ALT="$(post "https://api.x.com/2/oauth2/token" || true)"
          if is_json "$ALT" && [[ -n "$(jq -r ".access_token // empty" <<<"$ALT")" ]]; then
            R="$ALT"
          fi
        fi
        printf "%s" "$R"
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
    echo "gh CLI not available; skipping secret update." >&2
  fi
else
  echo "Skipping secret update (no GH_PAT provided or refresh token not rotated)"
fi
