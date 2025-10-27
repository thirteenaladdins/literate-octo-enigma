#!/usr/bin/env node

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const OpenAIService = require("./services/openaiService");
const ArtGenerator = require("./services/artGenerator");
const ScreenshotService = require("./services/screenshotService");
const TwitterService = require("./services/twitterService");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "src", "data", "artworks.json");
const sketchesDir = path.join(rootDir, "src", "sketches");
const sketchesIndexPath = path.join(sketchesDir, "index.js");

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

const writeJson = (filePath, data) => {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
};

// Atomic write for safety
const writeJsonAtomically = (filePath, data) => {
  const tmpPath = `${filePath}.tmp`;
  writeJson(tmpPath, data);
  fs.renameSync(tmpPath, filePath);
};

const padId = (value) => String(value).padStart(3, "0");

const makeIdentifier = (name) => {
  const sanitized = name.replace(/[^a-zA-Z0-9]/g, "_");
  const prefix = /^[0-9]/.test(sanitized) ? `sketch_${sanitized}` : sanitized;
  return prefix.replace(/__+/g, "_");
};

const buildSketchIndex = (filenames) => {
  const imports = filenames
    .map((filename) => {
      const nameWithoutExt = filename.replace(/\.js$/, "");
      const identifier = makeIdentifier(nameWithoutExt);
      return `import ${identifier} from "./${nameWithoutExt}";`;
    })
    .join("\n");

  const mappings = filenames
    .map((filename) => {
      const nameWithoutExt = filename.replace(/\.js$/, "");
      const identifier = makeIdentifier(nameWithoutExt);
      return `  "${nameWithoutExt}": ${identifier},`;
    })
    .join("\n");

  return `${imports}\n\nconst sketches = {\n${mappings}\n};\n\nexport default sketches;\n`;
};

const calculateDate = () => {
  const now = new Date();
  const offset = process.argv.includes("--tomorrow") ? 1 : 0;
  now.setDate(now.getDate() + offset);
  return now.toISOString().slice(0, 10);
};

// Parse command-line arguments
function parseArgs() {
  const args = {
    dryRun: process.argv.includes("--dry-run"),
    tomorrow: process.argv.includes("--tomorrow"),
    id: null,
    template: null,
  };

  const idIndex = process.argv.indexOf("--id");
  if (idIndex !== -1 && process.argv[idIndex + 1]) {
    args.id = process.argv[idIndex + 1];
  }

  const templateIndex = process.argv.indexOf("--template");
  if (templateIndex !== -1 && process.argv[templateIndex + 1]) {
    args.template = process.argv[templateIndex + 1];
  }

  return args;
}

async function main() {
  const args = parseArgs();
  const isDryRun = args.dryRun;

  console.log("=".repeat(60));
  console.log("AI-Powered Daily Artwork Generator");
  console.log("=".repeat(60));

  if (isDryRun) {
    console.log("🔍 DRY RUN MODE - No Twitter posting");
  }
  
  if (args.id) {
    console.log(`🔄 REPLAY MODE - Targeting ID: ${args.id}`);
  }
  
  if (args.template) {
    console.log(`🎯 TEMPLATE OVERRIDE - Using: ${args.template}`);
  }

  try {
    // 1. Initialize services
    console.log("\n📦 Initializing services...");

    const openaiService = new OpenAIService(process.env.OPENAI_API_KEY);
    const artGenerator = new ArtGenerator();
    const screenshotService = new ScreenshotService();

    let twitterService = null;
    if (!isDryRun) {
      twitterService = new TwitterService({
        appKey: process.env.TWITTER_API_KEY,
        appSecret: process.env.TWITTER_API_SECRET,
        accessToken: process.env.TWITTER_ACCESS_TOKEN,
        accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
      });
    }

    // 2. Load artworks data
    console.log("\n📖 Loading artworks data...");
    const data = readJson(dataPath);
    const artworks = Array.isArray(data.artworks) ? data.artworks : [];

    // 3. Generate next artwork ID (or use override)
    let paddedId, sketchFileName, sketchPath;
    
    if (args.id) {
      // Replay mode: use specified ID
      paddedId = padId(args.id);
      sketchFileName = `${paddedId}_ai_signal`;
      sketchPath = path.join(sketchesDir, `${sketchFileName}.js`);
      console.log(`\n🔄 Replay mode: Using ID ${paddedId}`);
    } else {
      // Normal mode: generate next ID
      const numericIds = artworks
        .map((artwork) => Number.parseInt(artwork.id, 10))
        .filter(Number.isFinite);

      const nextNumericId = numericIds.length ? Math.max(...numericIds) + 1 : 1;
      paddedId = padId(nextNumericId);
      sketchFileName = `${paddedId}_ai_signal`;
      sketchPath = path.join(sketchesDir, `${sketchFileName}.js`);
    }

    // Check if artwork already exists
    if (fs.existsSync(sketchPath)) {
      console.log(`\n⚠️  Artwork already exists for today: ${sketchPath}`);
      return;
    }

    // 4. Generate art concept using OpenAI
    console.log("\n🎨 Generating art concept with AI...");
    // Build avoidance list from last few artworks to encourage novelty
    const recent = artworks.slice(-5);
    const avoid = recent.map((a) =>
      [
        a.template,
        (a.colors || []).join(","),
        a.movement,
        a.density,
        a.mood,
        a.title,
      ]
        .filter(Boolean)
        .join("|")
    );
    const seed = Date.now();
    let concept = await openaiService.generateArtConcept({ avoid, seed });
    
    // Override template if specified
    if (args.template) {
      console.log(`\n🎯 Overriding template from "${concept.template}" to "${args.template}"`);
      concept.template = args.template;
    }

    console.log(`\n✨ Concept generated:`);
    console.log(`   Title: ${concept.title}`);
    console.log(`   Template: ${concept.template}`);
    console.log(`   Mood: ${concept.mood}`);
    console.log(`   Description: ${concept.description}`);

    // 5. Generate P5.js sketch code
    console.log("\n🔨 Generating P5.js sketch...");
    const sketchCode = artGenerator.generateSketch(concept, paddedId);

    // Write sketch file
    fs.writeFileSync(sketchPath, sketchCode, "utf8");
    console.log(`   Sketch saved to: ${sketchPath}`);

    // 5.5. Store metadata for reproducibility
    const metaDir = path.join(rootDir, "artworks");
    if (!fs.existsSync(metaDir)) {
      fs.mkdirSync(metaDir, { recursive: true });
    }
    const metaPath = path.join(metaDir, `${sketchFileName}.meta.json`);
    const metadata = {
      id: paddedId,
      seed: Date.now(),
      timestamp: new Date().toISOString(),
      concept,
      model: "gpt-4o-mini",
      temperature: 0.95,
      presencePenalty: 0.8,
    };
    writeJson(metaPath, metadata);
    console.log(`   Metadata saved to: ${metaPath}`);

    // 6. Generate tags
    const tags = artGenerator.generateTags(concept);

    // 7. Create artwork entry
    const artworkDate = calculateDate();
    const newArtwork = {
      id: paddedId,
      title: `Signal ${paddedId}: ${concept.title}`,
      description: concept.description,
      date: artworkDate,
      tags: tags,
      file: sketchFileName,
      thumbnail: `${sketchFileName}_thumb`,
      category: "generative",
      status: "published",
      // Prefer static snapshot rendering on the website for newly generated artworks
      displayMode: "image",
      // Store concept metadata to reduce repetition
      template: concept.template,
      colors: concept.colors,
      movement: concept.movement,
      density: concept.density,
      mood: concept.mood,
    };

    artworks.push(newArtwork);

    // 8. Regenerate sketches index
    console.log("\n📝 Updating sketch registry...");
    const sketchFiles = fs
      .readdirSync(sketchesDir)
      .filter((file) => file.endsWith(".js") && file !== "index.js")
      .sort();

    fs.writeFileSync(sketchesIndexPath, buildSketchIndex(sketchFiles), "utf8");

    // 9. Update metadata
    if (data.metadata) {
      const totalArtworks = artworks.length;
      const publishedArtworks = artworks.filter(
        (artwork) => artwork.status === "published"
      ).length;
      const draftArtworks = artworks.filter(
        (artwork) => artwork.status === "draft"
      ).length;

      data.metadata = {
        ...data.metadata,
        lastUpdated: new Date().toISOString().slice(0, 10),
        totalArtworks,
        publishedArtworks,
        draftArtworks,
      };
    }

    writeJsonAtomically(dataPath, { ...data, artworks });
    console.log(`   Metadata updated`);

    // 10. Capture screenshot
    console.log("\n📸 Capturing screenshot...");
    const imageBuffer = await screenshotService.captureSketch(
      sketchPath,
      sketchFileName
    );
    console.log(
      `   Screenshot captured (${(imageBuffer.length / 1024).toFixed(2)} KB)`
    );

    // 11. Post to Twitter
    let tweetUrl = null;
    if (!isDryRun && twitterService) {
      console.log("\n🐦 Posting to Twitter...");
      tweetUrl = await twitterService.postArtwork({
        imageBuffer,
        title: newArtwork.title,
        portfolioUrl: process.env.PORTFOLIO_URL || "https://your-portfolio.com",
        artworkId: paddedId,
        hashtags: concept.hashtags || [],
      });
      console.log(`   Posted: ${tweetUrl}`);
    } else if (isDryRun) {
      console.log("\n🐦 Skipping Twitter post (dry run)");
    }

    // 12. Summary
    console.log("\n" + "=".repeat(60));
    console.log("✅ Daily artwork generated successfully!");
    console.log("=".repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   ID: ${paddedId}`);
    console.log(`   Title: ${newArtwork.title}`);
    console.log(`   Template: ${concept.template}`);
    console.log(`   Sketch: ${sketchPath}`);
    if (tweetUrl) {
      console.log(`   Tweet: ${tweetUrl}`);
    }
    console.log("=".repeat(60));

    // 13. Cleanup old screenshots
    screenshotService.cleanupOldScreenshots(7);
  } catch (error) {
    console.error("\n❌ Error generating daily artwork:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
