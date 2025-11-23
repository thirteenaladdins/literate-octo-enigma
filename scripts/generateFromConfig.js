#!/usr/bin/env node

/**
 * Generate artwork screenshot from config
 * Usage:
 *   node scripts/generateFromConfig.js --config config.json
 *   node scripts/generateFromConfig.js --config config.json --output my-artwork --frame 180
 *   node scripts/generateFromConfig.js --json '{"seed":9,"gridSize":50,...}' --template gridPattern
 */

const fs = require("fs");
const path = require("path");
const ScreenshotService = require("./services/screenshotService");

function parseArgs() {
  const args = {
    config: null,
    json: null,
    template: null,
    output: null,
    frame: 180,
  };

  const configIndex = process.argv.indexOf("--config");
  if (configIndex !== -1 && process.argv[configIndex + 1]) {
    args.config = process.argv[configIndex + 1];
  }

  const jsonIndex = process.argv.indexOf("--json");
  if (jsonIndex !== -1 && process.argv[jsonIndex + 1]) {
    args.json = process.argv[jsonIndex + 1];
  }

  const templateIndex = process.argv.indexOf("--template");
  if (templateIndex !== -1 && process.argv[templateIndex + 1]) {
    args.template = process.argv[templateIndex + 1];
  }

  const outputIndex = process.argv.indexOf("--output");
  if (outputIndex !== -1 && process.argv[outputIndex + 1]) {
    args.output = process.argv[outputIndex + 1];
  }

  const frameIndex = process.argv.indexOf("--frame");
  if (frameIndex !== -1 && process.argv[frameIndex + 1]) {
    args.frame = parseInt(process.argv[frameIndex + 1], 10) || 180;
  }

  return args;
}

async function main() {
  const args = parseArgs();

  // Load config from file or JSON string
  let config;
  if (args.config) {
    const configPath = path.isAbsolute(args.config)
      ? args.config
      : path.join(process.cwd(), args.config);
    if (!fs.existsSync(configPath)) {
      console.error(`❌ Config file not found: ${configPath}`);
      process.exit(1);
    }
    config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  } else if (args.json) {
    config = JSON.parse(args.json);
  } else {
    console.error("❌ Error: Must provide --config <file> or --json '<json>'");
    console.log("\nUsage:");
    console.log("  node scripts/generateFromConfig.js --config config.json");
    console.log("  node scripts/generateFromConfig.js --json '{\"seed\":9,...}' --template gridPattern");
    console.log("  node scripts/generateFromConfig.js --config config.json --output my-artwork --frame 180");
    process.exit(1);
  }

  // Determine template
  const template = args.template || config.template || "gridPattern";
  if (!template) {
    console.error("❌ Error: Template not specified. Use --template or include in config");
    process.exit(1);
  }

  // Determine output filename
  const outputFileName =
    args.output ||
    config.output ||
    `generated_${Date.now()}`;

  const captureFrame = args.frame;

  console.log("=".repeat(60));
  console.log("🎨 Generating Artwork from Config");
  console.log("=".repeat(60));
  console.log(`Template: ${template}`);
  console.log(`Output: ${outputFileName}.png`);
  console.log(`Frame: ${captureFrame}`);
  console.log(`Config:`, JSON.stringify(config, null, 2));
  console.log("");

  const screenshotService = new ScreenshotService();

  try {
    const buffer = await screenshotService.captureFromConfig(
      template,
      config,
      outputFileName,
      captureFrame
    );

    console.log("");
    console.log("✅ Success! Screenshot generated:");
    console.log(`   screenshots/${outputFileName}.png`);
    console.log(`   public/thumbnails/${outputFileName}.png`);
    console.log(`   Size: ${(buffer.length / 1024).toFixed(2)} KB`);
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

if (require.main === module) {
  main()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Failed:", error.message);
      process.exit(1);
    });
}

module.exports = { main };

