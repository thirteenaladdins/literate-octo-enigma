#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const rootDir = path.join(__dirname, "..");
const dataPath = path.join(rootDir, "src", "data", "artworks.json");
const sketchesDir = path.join(rootDir, "src", "sketches");
const sketchesIndexPath = path.join(sketchesDir, "index.js");

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, "utf8"));

const writeJson = (filePath, data) => {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
};

const padId = (value) => String(value).padStart(3, "0");

const buildSketchTemplate = (id) => `const placeholderSketch${id} = {
  setup: (p5) => {
    p5.colorMode(p5.HSB, 360, 100, 100, 100);
    p5.background(270, 35, 12);
  },

  draw: (p5) => {
    p5.noStroke();
    const t = p5.frameCount * 0.015;
    for (let i = 0; i < 32; i++) {
      const angle = t + (i / 32) * p5.TWO_PI;
      const radius = 120 + 90 * p5.noise(i * 0.08, t * 0.4);
      const x = p5.width / 2 + radius * Math.cos(angle);
      const y = p5.height / 2 + radius * Math.sin(angle);
      const hue = (210 + i * 7 + t * 40) % 360;
      const alpha = 24 + 60 * p5.noise(i * 0.05, t * 0.6);
      p5.fill(hue, 70, 95, alpha);
      p5.ellipse(x, y, 26, 26);
    }

    if (p5.frameCount % 240 === 0) {
      p5.background(270, 35, 12, 12);
    }
  },
};

export default placeholderSketch${id};
`;

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

const main = () => {
  const data = readJson(dataPath);
  const artworks = Array.isArray(data.artworks) ? data.artworks : [];

  const numericIds = artworks
    .map((artwork) => Number.parseInt(artwork.id, 10))
    .filter(Number.isFinite);

  const nextNumericId = numericIds.length ? Math.max(...numericIds) + 1 : 1;
  const paddedId = padId(nextNumericId);
  const sketchFileName = `${paddedId}_placeholder_signal`;
  const sketchPath = path.join(sketchesDir, `${sketchFileName}.js`);

  if (fs.existsSync(sketchPath)) {
    console.log(`Placeholder sketch already exists: ${sketchPath}`);
    return;
  }

  const placeholderDate = calculateDate();

  const newArtwork = {
    id: paddedId,
    title: `Signal ${paddedId}: Placeholder`,
    description:
      "A reserved space awaiting its future sketch. Replace this placeholder when inspiration lands.",
    date: placeholderDate,
    tags: ["placeholder", "pending", "future"],
    file: sketchFileName,
    thumbnail: `${sketchFileName}_thumb`,
    category: "generative",
    status: "published",
  };

  artworks.push(newArtwork);

  const sketchFiles = fs
    .readdirSync(sketchesDir)
    .filter((file) => file.endsWith(".js") && file !== "index.js")
    .sort();

  fs.writeFileSync(sketchesIndexPath, buildSketchIndex(sketchFiles), "utf8");

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

  writeJson(dataPath, { ...data, artworks });

  fs.writeFileSync(sketchPath, buildSketchTemplate(paddedId), "utf8");

  console.log(`Created placeholder Signal ${paddedId}`);
  console.log(`- Updated metadata at ${dataPath}`);
  console.log(`- Generated sketch at ${sketchPath}`);
  console.log(`- Regenerated sketch index at ${sketchesIndexPath}`);
};

main();
