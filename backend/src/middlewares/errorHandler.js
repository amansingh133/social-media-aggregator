import logger from '../utils/logger.js';
import ApiError from '../utils/ApiError.js';

// 404 handler - register AFTER all routes
export function notFoundHandler(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.originalUrl}`));
}

// Central error handler - must be registered LAST
export function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const isApiError = err instanceof ApiError;
  const statusCode = isApiError ? err.statusCode : 500;
  const message = isApiError ? err.message : 'Internal Server Error';

  if (statusCode >= 500) {
    logger.error(err.stack || err.message);
  } else {
    logger.warn(message);
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    ...(isApiError && err.details ? { details: err.details } : {}),
    ...(process.env.NODE_ENV !== 'production' && !isApiError ? { stack: err.stack } : {}),
  });
}
