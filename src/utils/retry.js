/**
 * Retry utility with exponential backoff
 */

/**
 * Retries a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxAttempts - Maximum number of retry attempts (default: 3)
 * @param {number} options.initialDelay - Initial delay in milliseconds (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in milliseconds (default: 10000)
 * @param {Function} options.shouldRetry - Function to determine if error should be retried
 * @returns {Promise} Result of the function
 */
export const retryWithBackoff = async (fn, options = {}) => {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    shouldRetry = () => true,
  } = options;

  let lastError;
  let currentDelay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry this error
      if (!shouldRetry(error)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === maxAttempts) {
        break;
      }

      // Wait before retrying with exponential backoff
      const delayToUse = currentDelay;
      await new Promise((resolve) => setTimeout(resolve, delayToUse));
      currentDelay = Math.min(currentDelay * 2, maxDelay);
    }
  }

  throw lastError;
};

/**
 * Checks if an error is retryable (network errors, timeouts, 5xx errors)
 * @param {Error} error - The error to check
 * @returns {boolean} Whether the error is retryable
 */
export const isRetryableError = (error) => {
  // Network errors
  if (error.code === "ECONNRESET" || error.code === "ETIMEDOUT" || error.code === "ENOTFOUND") {
    return true;
  }

  // HTTP 5xx errors
  if (error.response && error.response.status >= 500) {
    return true;
  }

  // Rate limiting (429)
  if (error.response && error.response.status === 429) {
    return true;
  }

  return false;
};

