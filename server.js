/**
 * Simple Express server for triggering artwork generation from the UI
 */

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
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

// LLM Chat endpoint for code editor
app.post("/api/llm/chat", async (req, res) => {
  const { code, userMessage, conversationHistory } = req.body;

  console.log(`\n🤖 LLM Chat request: "${userMessage}"`);

  // Check for required environment variables
  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({
      success: false,
      message:
        "OpenAI API key not configured. Please check your environment variables.",
      error: "Configuration error",
    });
  }

  try {
    const OpenAI = require("openai");
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Build conversation context
    const messages = [
      {
        role: "system",
        content: `You are a p5.js creative coding assistant. The user will provide:
1. Current code (or empty for new sketch)
2. A request to modify the code

Your task:
- Apply the user's requested changes
- Return complete, runnable p5.js code in instance mode format
- Include a brief explanation of what you changed
- Keep the code clean and well-commented
- Use creative defaults for colors, movement, and parameters
- Always return a valid sketch object with setup() and/or draw() functions
- Use p5 instance mode: sketch = { setup: (p5) => {...}, draw: (p5) => {...} }

IMPORTANT:
- Never include \`new p5()\` or \`new p5(sketch)\` - the preview system handles instantiation
- Never call \`p5.createCanvas()\` - the canvas is created automatically
- Only return the sketch object definition
- Do not instantiate or execute the sketch

Security: Never include dangerous functions like eval, Function, import, fetch, XMLHttpRequest, Worker, or DOM manipulation.`,
      },
    ];

    // Add conversation history for context
    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach((msg) => {
        if (msg.type === "user") {
          messages.push({ role: "user", content: msg.content });
        } else if (msg.type === "ai") {
          messages.push({ role: "assistant", content: msg.content });
        }
      });
    }

    // Add current code context if provided
    if (code && code.trim()) {
      messages.push({
        role: "user",
        content: `Current code:\n\`\`\`javascript\n${code}\n\`\`\`\n\nUser request: ${userMessage}`,
      });
    } else {
      messages.push({
        role: "user",
        content: `User request: ${userMessage}`,
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    const aiResponse = response.choices[0].message.content;

    // Extract code and explanation from the response
    let generatedCode = code; // Default to current code
    let explanation = aiResponse;

    // Try to extract code from markdown code blocks
    const codeBlockMatch = aiResponse.match(
      /```(?:javascript|js)?\n([\s\S]*?)\n```/
    );
    if (codeBlockMatch) {
      generatedCode = codeBlockMatch[1];
      // Remove the code block from explanation
      explanation = aiResponse
        .replace(/```(?:javascript|js)?\n[\s\S]*?\n```/, "")
        .trim();
    }

    // If no code block found, try to find sketch object
    if (generatedCode === code) {
      const sketchMatch = aiResponse.match(
        /const\s+sketch\s*=\s*\{[\s\S]*?\};/
      );
      if (sketchMatch) {
        generatedCode = sketchMatch[0];
        explanation = aiResponse.replace(sketchMatch[0], "").trim();
      }
    }

    // Clean up explanation
    if (explanation) {
      explanation = explanation.replace(/^[^\w]*/, "").trim();
    }

    console.log(`✅ LLM response generated successfully`);

    res.json({
      success: true,
      code: generatedCode,
      explanation:
        explanation || "Code has been generated/modified successfully.",
    });
  } catch (error) {
    console.error("Error in LLM chat:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process LLM request",
      error: error.message,
    });
  }
});

// Save template endpoint
app.post("/api/templates/save", (req, res) => {
  try {
    const { name, code } = req.body;

    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: "Name and code are required",
      });
    }

    // Sanitize template name
    const sanitizedName = name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");
    if (!sanitizedName) {
      return res.status(400).json({
        success: false,
        message: "Invalid template name. Use only letters and numbers.",
      });
    }

    // Create template wrapper
    const templateCode = `/**
 * Custom Template: ${name}
 * Generated from editor
 */
module.exports = function ${sanitizedName}(params) {
  const { colors, density, movement, shapes } = params;
  
  // Extract the sketch object from the current code
  const userCode = \`${code.replace(/`/g, "\\`").replace(/\$/g, "\\$")}\`;
  
  return userCode;
};`;

    // Get template directory
    const templateDir = path.join(__dirname, "scripts", "templates");
    const templatePath = path.join(templateDir, `${sanitizedName}.js`);

    // Check if template already exists
    if (fs.existsSync(templatePath)) {
      return res.status(400).json({
        success: false,
        message: `Template "${sanitizedName}" already exists. Please choose a different name.`,
      });
    }

    // Write template file
    fs.writeFileSync(templatePath, templateCode, "utf8");

    // Auto-register in artGenerator.js
    const artGeneratorPath = path.join(
      __dirname,
      "scripts",
      "services",
      "artGenerator.js"
    );
    let artGeneratorContent = fs.readFileSync(artGeneratorPath, "utf8");

    // Check if already registered
    if (artGeneratorContent.includes(`${sanitizedName}: require`)) {
      console.log(
        `Template ${sanitizedName} already registered in artGenerator.js`
      );
    } else {
      // Find the templates object and add new template
      const templatesStart = artGeneratorContent.indexOf("this.templates = {");
      const templatesEnd = artGeneratorContent.indexOf("};", templatesStart);

      // Find the last template entry
      const lastComma = artGeneratorContent.lastIndexOf(",", templatesEnd);
      const lastTemplateLine = artGeneratorContent.lastIndexOf(
        ": require",
        templatesEnd
      );
      const insertionPoint =
        lastComma > lastTemplateLine ? lastComma + 1 : templatesEnd;

      const newTemplateLine = `      ${sanitizedName}: require("../templates/${sanitizedName}"),\n`;

      // Insert the new template
      artGeneratorContent =
        artGeneratorContent.slice(0, insertionPoint) +
        newTemplateLine +
        artGeneratorContent.slice(insertionPoint);

      fs.writeFileSync(artGeneratorPath, artGeneratorContent, "utf8");
      console.log(`✅ Registered template in artGenerator.js`);
    }

    console.log(`✅ Template saved: ${templatePath}`);

    res.json({
      success: true,
      message: `Template saved and registered successfully!`,
      path: templatePath,
      templateName: sanitizedName,
      note: "The template has been automatically registered. You can use it in the generation script now.",
    });
  } catch (error) {
    console.error("Error saving template:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save template",
      error: error.message,
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
  console.log(
    `   Template save: POST http://localhost:${PORT}/api/templates/save`
  );
  console.log(`   SPA routes: /* will serve index.html in production`);
  console.log("");
});

module.exports = app;
