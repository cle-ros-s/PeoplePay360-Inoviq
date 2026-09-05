const express = require('express');
const payrunsController = require('./payruns.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/rbac.middleware');
const { validate } = require('../../middleware/validate.middleware');
const {
  getEligibleEmployeesSchema,
  createPayrunSchema,
  listPayrunsSchema,
  getPayrunByIdSchema,
} = require('./payruns.schema');

const router = express.Router();

router.use(authenticate);

// Eligible employees endpoint (before parameterized routes)
router.get(
  '/eligible-employees',
  requireRole('ADMIN', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER'),
  validate(getEligibleEmployeesSchema),
  payrunsController.getEligibleEmployees
);

router.get(
  '/',
  requireRole('ADMIN', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER'),
  validate(listPayrunsSchema),
  payrunsController.listPayruns
);

router.get(
  '/:id',
  requireRole('ADMIN', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER'),
  validate(getPayrunByIdSchema),
  payrunsController.getPayrunById
);

router.post(
  '/',
  requireRole('ADMIN', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER'),
  validate(createPayrunSchema),
  payrunsController.createPayrun
);

router.post(
  '/:id/compute',
  requireRole('ADMIN', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER'),
  validate(getPayrunByIdSchema),
  payrunsController.computePayrun
);

router.post(
  '/:id/validate',
  requireRole('ADMIN', 'HR_PAYROLL_MANAGER'),
  validate(getPayrunByIdSchema),
  payrunsController.validatePayrun
);

router.post(
  '/:id/mark-paid',
  requireRole('ADMIN', 'HR_PAYROLL_MANAGER'),
  validate(getPayrunByIdSchema),
  payrunsController.markPayrunAsPaid
);

router.post(
  '/:id/send-payslips',
  requireRole('ADMIN', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER'),
  validate(getPayrunByIdSchema),
  payrunsController.sendPayrunPayslips
);

router.delete(
  '/:id',
  requireRole('ADMIN', 'HR_PAYROLL_MANAGER'),
  validate(getPayrunByIdSchema),
  payrunsController.deletePayrun
);

module.exports = router;
