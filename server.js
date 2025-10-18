/**
 * Simple Express server for triggering artwork generation from the UI
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { runArtworkGeneration } = require("./scripts/testArtworkFlow");
const {
  getAuthLink,
  handleCallback,
  readTokens,
} = require("./scripts/services/twitterOAuth2");

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for React dev server
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Artwork API is running" });
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
  const { code, state } = req.query;
  try {
    await handleCallback(code, state);
    res.send(
      "Twitter OAuth2 success. You can close this tab and return to the app."
    );
  } catch (e) {
    res.status(500).send(`OAuth2 error: ${e.message}`);
  }
});

// Test artwork generation endpoint
app.post("/api/test-artwork", async (req, res) => {
  const { dryRun = true } = req.body;

  console.log(`\n🎨 Artwork generation requested (dryRun: ${dryRun}) from UI`);

  // Set a timeout for the response
  req.setTimeout(120000); // 2 minutes

  // Check for required environment variables
  const requiredEnvVars = ["OPENAI_API_KEY"];
  const missingVars = requiredEnvVars.filter((v) => !process.env[v]);

  if (missingVars.length > 0) {
    return res.status(500).json({
      success: false,
      message: `Missing required environment variables: ${missingVars.join(
        ", "
      )}. Please check your .env file.`,
      error: "Configuration error",
    });
  }

  if (!dryRun) {
    // Accept either OAuth1.0a env or OAuth2 stored tokens
    const hasOAuth2 = !!readTokens();
    const oAuth1Vars = [
      "TWITTER_API_KEY",
      "TWITTER_API_SECRET",
      "TWITTER_ACCESS_TOKEN",
      "TWITTER_ACCESS_TOKEN_SECRET",
    ];
    const hasOAuth1 = oAuth1Vars.every((v) => !!process.env[v]);
    if (!hasOAuth1 && !hasOAuth2) {
      return res.status(400).json({
        success: false,
        message:
          "No Twitter credentials available. Use OAuth2 flow (/api/twitter/oauth2/auth) or provide OAuth1 keys in .env.",
      });
    }
  }

  try {
    // Run the artwork generation
    const result = await runArtworkGeneration(dryRun);

    res.json({
      success: true,
      message: dryRun
        ? "Artwork generated successfully (dry run - no Twitter post)"
        : "Artwork generated and posted to Twitter successfully!",
      output: result.output,
    });
  } catch (error) {
    console.error("Error generating artwork:", error);
    console.error("Full error stack:", error.stack);

    res.status(500).json({
      success: false,
      message: "Failed to generate artwork",
      error: error.message,
      details: error.stack,
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Artwork API server running on http://localhost:${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/api/health`);
  console.log(
    `   Test endpoint: POST http://localhost:${PORT}/api/test-artwork`
  );
  console.log("");
});

module.exports = app;
