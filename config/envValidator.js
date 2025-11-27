/**
 * Environment variable validation
 * Validates all required environment variables on startup
 */

/**
 * Validates environment variables
 * @throws {Error} If required environment variables are missing
 */
function validateEnv() {
  const errors = [];
  const warnings = [];

  // Required for production
  const required = {
    // Add production-only required vars here if needed
  };

  // Optional but recommended
  const recommended = {
    NODE_ENV: process.env.NODE_ENV || "development",
    PORT: process.env.PORT || "3001",
  };

  // Check required variables
  Object.entries(required).forEach(([key, defaultValue]) => {
    if (!process.env[key] && !defaultValue) {
      errors.push(`Missing required environment variable: ${key}`);
    }
  });

  // Check recommended variables (warnings only)
  Object.entries(recommended).forEach(([key, defaultValue]) => {
    if (!process.env[key]) {
      warnings.push(`Missing recommended environment variable: ${key} (using default: ${defaultValue})`);
    }
  });

  // Display warnings
  if (warnings.length > 0) {
    console.warn("Environment variable warnings:");
    warnings.forEach((warning) => console.warn(`  - ${warning}`));
  }

  // Throw if required variables are missing
  if (errors.length > 0) {
    const errorMessage = `Environment validation failed:\n${errors.join("\n")}`;
    throw new Error(errorMessage);
  }

  console.log("✅ Environment variables validated");
}

module.exports = { validateEnv };

