#!/usr/bin/env node

/**
 * Test Artwork Flow - Standalone script for testing the entire pipeline
 * Can be triggered from the UI or run directly from command line
 */

require("dotenv").config();
const { exec } = require("child_process");
const path = require("path");

function runArtworkGeneration(isDryRun = false) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, "generateDailyArtwork.js");
    const args = isDryRun ? "--dry-run" : "";
    const command = `node ${scriptPath} ${args}`;

    console.log(`Running: ${command}`);
    console.log(`Dry Run: ${isDryRun}`);

    // Ensure all environment variables are passed through
    const childProcess = exec(command, {
      env: process.env,
      cwd: path.join(__dirname, ".."),
      maxBuffer: 1024 * 1024 * 10, // 10MB buffer for output
    });

    let stdout = "";
    let stderr = "";

    childProcess.stdout.on("data", (data) => {
      stdout += data;
      console.log(data.toString());
    });

    childProcess.stderr.on("data", (data) => {
      stderr += data;
      console.error(data.toString());
    });

    childProcess.on("close", (code) => {
      if (code === 0) {
        resolve({ success: true, output: stdout });
      } else {
        reject(
          new Error(`Process exited with code ${code}\n${stderr || stdout}`)
        );
      }
    });

    childProcess.on("error", (error) => {
      reject(new Error(`Failed to start process: ${error.message}`));
    });
  });
}

// If run directly from command line
if (require.main === module) {
  const isDryRun = process.argv.includes("--dry-run");

  console.log("=".repeat(60));
  console.log("🧪 Testing Artwork Generation Flow");
  console.log("=".repeat(60));
  console.log(`Mode: ${isDryRun ? "DRY RUN (no Twitter post)" : "FULL RUN"}`);
  console.log("");

  runArtworkGeneration(isDryRun)
    .then(({ output }) => {
      console.log("\n✅ Test completed successfully!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ Test failed:", error.message);
      process.exit(1);
    });
}

module.exports = { runArtworkGeneration };
