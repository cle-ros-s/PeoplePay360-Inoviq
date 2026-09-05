const { AppError, formatErrorResponse } = require('../utils/responseFormatter');

function errorHandler(err, req, res, next) {
  // Check if headers have already been sent (e.g. streaming PDF)
  if (res.headersSent) {
    return next(err);
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    return res.status(err.statusCode).json(formatErrorResponse(err.code, err.message, err.details));
  }

  // Handle Prisma Known Request Errors
  if (err.code && err.code.startsWith('P')) {
    if (err.code === 'P2002') {
      const target = err.meta && err.meta.target ? err.meta.target.join(', ') : 'field';
      return res.status(409).json(
        formatErrorResponse('CONFLICT', `A unique constraint failed on field(s): ${target}`)
      );
    }
    if (err.code === 'P2025') {
      return res.status(404).json(
        formatErrorResponse('NOT_FOUND', err.meta && err.meta.cause ? err.meta.cause : 'Resource not found')
      );
    }
    if (err.code === 'P2003') {
      return res.status(400).json(
        formatErrorResponse('FOREIGN_KEY_VIOLATION', 'Foreign key constraint failed on referenced record')
      );
    }
  }

  // Handle JSON parse errors
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json(formatErrorResponse('INVALID_JSON', 'Malformed JSON payload'));
  }

  // Default server error
  console.error('[Unhandled Server Error]:', err);
  return res.status(500).json(
    formatErrorResponse(
      'INTERNAL_SERVER_ERROR',
      process.env.NODE_ENV === 'production' ? 'An unexpected server error occurred' : err.message
    )
  );
}

module.exports = {
  errorHandler,
};
