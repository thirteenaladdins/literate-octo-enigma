#!/usr/bin/env node

const { TwitterApi } = require("twitter-api-v2");
const { getRWClientFromTokens, readTokens } = require("./twitterOAuth2");
const FormData = require("form-data");
const axios = require("axios");

/**
 * Twitter Service
 * Posts artworks to Twitter
 */
class TwitterService {
  constructor(credentials) {
    this.credentials = credentials || null;
    this.client = null;
    this.rwClient = null;
    this.oauth2Token = null;
  }

  /**
   * Post artwork to Twitter
   * @param {Object} params - Post parameters
   * @param {Buffer} params.imageBuffer - Image data
   * @param {string} params.title - Artwork title
   * @param {string} params.portfolioUrl - Link to portfolio
   * @param {string} params.artworkId - Artwork ID for URL fragment
   * @returns {Promise<string>} Tweet URL
   */
  async ensureClient() {
    // Prefer OAuth2 tokens if available
    const oauth2Client = await getRWClientFromTokens();
    if (oauth2Client) {
      this.rwClient = oauth2Client;
      // Read tokens AFTER refresh to get the current token
      const tokens = readTokens();
      this.oauth2Token = tokens?.tokens?.accessToken;
      return;
    }
    // Fallback to OAuth1 if credentials provided
    if (
      this.credentials &&
      this.credentials.appKey &&
      this.credentials.appSecret &&
      this.credentials.accessToken &&
      this.credentials.accessSecret
    ) {
      this.client = new TwitterApi({
        appKey: this.credentials.appKey,
        appSecret: this.credentials.appSecret,
        accessToken: this.credentials.accessToken,
        accessSecret: this.credentials.accessSecret,
      });
      this.rwClient = this.client.readWrite;
      return;
    }
    throw new Error(
      "No Twitter credentials available (OAuth2 tokens or OAuth1 keys)"
    );
  }

  async postArtwork({ imageBuffer, title, portfolioUrl, artworkId }) {
    try {
      await this.ensureClient();
      // Quick sanity check: confirm token is valid for user context
      try {
        const me = await this.rwClient.v2.me();
        if (me?.data?.username) {
          console.log(`Authenticated as @${me.data.username}`);
        }
      } catch (e) {
        console.warn("Warning: token validation (v2.me) failed before upload:", e.message);
      }
      console.log("Uploading image to Twitter v2 media endpoint...");

      let mediaId;
      // Use v2 media upload endpoint directly (with host fallback)
      try {
        mediaId = await this.uploadMediaV2(imageBuffer);
      } catch (uploadErr) {
        console.error("Media upload failed:", uploadErr?.message || uploadErr);
        if (uploadErr?.response?.data) {
          console.error(
            "Media upload error details:",
            JSON.stringify(uploadErr.response.data, null, 2)
          );
        }
        // Try alternate host once if first attempt failed
        try {
          console.log("Retrying media upload via alternate host...");
          mediaId = await this.uploadMediaV2(imageBuffer, { preferXHost: true });
        } catch (retryErr) {
          console.error("Alternate host upload also failed:", retryErr?.message || retryErr);
          if (retryErr?.response?.data) {
            console.error(
              "Alt host error details:",
              JSON.stringify(retryErr.response.data, null, 2)
            );
          }
          // As a last resort, post text-only to avoid failing the whole run
          const tweetTextFallback =
            this.composeTweet(title, portfolioUrl, artworkId) +
            "\n\n[media upload unavailable]";
          const tweet = await this.rwClient.v2.tweet({ text: tweetTextFallback });
          const tweetId = tweet.data.id;
          const tweetUrl = `https://twitter.com/i/web/status/${tweetId}`;
          console.log(`Tweet posted without media: ${tweetUrl}`);
          return tweetUrl;
        }
      }

      if (!mediaId) {
        throw new Error("No media_id returned from upload endpoint");
      }

      console.log(`Image uploaded successfully. Media ID: ${mediaId}`);

      // Compose the tweet text
      const tweetText = this.composeTweet(title, portfolioUrl, artworkId);

      console.log("Posting tweet...");

      // Post the tweet with the image
      const tweet = await this.rwClient.v2.tweet({
        text: tweetText,
        media: { media_ids: [mediaId] },
      });

      const tweetId = tweet.data.id;
      const tweetUrl = `https://twitter.com/user/status/${tweetId}`;

      console.log(`Tweet posted successfully: ${tweetUrl}`);

      return tweetUrl;
    } catch (error) {
      console.error("Error posting to Twitter:", error.message);
      if (error.data) {
        console.error("Twitter API error details:", JSON.stringify(error.data));
      }
      throw error;
    }
  }

  /**
   * Upload media using v2 API endpoint with direct HTTP call
   * @param {Buffer} imageBuffer - Image data
   * @returns {Promise<string>} Media ID
   */
  async uploadMediaV2(imageBuffer, { preferXHost = false } = {}) {
    // Use the OAuth2 token stored during ensureClient
    const accessToken = this.oauth2Token;

    if (!accessToken) {
      throw new Error(
        "No OAuth2 access token available for media upload. " +
          "Please re-authorize at http://localhost:3001/auth/twitter"
      );
    }

    console.log("📤 Uploading to v2 endpoint with OAuth2 token...");

    // Create form data
    const formData = new FormData();
    formData.append("media", imageBuffer, {
      filename: "artwork.png",
      contentType: "image/png",
    });
    // v2 endpoint requires media_category parameter
    formData.append("media_category", "tweet_image");

    // Upload to v2 endpoint directly (try twitter.com, optionally x.com)
    const host = preferXHost ? "api.x.com" : "api.twitter.com";
    const response = await axios.post(
      `https://${host}/2/media/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // v2 API returns media ID in response.data.data.id
    const mediaId =
      response.data.data?.id ||
      response.data.data?.media_id ||
      response.data.media_id ||
      response.data.media_id_string;

    if (!mediaId) {
      console.error("Upload response:", JSON.stringify(response.data, null, 2));
      throw new Error("No media_id in upload response");
    }

    return mediaId;
  }

  /**
   * Compose tweet text
   * @param {string} title - Artwork title
   * @param {string} portfolioUrl - Portfolio URL
   * @param {string} artworkId - Artwork ID
   * @returns {string} Tweet text
   */
  composeTweet(title, portfolioUrl, artworkId) {
    const base = (portfolioUrl || "").replace(/\/$/, "");
    const url = artworkId ? `${base}/${artworkId}` : base;

    // Twitter limit is 280 chars, leave room for URL
    const maxTitleLength = 240;
    const truncatedTitle =
      title.length > maxTitleLength
        ? title.substring(0, maxTitleLength - 3) + "..."
        : title;

    return `${truncatedTitle}\n\n${url}`;
  }

  /**
   * Test Twitter connection
   * @returns {Promise<boolean>} True if connection successful
   */
  async testConnection() {
    try {
      const user = await this.rwClient.v2.me();
      console.log(
        `Twitter connection successful. Authenticated as: @${user.data.username}`
      );
      return true;
    } catch (error) {
      console.error("Twitter connection test failed:", error.message);
      return false;
    }
  }
}

module.exports = TwitterService;
