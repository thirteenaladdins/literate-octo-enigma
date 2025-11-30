const fs = require("fs");
const path = require("path");
const { getSupabaseClient } = require("../lib/supabaseClient");
const { normalizeArtwork } = require("../lib/normalizeArtwork");

const DATA_PATH = path.join(process.cwd(), "src", "data", "artworks.json");
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 200;
const DEFAULT_SORT = "desc";

const parseLimit = (value) => {
  if (!value) {
    return DEFAULT_LIMIT;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return DEFAULT_LIMIT;
  }

  return Math.min(parsed, MAX_LIMIT);
};

const parseSortDirection = (value) => {
  if (!value) {
    return DEFAULT_SORT;
  }

  const normalized = String(value).toLowerCase();
  return normalized === "asc" ? "asc" : "desc";
};

const sortArtworks = (artworks, sortDirection) => {
  return [...artworks].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;

    if (dateA === dateB) {
      return sortDirection === "asc"
        ? String(a.id).localeCompare(String(b.id))
        : String(b.id).localeCompare(String(a.id));
    }

    return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
  });
};

const readFallbackArtworks = (limit, sortDirection) => {
  if (!fs.existsSync(DATA_PATH)) {
    throw new Error("Fallback data file not found.");
  }

  const raw = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const artworks = Array.isArray(raw.artworks) ? raw.artworks : [];
  const normalized = artworks
    .map((entry) => normalizeArtwork(entry))
    .filter(Boolean);

  return sortArtworks(normalized, sortDirection).slice(0, limit);
};

const fetchFromSupabase = async (limit, sortDirection) => {
  const supabase = getSupabaseClient();
  const tableName = process.env.SUPABASE_TABLE || "artworks";
  const ascending = sortDirection === "asc";

  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .order("date", { ascending })
    .order("id", { ascending })
    .limit(limit);

  if (error) {
    const details = error?.message || "Unknown Supabase error";
    throw new Error(details);
  }

  return data || [];
};

const handler = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      error: "method_not_allowed",
      message: "Only GET is supported for this endpoint.",
    });
  }

  const limit = parseLimit(req.query?.limit);
  const sortDirection = parseSortDirection(req.query?.sort);

  try {
    const supabaseRows = await fetchFromSupabase(limit, sortDirection);
    const artworks = supabaseRows
      .map((entry) => normalizeArtwork(entry))
      .filter(Boolean);

    res.setHeader(
      "Cache-Control",
      "public, s-maxage=900, stale-while-revalidate=86400"
    );

    return res.status(200).json({
      count: artworks.length,
      source: "supabase",
      artworks,
    });
  } catch (error) {
    console.error("[api/artworks] Supabase fetch failed:", error.message);

    try {
      const fallback = readFallbackArtworks(limit, sortDirection);
      res.setHeader(
        "Cache-Control",
        "public, s-maxage=60, stale-while-revalidate=300"
      );

      return res.status(200).json({
        count: fallback.length,
        source: "fallback",
        warning: "Supabase unavailable, served from local JSON.",
        artworks: fallback,
      });
    } catch (fallbackError) {
      console.error(
        "[api/artworks] Fallback data read failed:",
        fallbackError.message
      );

      return res.status(502).json({
        error: "artworks_unavailable",
        message:
          "Unable to load artworks from Supabase or local fallback source.",
      });
    }
  }
};

module.exports = handler;
