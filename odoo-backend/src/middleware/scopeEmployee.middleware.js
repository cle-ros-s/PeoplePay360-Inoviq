const { formatErrorResponse } = require('../utils/responseFormatter');

/**
 * Middleware that scopes queries/mutations to the authenticated employee's own data
 * if the user has the EMPLOYEE role.
 */
function scopeEmployee(req, res, next) {
  if (!req.user) {
    return res.status(401).json(formatErrorResponse('UNAUTHORIZED', 'Authentication required'));
  }

  if (req.user.role === 'EMPLOYEE') {
    if (!req.user.employeeId) {
      return res.status(403).json(
        formatErrorResponse('FORBIDDEN', 'User is not linked to any employee record')
      );
    }

    const employeeIdInParams = req.params.employeeId || req.params.id;
    const employeeIdInQuery = req.query.employeeId;
    const employeeIdInBody = req.body && req.body.employeeId;

    // If a specific employeeId is requested in URL query and it doesn't match, reject
    if (employeeIdInQuery && employeeIdInQuery !== req.user.employeeId) {
      return res.status(403).json(
        formatErrorResponse('FORBIDDEN', 'Employees may only access their own records')
      );
    }

    // If an employeeId is provided in body and doesn't match, reject
    if (employeeIdInBody && employeeIdInBody !== req.user.employeeId) {
      return res.status(403).json(
        formatErrorResponse('FORBIDDEN', 'Employees may not create/modify records for other employees')
      );
    }

    req.scopedEmployeeId = req.user.employeeId;
  }

  next();
}

module.exports = {
  scopeEmployee,
};
