/**
 * Centralized error handling utilities
 */

import { ERROR_MESSAGES } from "../constants";

/**
 * Custom error class for application-specific errors
 */
export class AppError extends Error {
  constructor(message, statusCode = 500, code = "UNKNOWN_ERROR") {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Formats error message for user display
 * @param {Error} error - The error object
 * @returns {string} User-friendly error message
 */
export const formatErrorMessage = (error) => {
  if (error instanceof AppError) {
    return error.message;
  }

  if (error.response) {
    // API error response
    const status = error.response.status;
    if (status === 404) return ERROR_MESSAGES.NOT_FOUND;
    if (status >= 500) return ERROR_MESSAGES.SERVER_ERROR;
    return error.response.data?.message || ERROR_MESSAGES.UNKNOWN_ERROR;
  }

  if (error.request) {
    // Network error
    return ERROR_MESSAGES.NETWORK_ERROR;
  }

  return error.message || ERROR_MESSAGES.UNKNOWN_ERROR;
};

/**
 * Logs error with context
 * @param {Error} error - The error object
 * @param {Object} context - Additional context information
 */
export const logError = (error, context = {}) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    code: error.code,
    statusCode: error.statusCode,
    context,
    timestamp: new Date().toISOString(),
  };

  // In production, send to error tracking service
  if (process.env.NODE_ENV === "production") {
    // TODO: Integrate with error tracking service (e.g., Sentry)
    console.error("Error logged:", errorInfo);
  } else {
    console.error("Error:", errorInfo);
  }
};

/**
 * Handles async errors in Express routes
 * @param {Function} fn - Async route handler
 * @returns {Function} Wrapped route handler
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Creates a standardized error response
 * @param {Error} error - The error object
 * @param {Object} res - Express response object
 */
export const sendErrorResponse = (error, res) => {
  const statusCode = error.statusCode || 500;
  const message = formatErrorMessage(error);

  logError(error, { statusCode });

  res.status(statusCode).json({
    error: {
      message,
      code: error.code || "UNKNOWN_ERROR",
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    },
  });
};

