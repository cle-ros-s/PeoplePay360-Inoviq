/**
 * Formats a paginated list response according to the shared contract.
 * @param {Array} data - Array of items
 * @param {number} total - Total count of matching items
 * @param {number} page - Current page number (1-based)
 * @param {number} pageSize - Number of items per page
 * @returns {Object} { data, total, page, pageSize }
 */
function formatListResponse(data, total, page = 1, pageSize = 20) {
  return {
    data: data || [],
    total: total ?? 0,
    page: Number(page) || 1,
    pageSize: Number(pageSize) || 20,
  };
}

/**
 * Formats a structured error response according to the shared contract.
 * @param {string} code - Machine-readable error code
 * @param {string} message - Human-readable error message
 * @param {Object} [details] - Optional extra validation/debug details
 * @returns {Object} { error: { code, message } }
 */
function formatErrorResponse(code, message, details) {
  const errorObj = {
    code: code || 'INTERNAL_ERROR',
    message: message || 'An unexpected error occurred',
  };
  if (details && process.env.NODE_ENV !== 'production') {
    errorObj.details = details;
  }
  return {
    error: errorObj,
  };
}

class AppError extends Error {
  constructor(code, message, statusCode = 400, details = null) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  formatListResponse,
  formatErrorResponse,
  AppError,
};
