const { formatErrorResponse } = require('../utils/responseFormatter');

/**
 * RBAC middleware to enforce allowed roles
 * @param  {...string} allowedRoles - List of allowed roles
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json(formatErrorResponse('UNAUTHORIZED', 'Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json(
        formatErrorResponse(
          'FORBIDDEN',
          `Access denied. Role '${req.user.role}' does not have sufficient permissions for this resource.`
        )
      );
    }

    next();
  };
}

module.exports = {
  requireRole,
};
