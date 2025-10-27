#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { validateArtworkEntry, validateSketchFile } = require("./validate");

const rootDir = path.join(__dirname, "..", "..");
const importsDir = path.join(rootDir, "imports");
const importSketchesDir = path.join(importsDir, "sketches");
const importThumbsDir = path.join(importsDir, "thumbnails");
const importMetadataPath = path.join(importsDir, "metadata.json");

const srcDir = path.join(rootDir, "src");
const dataPath = path.join(srcDir, "data", "artworks.json");
const sketchesDir = path.join(srcDir, "sketches");
const sketchesIndexPath = path.join(sketchesDir, "index.js");
const publicThumbsDir = path.join(rootDir, "public", "thumbnails");

function ensureDirectories() {
  [
    importsDir,
    importSketchesDir,
    importThumbsDir,
    sketchesDir,
    publicThumbsDir,
  ].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function buildSketchIndex(filenames) {
  const makeIdentifier = (name) => {
    const sanitized = name.replace(/[^a-zA-Z0-9]/g, "_");
    const prefix = /^[0-9]/.test(sanitized) ? `sketch_${sanitized}` : sanitized;
    return prefix.replace(/__+/g, "_");
  };

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
}

function copyFileIfNew(src, dest) {
  if (!fs.existsSync(src)) return { copied: false, reason: "missing" };
  if (fs.existsSync(dest)) return { copied: false, reason: "exists" };
  fs.copyFileSync(src, dest);
  return { copied: true };
}

function main() {
  console.log("\n==============================================");
  console.log("Artwork Import Pipeline");
  console.log("==============================================\n");

  ensureDirectories();

  if (!fs.existsSync(importMetadataPath)) {
    console.log(
      `No imports/metadata.json found. Add your artwork metadata to: ${importMetadataPath}`
    );
    process.exit(0);
  }

  const incoming = readJson(importMetadataPath);
  if (!Array.isArray(incoming)) {
    console.error("metadata.json must be an array of artwork entries.");
    process.exit(1);
  }

  const data = readJson(dataPath);
  const artworks = Array.isArray(data.artworks) ? data.artworks : [];
  const existingIds = new Set(artworks.map((a) => a.id));
  const existingFiles = new Set(artworks.map((a) => a.file));

  const toImport = [];
  const errors = [];

  for (const entry of incoming) {
    const { valid, message } = validateArtworkEntry(entry);
    if (!valid) {
      errors.push(`Invalid entry for id=${entry && entry.id}: ${message}`);
      continue;
    }
    if (existingIds.has(entry.id) || existingFiles.has(entry.file)) {
      console.log(
        `Skipping already-present artwork: #${entry.id} (${entry.file})`
      );
      continue;
    }

    const sketchSrc = path.join(importSketchesDir, `${entry.file}.js`);
    const thumbSrc = path.join(importThumbsDir, `${entry.file}.png`);

    const sketchValidation = validateSketchFile(sketchSrc);
    if (!sketchValidation.valid) {
      errors.push(
        `Invalid sketch for ${entry.file}: ${sketchValidation.message}`
      );
      continue;
    }

    toImport.push({ entry, sketchSrc, thumbSrc });
  }

  if (errors.length) {
    console.log("\nValidation issues:");
    errors.forEach((e) => console.log(`- ${e}`));
  }

  if (toImport.length === 0) {
    console.log("\nNothing to import.");
    process.exit(0);
  }

  console.log(`\nImporting ${toImport.length} artwork(s)...\n`);

  // 1) Copy files
  for (const item of toImport) {
    const { entry, sketchSrc, thumbSrc } = item;
    const sketchDest = path.join(sketchesDir, `${entry.file}.js`);
    const thumbDest = path.join(publicThumbsDir, `${entry.file}.png`);

    const s = copyFileIfNew(sketchSrc, sketchDest);
    const t = copyFileIfNew(thumbSrc, thumbDest);

    console.log(
      `#${entry.id} ${entry.title}\n - sketch: ${
        s.copied ? "copied" : `skip (${s.reason})`
      }\n - thumb:  ${t.copied ? "copied" : `skip (${t.reason})`}`
    );
  }

  // 2) Update artworks.json
  const now = new Date().toISOString().slice(0, 10);
  for (const { entry } of toImport) {
    const normalized = {
      status: "published",
      displayMode: entry.displayMode || "image",
      category: entry.category || "generative",
      ...entry,
    };
    artworks.push(normalized);
  }

  // Update metadata counts
  if (data.metadata) {
    const totalArtworks = artworks.length;
    const publishedArtworks = artworks.filter(
      (a) => a.status === "published"
    ).length;
    const draftArtworks = artworks.filter((a) => a.status === "draft").length;
    data.metadata = {
      ...data.metadata,
      lastUpdated: now,
      totalArtworks,
      publishedArtworks,
      draftArtworks,
    };
  }

  writeJson(dataPath, { ...data, artworks });
  console.log("\nartworks.json updated.");

  // 3) Rebuild sketches index
  const sketchFiles = fs
    .readdirSync(sketchesDir)
    .filter((f) => f.endsWith(".js") && f !== "index.js")
    .sort();

  fs.writeFileSync(sketchesIndexPath, buildSketchIndex(sketchFiles), "utf8");
  console.log("sketches/index.js rebuilt.");

  // 4) Summary
  console.log("\n==============================================");
  console.log("Import complete.");
  console.log("Imported: ", toImport.map((i) => `#${i.entry.id}`).join(", "));
  console.log("==============================================\n");
}

try {
  main();
} catch (e) {
  console.error("Import failed:", e.message);
  process.exit(1);
}
