const { ZodError } = require('zod');
const { formatErrorResponse } = require('../utils/responseFormatter');

/**
 * Validates request components (body, query, params) against Zod schemas
 * @param {Object} schemas - { body?: ZodSchema, query?: ZodSchema, params?: ZodSchema }
 */
function validate(schemas = {}) {
  return async (req, res, next) => {
    try {
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const firstIssue = error.issues[0];
        const field = firstIssue ? firstIssue.path.join('.') : 'field';
        const message = firstIssue ? `${field}: ${firstIssue.message}` : 'Validation error';
        return res.status(422).json(formatErrorResponse('VALIDATION_ERROR', message, error.issues));
      }
      next(error);
    }
  };
}

module.exports = {
  validate,
};
