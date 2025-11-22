#!/usr/bin/env node

const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

/**
 * Screenshot Service
 * Captures artwork images using Puppeteer
 */
class ScreenshotService {
  constructor() {
    this.screenshotsDir = path.join(__dirname, "../../screenshots");
    this.publicThumbsDir = path.join(__dirname, "../../public/thumbnails");
    this.ensureScreenshotsDir();
  }

  /**
   * Ensure screenshots directory exists
   */
  ensureScreenshotsDir() {
    if (!fs.existsSync(this.screenshotsDir)) {
      fs.mkdirSync(this.screenshotsDir, { recursive: true });
    }
    if (!fs.existsSync(this.publicThumbsDir)) {
      fs.mkdirSync(this.publicThumbsDir, { recursive: true });
    }
  }

  /**
   * Capture a screenshot of a P5.js sketch
   * @param {string} sketchFilePath - Path to the sketch file
   * @param {string} outputFileName - Output filename (without extension)
   * @returns {Promise<Buffer>} Image buffer
   */
  async captureSketch(sketchFilePath, outputFileName) {
    console.log(`Capturing screenshot for: ${sketchFilePath}`);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1200, height: 1200 });

      // Create a simple HTML page to run the sketch
      const html = this.generateHTML(sketchFilePath);
      await page.setContent(html);

      // Wait for p5.js to load and render
      // Use a generic delay to support multiple Puppeteer versions
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Take screenshot
      const outputPath = path.join(
        this.screenshotsDir,
        `${outputFileName}.png`
      );
      await page.screenshot({
        path: outputPath,
        type: "png",
      });

      console.log(`Screenshot saved to: ${outputPath}`);

      // Also copy to public thumbnails for website rendering
      try {
        const publicThumbPath = path.join(
          this.publicThumbsDir,
          `${outputFileName}.png`
        );
        fs.copyFileSync(outputPath, publicThumbPath);
        console.log(`Public thumbnail updated: ${publicThumbPath}`);
      } catch (copyErr) {
        console.warn("Warning: failed to copy thumbnail to public/:", copyErr);
      }

      // Read the file as buffer for Twitter upload
      const buffer = fs.readFileSync(outputPath);
      return buffer;
    } finally {
      await browser.close();
    }
  }

  /**
   * Capture screenshot from config using runtime template (parameter-based approach)
   * @param {string} template - Template name (e.g., "flowField")
   * @param {Object} config - Configuration object
   * @param {string} outputFileName - Output filename (without extension)
   * @param {number} captureFrame - Frame number to capture (default: 180 for ~3 seconds at 60fps)
   * @returns {Promise<Buffer>} Image buffer
   */
  async captureFromConfig(
    template,
    config,
    outputFileName,
    captureFrame = 180
  ) {
    console.log(`Capturing screenshot from config for template: ${template}`);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    try {
      const page = await browser.newPage();
      await page.setViewport({ width: 1200, height: 1200 });

      // Generate HTML from config using runtime template
      const html = this.generateHTMLFromConfig(template, config, captureFrame);
      await page.setContent(html);

      // Wait for p5.js to load and render to the specific frame
      await page.evaluate((frame) => {
        return new Promise((resolve) => {
          let attempts = 0;
          const checkFrame = () => {
            if (window.p5Instance && window.p5Instance.frameCount >= frame) {
              resolve();
            } else {
              attempts++;
              if (attempts < 1000) {
                setTimeout(checkFrame, 10);
              } else {
                resolve(); // Timeout after 10 seconds
              }
            }
          };
          checkFrame();
        });
      }, captureFrame);

      // Take screenshot
      const outputPath = path.join(
        this.screenshotsDir,
        `${outputFileName}.png`
      );
      await page.screenshot({
        path: outputPath,
        type: "png",
      });

      console.log(`Screenshot saved to: ${outputPath}`);

      // Also copy to public thumbnails
      try {
        const publicThumbPath = path.join(
          this.publicThumbsDir,
          `${outputFileName}.png`
        );
        fs.copyFileSync(outputPath, publicThumbPath);
        console.log(`Public thumbnail updated: ${publicThumbPath}`);
      } catch (copyErr) {
        console.warn("Warning: failed to copy thumbnail to public/:", copyErr);
      }

      const buffer = fs.readFileSync(outputPath);
      return buffer;
    } finally {
      await browser.close();
    }
  }

  /**
   * Generate HTML from config using runtime template
   * @param {string} template - Template name
   * @param {Object} config - Configuration object
   * @param {number} captureFrame - Frame to capture at
   * @returns {string} HTML content
   */
  generateHTMLFromConfig(template, config, captureFrame = 180) {
    // Map template names to runtime template file names
    const templateMap = {
      flowField: "flowFieldRuntime",
      particleSystem: "particleSystemRuntime",
      orbitalMotion: "orbitalMotionRuntime",
      noiseWaves: "noiseWavesRuntime",
      geometricGrid: "geometricGridRuntime",
      gridPattern: "gridPatternRuntime",
      lightning: "lightningRuntime",
      ballots: "ballotsRuntime",
    };

    const templateFileName = templateMap[template] || `${template}Runtime`;
    const templatePath = path.join(
      __dirname,
      "../../src/templates",
      `${templateFileName}.js`
    );

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Runtime template not found: ${templatePath}`);
    }

    // Read and process the runtime template code
    let templateCode = fs.readFileSync(templatePath, "utf8");

    // Remove ES module export and convert to function that can be called
    // Replace "export default function" with "function"
    templateCode = templateCode.replace(
      /export\s+default\s+function\s+(\w+)/,
      "function $1"
    );

    const configJson = JSON.stringify(config, null, 2);

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.js"></script>
  <style>
    body { 
      margin: 0; 
      padding: 0; 
      display: flex; 
      justify-content: center; 
      align-items: center; 
      height: 100vh;
      background: #050512;
    }
    canvas {
      display: block;
    }
  </style>
</head>
<body>
  <script>
    // Inline runtime template
    ${templateCode}
    
    // Get sketch from config
    const config = ${configJson};
    const sketch = generatedSketchFromConfig(config);
    
    window.p5Instance = new p5((p5) => {
      p5.setup = () => {
        p5.createCanvas(1200, 1200);
        if (sketch.setup) sketch.setup(p5);
      };
      
      if (sketch.draw) {
        p5.draw = () => {
          sketch.draw(p5);
          // Stop at capture frame for consistent screenshots
          if (p5.frameCount >= ${captureFrame}) {
            p5.noLoop();
          }
        };
      }
      
      if (sketch.mousePressed) {
        p5.mousePressed = () => sketch.mousePressed(p5);
      }
      
      if (sketch.keyPressed) {
        p5.keyPressed = () => sketch.keyPressed(p5);
      }
    });
  </script>
</body>
</html>
    `;
  }

  /**
   * Generate HTML to render the P5.js sketch
   * @param {string} sketchFilePath - Path to sketch file
   * @returns {string} HTML content
   */
  generateHTML(sketchFilePath) {
    const sketchCode = fs.readFileSync(sketchFilePath, "utf8");

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.js"></script>
  <style>
    body { 
      margin: 0; 
      padding: 0; 
      display: flex; 
      justify-content: center; 
      align-items: center; 
      height: 100vh;
      background: #050512;
    }
    canvas {
      display: block;
    }
  </style>
</head>
<body>
  <script type="module">
    ${sketchCode}
    
    // Get the sketch object
    const sketch = generatedSketch || window.generatedSketch;
    
    new p5((p5) => {
      p5.setup = () => {
        p5.createCanvas(1200, 1200);
        if (sketch.setup) sketch.setup(p5);
      };
      
      if (sketch.draw) {
        p5.draw = () => sketch.draw(p5);
      }
      
      if (sketch.mousePressed) {
        p5.mousePressed = () => sketch.mousePressed(p5);
      }
      
      if (sketch.keyPressed) {
        p5.keyPressed = () => sketch.keyPressed(p5);
      }
    });
  </script>
</body>
</html>
    `;
  }

  /**
   * Clean up old screenshots
   * @param {number} daysToKeep - Keep screenshots from last N days
   */
  cleanupOldScreenshots(daysToKeep = 7) {
    const files = fs.readdirSync(this.screenshotsDir);
    const now = Date.now();
    const maxAge = daysToKeep * 24 * 60 * 60 * 1000;

    files.forEach((file) => {
      const filePath = path.join(this.screenshotsDir, file);
      const stats = fs.statSync(filePath);
      const age = now - stats.mtimeMs;

      if (age > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`Deleted old screenshot: ${file}`);
      }
    });
  }
}

module.exports = ScreenshotService;
