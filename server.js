/**
 * Simple Express server for Twitter OAuth2 flow
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const {
  getAuthLink,
  handleCallback,
} = require("./scripts/services/twitterOAuth2");

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for React dev server
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Twitter OAuth server is running" });
});

// Twitter OAuth landing page
app.get("/auth/twitter", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Twitter OAuth2 Authorization</title>
      <style>
        body { font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
        h1 { color: #1DA1F2; }
        .btn { background: #1DA1F2; color: white; border: none; padding: 15px 30px; font-size: 16px; border-radius: 30px; cursor: pointer; }
        .btn:hover { background: #1a8cd8; }
        .info { background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
        .scopes { background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0; }
        code { background: #f5f5f5; padding: 2px 6px; border-radius: 3px; }
      </style>
    </head>
    <body>
      <h1>🐦 Twitter OAuth2 Authorization</h1>
      
      <div class="info">
        <strong>Why re-authorize?</strong>
        <p>We've added <code>media.write</code> permission to enable image uploads with tweets.</p>
      </div>

      <div class="scopes">
        <strong>Permissions requested:</strong>
        <ul>
          <li>✅ Read tweets</li>
          <li>✅ Write tweets</li>
          <li>🆕 Upload media (images)</li>
          <li>✅ Read user info</li>
          <li>✅ Offline access (refresh token)</li>
        </ul>
      </div>

      <button class="btn" onclick="authorize()">Authorize with Twitter</button>
      
      <div id="status" style="margin-top: 20px;"></div>

      <script>
        async function authorize() {
          const status = document.getElementById('status');
          status.textContent = 'Getting authorization URL...';
          
          try {
            const res = await fetch('/api/twitter/oauth2/auth');
            const data = await res.json();
            
            if (data.url) {
              status.textContent = 'Redirecting to Twitter...';
              window.location.href = data.url;
            } else {
              status.textContent = 'Error: No authorization URL returned';
              status.style.color = 'red';
            }
          } catch (error) {
            status.textContent = 'Error: ' + error.message;
            status.style.color = 'red';
          }
        }
      </script>
    </body>
    </html>
  `);
});

// OAuth2 start: returns auth URL to authorize the app
app.get("/api/twitter/oauth2/auth", async (req, res) => {
  try {
    const { url } = await getAuthLink();
    res.json({ url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// OAuth2 callback endpoint
app.get("/api/twitter/oauth2/callback", async (req, res) => {
  console.log("\n📥 OAuth2 callback received");
  const { code, state, error, error_description } = req.query;
  console.log("Query params:", {
    hasCode: !!code,
    hasState: !!state,
    error,
    error_description,
  });

  // Check if Twitter returned an error
  if (error) {
    console.error("Twitter OAuth error:", error, error_description);
    return res.status(400).send(
      `Twitter OAuth error: ${error}<br><br>${error_description || ""}<br><br>
       Please check:<br>
       1. Redirect URI matches exactly in Twitter app settings<br>
       2. App is configured as "Confidential client"<br>
       3. OAuth 2.0 is enabled for your app`
    );
  }

  if (!code) {
    console.error("Missing authorization code in callback");
    return res.status(400).send("Missing authorization code");
  }

  try {
    console.log("Calling handleCallback with code and state...");
    await handleCallback(code, state);
    console.log("✅ OAuth2 callback completed successfully");
    res.send(
      "Twitter OAuth2 success. You can close this tab and return to the app."
    );
  } catch (e) {
    console.error("❌ OAuth2 callback error:", e.message);
    console.error("Full error:", e);
    res.status(500).send(`OAuth2 error: ${e.message}`);
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Twitter OAuth server running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(`   OAuth flow: http://localhost:${PORT}/auth/twitter`);
  console.log("");
});

module.exports = app;
