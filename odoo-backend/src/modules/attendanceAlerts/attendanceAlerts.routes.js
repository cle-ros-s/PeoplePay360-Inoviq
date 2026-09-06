const express = require('express');
const router = express.Router();
const attendanceAlertsController = require('./attendanceAlerts.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/rbac.middleware');
const { scopeEmployee } = require('../../middleware/scopeEmployee.middleware');
const { validate } = require('../../middleware/validate.middleware');
const {
  updateAlertStatusSchema,
  updateThresholdSchema,
  listAlertsQuerySchema,
} = require('./attendanceAlerts.schema');

router.use(authenticate);

// Get current employee's personal attendance alert reminder (No salary/payroll info exposed)
router.get(
  '/my-alert',
  requireRole('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'EMPLOYEE'),
  attendanceAlertsController.getMyAlert
);

// Get threshold configuration
router.get(
  '/threshold',
  requireRole('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER'),
  attendanceAlertsController.getThreshold
);

// Update threshold configuration
router.patch(
  '/threshold',
  requireRole('ADMIN', 'HR_PAYROLL_MANAGER'),
  validate({ body: updateThresholdSchema }),
  attendanceAlertsController.updateThreshold
);

// Trigger on-demand attendance risk detection scan
router.post(
  '/run-check',
  requireRole('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER'),
  attendanceAlertsController.runCheck
);

// List attendance alerts (scoped automatically if EMPLOYEE)
router.get(
  '/',
  scopeEmployee,
  validate({ query: listAlertsQuerySchema }),
  attendanceAlertsController.listAlerts
);

// Get single alert detail
router.get(
  '/:id',
  scopeEmployee,
  attendanceAlertsController.getAlertById
);

// Update alert status (Under review, Resolve, Dismiss)
router.patch(
  '/:id/status',
  requireRole('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER'),
  validate({ body: updateAlertStatusSchema }),
  attendanceAlertsController.updateAlertStatus
);

module.exports = router;
