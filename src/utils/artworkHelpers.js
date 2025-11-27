/**
 * Helper functions for artwork operations
 */

import { COLLECTION_DATE_THRESHOLD } from "../constants";
import { isValidDate } from "./validation";

/**
 * Determines if an artwork belongs to a collection
 * @param {Object} artwork - Artwork object
 * @param {string} collection - Collection name ("experiments" or "new")
 * @returns {boolean} Whether the artwork belongs to the collection
 */
export const belongsToCollection = (artwork, collection) => {
  if (!artwork || !artwork.date) {
    return false;
  }

  if (!isValidDate(artwork.date)) {
    return false;
  }

  const artworkDate = new Date(artwork.date);
  const thresholdDate = new Date(COLLECTION_DATE_THRESHOLD);

  if (collection === "experiments") {
    return artworkDate <= thresholdDate;
  } else if (collection === "new") {
    return artworkDate > thresholdDate;
  }

  return false;
};

/**
 * Sorts artworks by date (newest first), then by ID
 * @param {Object} a - First artwork
 * @param {Object} b - Second artwork
 * @returns {number} Sort comparison result
 */
export const sortArtworksByDate = (a, b) => {
  const dateA = new Date(a.date);
  const dateB = new Date(b.date);

  // Sort by date in reverse chronological order (newest first)
  if (dateB - dateA !== 0) {
    return dateB - dateA;
  }

  // If dates are equal, sort by ID in reverse order
  return parseInt(b.id, 10) - parseInt(a.id, 10);
};

/**
 * Gets the best available image URL for an artwork
 * @param {Object} artwork - Artwork object
 * @param {string} type - Image type: "thumbnail" or "full"
 * @returns {string} Image URL
 */
export const getArtworkImageUrl = (artwork, type = "thumbnail") => {
  if (!artwork) {
    return null;
  }

  if (type === "thumbnail") {
    return (
      artwork.thumbnailUrl ||
      artwork.imageUrl ||
      `/thumbnails/${artwork.file || artwork.thumbnail || artwork.id}.png`
    );
  }

  // Full size
  return (
    artwork.imageUrl ||
    artwork.thumbnailUrl ||
    `/thumbnails/${artwork.file || artwork.id}.png`
  );
};

/**
 * Filters artworks by template type
 * @param {Array} artworks - Array of artwork objects
 * @param {string|Array} templateType - Template type(s) to filter by
 * @returns {Array} Filtered artworks
 */
export const filterByTemplate = (artworks, templateType) => {
  if (!Array.isArray(artworks)) {
    return [];
  }

  const templateVariants = Array.isArray(templateType) ? templateType : [templateType];

  return artworks.filter(
    (artwork) =>
      artwork.template && templateVariants.includes(artwork.template)
  );
};

/**
 * Filters published artworks
 * @param {Array} artworks - Array of artwork objects
 * @returns {Array} Published artworks
 */
export const filterPublished = (artworks) => {
  if (!Array.isArray(artworks)) {
    return [];
  }

  return artworks.filter(
    (artwork) => artwork.status === "published"
  );
};

