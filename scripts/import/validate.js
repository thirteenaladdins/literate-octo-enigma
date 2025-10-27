const fs = require("fs");

function validateArtworkEntry(entry) {
  if (!entry || typeof entry !== "object") {
    return { valid: false, message: "entry must be an object" };
  }
  const required = ["id", "title", "description", "date", "tags", "file"];
  for (const key of required) {
    if (!(key in entry)) {
      return { valid: false, message: `missing required field: ${key}` };
    }
  }
  if (!/^\d{3}$/.test(entry.id)) {
    return { valid: false, message: "id must be a zero-padded 3-digit string" };
  }
  if (!Array.isArray(entry.tags)) {
    return { valid: false, message: "tags must be an array" };
  }
  if (typeof entry.file !== "string" || entry.file.length === 0) {
    return { valid: false, message: "file must be a non-empty string" };
  }
  return { valid: true };
}

function validateSketchFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return { valid: false, message: "file does not exist" };
  }
  const content = fs.readFileSync(filePath, "utf8");
  // Basic check: file should export a default sketch object or a const
  const looksLikeSketch =
    /export\s+default\s+|const\s+generatedSketch\s*=/.test(content);
  if (!looksLikeSketch) {
    return { valid: false, message: "sketch file does not export a sketch" };
  }
  return { valid: true };
}

module.exports = { validateArtworkEntry, validateSketchFile };
