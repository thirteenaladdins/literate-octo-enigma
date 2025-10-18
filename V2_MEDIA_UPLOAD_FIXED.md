# ✅ V2 Media Upload - Fixed and Working!

## Summary

Successfully migrated from deprecated v1.1 media upload to **Twitter/X v2 media upload API** using OAuth2 authentication.

## What Was Fixed

### 1. **OAuth2 Scopes** ✅
   - Added `media.write` scope to authorization
   - Updated `twitterOAuth2.js` to request: `tweet.read`, `tweet.write`, `media.write`, `users.read`, `offline.access`

### 2. **Direct v2 API Calls** ✅
   - Created `uploadMediaV2()` method that bypasses SDK helpers
   - Uses direct HTTP POST to `https://api.x.com/2/media/upload`
   - Sends multipart/form-data with `axios` and `form-data`

### 3. **Required Parameters** ✅
   - Added `media_category: "tweet_image"` parameter (required by v2 API)
   - Proper multipart/form-data formatting

### 4. **Response Format** ✅
   - v2 API returns different structure: `response.data.data.id`
   - Updated parsing to handle v2 response format

### 5. **Token Management** ✅
   - Fixed bug where old token was used after refresh
   - Now reads token AFTER `getRWClientFromTokens()` completes

## Key Code Changes

### `twitterOAuth2.js`
```javascript
scope: [
  "tweet.read",
  "tweet.write",
  "media.write",  // ← Added
  "users.read",
  "offline.access",
]
```

### `twitterService.js`
```javascript
async uploadMediaV2(imageBuffer) {
  const accessToken = this.oauth2Token;
  
  const formData = new FormData();
  formData.append("media", imageBuffer, {
    filename: "artwork.png",
    contentType: "image/png",
  });
  formData.append("media_category", "tweet_image"); // Required!

  const response = await axios.post(
    "https://api.x.com/2/media/upload",
    formData,
    {
      headers: {
        ...formData.getHeaders(),
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  // v2 returns ID at different path
  const mediaId = response.data.data?.id || response.data.media_id;
  return mediaId;
}
```

## Testing

✅ **Media Upload Test:**
```bash
npm run test:media-upload
```
Result: Media ID successfully returned

✅ **Full Artwork Flow:**
```bash
npm run test:artwork
```
Result: Tweet posted with image attached

## Why v1.1 Failed

- v1.1 endpoint (`upload.twitter.com/1/media/upload.json`) deprecated for free tier as of March 31, 2025
- Returns 403 error: "You currently have access to a subset of X API V2 endpoints"
- OAuth 1.0a upload no longer supported for self-serve tiers

## v2 API Details

| Aspect | Details |
|--------|---------|
| **Endpoint** | `https://api.x.com/2/media/upload` |
| **Method** | POST (multipart/form-data) |
| **Auth** | OAuth 2.0 Bearer token |
| **Required Scope** | `media.write` |
| **Required Param** | `media_category: "tweet_image"` |
| **Response** | `{ data: { id, media_key, ... } }` |

## Dependencies Added

```json
{
  "axios": "^1.x.x",
  "form-data": "^4.x.x"
}
```

## Re-Authorization

If you need to re-authorize (e.g., token expires or needs refresh):

1. Start server: `npm run server`
2. Visit: `http://localhost:3001/auth/twitter`
3. Click "Authorize with Twitter"
4. Done! Token saved to `.twitter-oauth2.json`

## Result

✅ **No more `[media upload unavailable]` placeholder!**
✅ **All tweets now include artwork images**
✅ **Using modern v2 API**
✅ **Future-proof for Twitter's API changes**

---

*Fixed: January 2025*

