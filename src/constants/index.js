/**
 * Application-wide constants
 */

// Date threshold for separating collections
// Artworks with date <= this date are "Experiments Collection"
// Artworks with date > this date are "New Collection"
export const COLLECTION_DATE_THRESHOLD = "2025-11-27";

// Define all template types in the order they should appear
export const TEMPLATE_TYPES = [
  "gridPattern", // Includes gridPatternModular
  "flowField",
  "orbitalMotion",
  "noiseWaves",
  "particleSystem",
  "geometricGrid",
  "lightning",
  "other",
];

// Template display names and descriptions
export const TEMPLATE_INFO = {
  gridPattern: {
    name: "Grid Pattern",
    description: "A collection of artworks using the grid pattern template",
  },
  gridPatternModular: {
    name: "Grid Pattern (Modular)",
    description: "Modular grid pattern artworks with plug-and-play modules",
  },
  flowField: {
    name: "Flow Field",
    description: "Artworks featuring flowing fields and currents",
  },
  orbitalMotion: {
    name: "Orbital Motion",
    description: "Celestial movements and orbital patterns",
  },
  noiseWaves: {
    name: "Noise Waves",
    description: "Wave patterns generated with noise functions",
  },
  particleSystem: {
    name: "Particle System",
    description: "Dynamic particle systems and interactions",
  },
  geometricGrid: {
    name: "Geometric Grid",
    description: "Geometric shapes arranged in grid patterns",
  },
  lightning: {
    name: "Lightning",
    description: "Electric currents and lightning-like patterns",
  },
};

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || "",
  TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

// Image fallback configuration
export const IMAGE_CONFIG = {
  THUMBNAIL_SIZE: 400,
  FULL_SIZE: 2400,
  PLACEHOLDER_COLOR: "#222",
  ERROR_MESSAGE: "Image not available",
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: "Network error. Please check your connection.",
  NOT_FOUND: "The requested resource was not found.",
  SERVER_ERROR: "Server error. Please try again later.",
  UNKNOWN_ERROR: "An unexpected error occurred.",
  LOAD_FAILED: "Failed to load artworks.",
};

