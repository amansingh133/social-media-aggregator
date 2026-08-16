/**
 * Standardized operational error thrown across controllers/services.
 * Caught centrally by middlewares/errorHandler.js.
 */
export default class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}
