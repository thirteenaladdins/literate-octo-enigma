#!/usr/bin/env node

/**
 * Fetch Daily Artwork from Octo Studio API
 * Checks for new artworks and adds them to the gallery
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");
const TwitterService = require("./services/twitterService");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "src", "data", "artworks.json");

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

async function downloadImage(url) {
  try {
    const response = await axios.get(url, { responseType: "arraybuffer" });
    return Buffer.from(response.data);
  } catch (error) {
    throw new Error(`Failed to download image from ${url}: ${error.message}`);
  }
}

async function main() {
  const args = {
    dryRun: process.argv.includes("--dry-run"),
  };

  console.log("=".repeat(60));
  console.log("🔄 Fetching Latest Artwork from Supabase");
  console.log("=".repeat(60));

  if (args.dryRun) {
    console.log("🔍 DRY RUN MODE - No changes will be made");
  }

  // Validate environment variables
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    console.error("\n❌ Missing Supabase credentials!");
    console.error("   Please set SUPABASE_URL and SUPABASE_KEY in .env file");
    process.exit(1);
  }

  try {
    // 1. Initialize Supabase client
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_KEY
    );

    console.log(`\n📡 Connecting to Supabase...`);
    console.log(`   URL: ${process.env.SUPABASE_URL}`);

    // 2. Fetch latest artwork from Supabase
    // Use SUPABASE_TABLE env var, or default to "artworks"
    const tableName = process.env.SUPABASE_TABLE || "artworks";
    console.log(`   Table: ${tableName}`);
    
    const { data: queryData, error: queryError } = await supabase
      .from(tableName)
      .select("*")
      .order("date", { ascending: false })
      .order("id", { ascending: false })
      .limit(1);
    
    if (queryError) {
      console.error(`\n❌ Supabase query failed for table "${tableName}"`);
      console.error(`   Error: ${queryError.message}`);
      console.error(`   Code: ${queryError.code || "N/A"}`);
      console.error(`\n💡 Please check:`);
      console.error(`   1. Table name is correct (currently: "${tableName}")`);
      console.error(`   2. Table exists in Supabase dashboard`);
      console.error(`   3. RLS (Row Level Security) policies allow anonymous read access`);
      console.error(`   4. SUPABASE_KEY has proper permissions`);
      throw new Error(`Supabase query failed: ${queryError.message}`);
    }
    
    const supabaseArtworks = queryData;

    if (!supabaseArtworks || supabaseArtworks.length === 0) {
      console.log("❌ No artworks found in database");
      process.exit(1);
    }

    const latestArtwork = supabaseArtworks[0];

    if (!latestArtwork || !latestArtwork.id) {
      console.log("❌ No artwork data returned from Supabase");
      process.exit(1);
    }

    console.log(`\n✨ Latest artwork from Supabase:`);
    console.log(`   ID: ${latestArtwork.id}`);
    console.log(`   Title: ${latestArtwork.title}`);
    console.log(`   Date: ${latestArtwork.date}`);

    // 2. Load existing artworks
    console.log("\n📖 Loading existing artworks...");
    const data = readJson(dataPath);
    const artworks = Array.isArray(data.artworks) ? data.artworks : [];

    // 3. Check if this artwork already exists
    const existingIndex = artworks.findIndex((a) => a.id === latestArtwork.id);
    const existingArtwork = existingIndex >= 0 ? artworks[existingIndex] : null;
    
    if (existingArtwork) {
      // Check if we need to update with remote URLs or if data has changed
      const needsUpdate = 
        !existingArtwork.imageUrl || 
        !existingArtwork.thumbnailUrl ||
        existingArtwork.title !== latestArtwork.title ||
        existingArtwork.date !== latestArtwork.date;
      
      if (needsUpdate) {
        console.log(`\n🔄 Artwork ${latestArtwork.id} exists but needs update`);
        console.log(`   Updating with remote URLs and latest data...`);
        
        // Update existing artwork with latest data from Supabase
        // Map snake_case to camelCase for URLs
        const imageUrl = latestArtwork.imageUrl || latestArtwork.image_url || null;
        const thumbnailUrl = latestArtwork.thumbnailUrl || latestArtwork.thumbnail_url || null;
        
        artworks[existingIndex] = {
          ...existingArtwork,
          // Update with remote URLs (convert snake_case to camelCase)
          imageUrl: imageUrl || existingArtwork.imageUrl,
          thumbnailUrl: thumbnailUrl || existingArtwork.thumbnailUrl,
          // Update other fields from Supabase
          title: latestArtwork.title,
          description: latestArtwork.description || existingArtwork.description,
          date: latestArtwork.date,
          tags: latestArtwork.tags || existingArtwork.tags,
          template: latestArtwork.template || existingArtwork.template,
          colors: latestArtwork.colors || existingArtwork.colors,
          movement: latestArtwork.movement || existingArtwork.movement,
          density: latestArtwork.density || existingArtwork.density,
          mood: latestArtwork.mood || existingArtwork.mood,
          seed: latestArtwork.seed || existingArtwork.seed,
          config: latestArtwork.config || existingArtwork.config,
          // Normalize displayMode
          displayMode: latestArtwork.displayMode || latestArtwork.display_mode || existingArtwork.displayMode || "image",
        };
      } else {
        console.log(`\n✅ Artwork ${latestArtwork.id} already exists and is up to date`);
        console.log("   No action needed.");
        return;
      }
    } else {
      console.log(`\n🆕 New artwork detected! Adding to gallery...`);

      // 4. Transform Supabase response to match our artwork structure
      const newArtwork = {
        id: latestArtwork.id,
        title: latestArtwork.title,
        description: latestArtwork.description || "",
        date: latestArtwork.date,
        tags: latestArtwork.tags || [],
        file: latestArtwork.file || `${latestArtwork.id}_ai_signal`,
        thumbnail: latestArtwork.thumbnail || `${latestArtwork.id}_ai_signal_thumb`,
        category: latestArtwork.category || "generative",
        status: latestArtwork.status || "published",
        displayMode: latestArtwork.displayMode || latestArtwork.display_mode || "image",
        // Store remote URLs (handle both camelCase and snake_case)
        imageUrl: latestArtwork.imageUrl || latestArtwork.image_url || null,
        thumbnailUrl: latestArtwork.thumbnailUrl || latestArtwork.thumbnail_url || null,
        // Template metadata
        template: latestArtwork.template || null,
        colors: latestArtwork.colors || [],
        movement: latestArtwork.movement || null,
        density: latestArtwork.density || null,
        mood: latestArtwork.mood || null,
        seed: latestArtwork.seed || null,
        config: latestArtwork.config || null,
      };

      // 5. Add to artworks array (prepend to show newest first)
      artworks.unshift(newArtwork);
    }

    // 6. Update metadata
    if (data.metadata) {
      const totalArtworks = artworks.length;
      const publishedArtworks = artworks.filter(
        (artwork) => artwork.status === "published"
      ).length;

      data.metadata = {
        ...data.metadata,
        lastUpdated: new Date().toISOString().slice(0, 10),
        totalArtworks,
        publishedArtworks,
        draftArtworks: totalArtworks - publishedArtworks,
      };
    }

    // 7. Save to artworks.json
    if (!args.dryRun) {
      writeJsonAtomically(dataPath, { ...data, artworks });
      console.log(`   ✅ Added to artworks.json`);
    } else {
      console.log(`   [DRY RUN] Would add to artworks.json`);
    }

    // 8. Post to Twitter (if not dry run and Twitter is configured)
    let tweetUrl = null;
    if (!args.dryRun && latestArtwork.thumbnailUrl) {
      try {
        const twitterService = new TwitterService({
          appKey: process.env.TWITTER_API_KEY,
          appSecret: process.env.TWITTER_API_SECRET,
          accessToken: process.env.TWITTER_ACCESS_TOKEN,
          accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
        });

        console.log("\n🐦 Posting to Twitter...");
        
        // Download thumbnail for Twitter
        console.log("   Downloading thumbnail for Twitter...");
        const imageBuffer = await downloadImage(latestArtwork.thumbnailUrl);
        console.log(`   Downloaded (${(imageBuffer.length / 1024).toFixed(2)} KB)`);

        // Generate hashtags from tags
        const hashtags = latestArtwork.tags
          .filter((tag) => tag && !tag.includes(" "))
          .slice(0, 3)
          .map((tag) => `#${tag.charAt(0).toUpperCase() + tag.slice(1)}`);

        tweetUrl = await twitterService.postArtwork({
          imageBuffer,
          title: newArtwork.title,
          portfolioUrl: process.env.PORTFOLIO_URL || "https://your-portfolio.com",
          artworkId: newArtwork.id,
          hashtags,
        });

        console.log(`   ✅ Posted: ${tweetUrl}`);
      } catch (twitterError) {
        console.error("   ⚠️  Twitter posting failed:", twitterError.message);
        // Don't fail the whole script if Twitter fails
      }
    } else if (args.dryRun) {
      console.log("\n🐦 [DRY RUN] Would post to Twitter");
    } else if (!latestArtwork.thumbnailUrl) {
      console.log("\n🐦 Skipping Twitter (no thumbnailUrl available)");
    }

    // 9. Summary
    const updatedArtwork = existingArtwork ? artworks[existingIndex] : artworks[0];
    console.log("\n" + "=".repeat(60));
    console.log("✅ Daily artwork fetch completed!");
    console.log("=".repeat(60));
    console.log(`📊 Summary:`);
    console.log(`   ID: ${updatedArtwork.id}`);
    console.log(`   Title: ${updatedArtwork.title}`);
    console.log(`   Template: ${updatedArtwork.template || "N/A"}`);
    console.log(`   Image URL: ${updatedArtwork.imageUrl ? "✅" : "❌"}`);
    console.log(`   Thumbnail URL: ${updatedArtwork.thumbnailUrl ? "✅" : "❌"}`);
    if (tweetUrl) {
      console.log(`   Tweet: ${tweetUrl}`);
    }
    console.log("=".repeat(60));
  } catch (error) {
    console.error("\n❌ Error fetching daily artwork:", error.message);
    if (error.response) {
      console.error(`   Status: ${error.response.status}`);
      console.error(`   Response:`, error.response.data);
    }
    console.error(error.stack);
    process.exit(1);
  }
}

main();

