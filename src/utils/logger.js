/**
 * Structured logging utility
 * Provides consistent logging across the application
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3,
};

const currentLogLevel = process.env.NODE_ENV === "production" 
  ? LOG_LEVELS.INFO 
  : LOG_LEVELS.DEBUG;

/**
 * Creates a log entry with timestamp and context
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {Object} context - Additional context
 * @returns {Object} Log entry
 */
const createLogEntry = (level, message, context = {}) => {
  return {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
  };
};

/**
 * Logs an error message
 * @param {string} message - Error message
 * @param {Error|Object} error - Error object or context
 * @param {Object} context - Additional context
 */
export const logError = (message, error = null, context = {}) => {
  if (LOG_LEVELS.ERROR > currentLogLevel) return;

  const logEntry = createLogEntry("ERROR", message, {
    ...context,
    error: error instanceof Error 
      ? {
          message: error.message,
          stack: error.stack,
          name: error.name,
        }
      : error,
  });

  console.error(JSON.stringify(logEntry));
};

/**
 * Logs a warning message
 * @param {string} message - Warning message
 * @param {Object} context - Additional context
 */
export const logWarn = (message, context = {}) => {
  if (LOG_LEVELS.WARN > currentLogLevel) return;

  const logEntry = createLogEntry("WARN", message, context);
  console.warn(JSON.stringify(logEntry));
};

/**
 * Logs an info message
 * @param {string} message - Info message
 * @param {Object} context - Additional context
 */
export const logInfo = (message, context = {}) => {
  if (LOG_LEVELS.INFO > currentLogLevel) return;

  const logEntry = createLogEntry("INFO", message, context);
  console.log(JSON.stringify(logEntry));
};

/**
 * Logs a debug message (only in development)
 * @param {string} message - Debug message
 * @param {Object} context - Additional context
 */
export const logDebug = (message, context = {}) => {
  if (LOG_LEVELS.DEBUG > currentLogLevel) return;

  const logEntry = createLogEntry("DEBUG", message, context);
  console.debug(JSON.stringify(logEntry));
};

/**
 * Performance logging utility
 * @param {string} label - Performance label
 * @returns {Function} Function to call when operation completes
 */
export const logPerformance = (label) => {
  const startTime = performance.now();
  
  return (context = {}) => {
    const duration = performance.now() - startTime;
    logInfo(`Performance: ${label}`, {
      duration: `${duration.toFixed(2)}ms`,
      ...context,
    });
  };
};

