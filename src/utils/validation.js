/**
 * Validation utilities
 */

/**
 * Validates artwork object structure
 * @param {Object} artwork - Artwork object to validate
 * @returns {boolean} Whether the artwork is valid
 */
export const isValidArtwork = (artwork) => {
  if (!artwork || typeof artwork !== "object") {
    return false;
  }

  const requiredFields = ["id", "title", "date", "status"];
  return requiredFields.every((field) => artwork[field] !== undefined);
};

/**
 * Validates date string format (YYYY-MM-DD)
 * @param {string} dateString - Date string to validate
 * @returns {boolean} Whether the date is valid
 */
export const isValidDate = (dateString) => {
  if (!dateString || typeof dateString !== "string") {
    return false;
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

/**
 * Validates collection name
 * @param {string} collection - Collection name to validate
 * @returns {boolean} Whether the collection name is valid
 */
export const isValidCollection = (collection) => {
  return collection === "experiments" || collection === "new";
};

/**
 * Validates template type
 * @param {string} templateType - Template type to validate
 * @returns {boolean} Whether the template type is valid
 */
export const isValidTemplateType = (templateType) => {
  const validTypes = [
    "gridPattern",
    "gridPatternModular",
    "flowField",
    "orbitalMotion",
    "noiseWaves",
    "particleSystem",
    "geometricGrid",
    "lightning",
    "other",
  ];
  return validTypes.includes(templateType);
};

