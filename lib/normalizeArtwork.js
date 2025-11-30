const DEFAULT_CATEGORY = "generative";
const DEFAULT_STATUS = "published";
const DEFAULT_DISPLAY_MODE = "image";

const safeJsonParse = (value, fallback) => {
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
};

const toArray = (value) => {
  if (Array.isArray(value)) {
    return value.filter((item) => item !== null && item !== undefined);
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) {
      return [];
    }

    if (
      (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
      trimmed.includes('"')
    ) {
      const parsed = safeJsonParse(trimmed, []);
      return Array.isArray(parsed) ? parsed : [];
    }

    return trimmed
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
};

const toConfig = (value) => {
  if (!value) {
    return null;
  }

  if (typeof value === "object") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = safeJsonParse(value, null);
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  }

  return value;
};

const buildFileName = (entry) => {
  if (entry.file) {
    return entry.file;
  }

  if (entry.id) {
    return `${entry.id}_ai_signal`;
  }

  return null;
};

const buildThumbnailName = (entry, fileName) => {
  if (entry.thumbnail) {
    return entry.thumbnail;
  }

  if (entry.thumbnail_name) {
    return entry.thumbnail_name;
  }

  if (fileName) {
    return `${fileName}_thumb`;
  }

  return null;
};

function normalizeArtwork(entry = {}) {
  if (!entry || typeof entry !== "object") {
    return null;
  }

  const imageUrl = entry.imageUrl || entry.image_url || null;
  const thumbnailUrl = entry.thumbnailUrl || entry.thumbnail_url || null;
  const fileName = buildFileName(entry);
  const thumbnailName = buildThumbnailName(entry, fileName);
  const displayMode =
    entry.displayMode || entry.display_mode || DEFAULT_DISPLAY_MODE;

  const normalized = {
    id: entry.id ?? null,
    title: entry.title || "",
    description: entry.description || "",
    date: entry.date || null,
    tags: toArray(entry.tags),
    file: fileName,
    thumbnail: thumbnailName,
    category: entry.category || DEFAULT_CATEGORY,
    status: entry.status || DEFAULT_STATUS,
    displayMode,
    template: entry.template || null,
    colors: toArray(entry.colors),
    movement: entry.movement || null,
    density: entry.density || null,
    mood: entry.mood || null,
    seed: entry.seed || null,
    config: toConfig(entry.config),
    imageUrl,
    thumbnailUrl,
    createdAt: entry.created_at || entry.createdAt || null,
    updatedAt: entry.updated_at || entry.updatedAt || null,
    source: entry.source || "supabase",
  };

  return normalized;
}

module.exports = {
  normalizeArtwork,
};

