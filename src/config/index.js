/**
 * Application configuration module
 * Centralizes all configuration values
 */

/**
 * Application configuration
 */
export const config = {
  // API Configuration
  api: {
    baseUrl: process.env.REACT_APP_API_URL || "",
    timeout: parseInt(process.env.REACT_APP_API_TIMEOUT || "30000", 10),
    retryAttempts: parseInt(process.env.REACT_APP_API_RETRY_ATTEMPTS || "3", 10),
    retryDelay: parseInt(process.env.REACT_APP_API_RETRY_DELAY || "1000", 10),
  },

  // Image Configuration
  images: {
    thumbnailSize: 400,
    fullSize: 2400,
    placeholderColor: "#222",
    errorMessage: "Image not available",
  },

  // Collection Configuration
  collections: {
    dateThreshold: "2025-11-27",
  },

  // Feature Flags
  features: {
    enableAnalytics: process.env.REACT_APP_ENABLE_ANALYTICS === "true",
    enableErrorTracking: process.env.REACT_APP_ENABLE_ERROR_TRACKING === "true",
  },

  // Environment
  env: {
    isDevelopment: process.env.NODE_ENV === "development",
    isProduction: process.env.NODE_ENV === "production",
    isTest: process.env.NODE_ENV === "test",
  },
};

/**
 * Validates configuration on startup
 * @throws {Error} If critical configuration is invalid
 */
export const validateConfig = () => {
  const errors = [];

  // Validate API timeout
  if (config.api.timeout <= 0) {
    errors.push("API timeout must be greater than 0");
  }

  // Validate retry attempts
  if (config.api.retryAttempts < 0) {
    errors.push("Retry attempts must be non-negative");
  }

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join("\n")}`);
  }
};

// Validate on import in development
if (config.env.isDevelopment) {
  try {
    validateConfig();
  } catch (error) {
    console.warn("Configuration validation warning:", error.message);
  }
}

export default config;

