const express = require('express');
const payslipsController = require('./payslips.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/rbac.middleware');
const { scopeEmployee } = require('../../middleware/scopeEmployee.middleware');
const { validate } = require('../../middleware/validate.middleware');
const {
  listPayslipsSchema,
  getPayslipByIdSchema,
  updatePayslipSchema,
} = require('./payslips.schema');

const router = express.Router();

router.use(authenticate);

router.get('/', scopeEmployee, validate(listPayslipsSchema), payslipsController.listPayslips);
router.get('/:id', scopeEmployee, validate(getPayslipByIdSchema), payslipsController.getPayslipById);
router.get('/:id/pdf', scopeEmployee, validate(getPayslipByIdSchema), payslipsController.getPayslipPdf);

router.patch(
  '/:id',
  requireRole('ADMIN', 'HR_PAYROLL_MANAGER'),
  validate(updatePayslipSchema),
  payslipsController.updatePayslip
);

router.post(
  '/:id/send-email',
  requireRole('ADMIN', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER'),
  validate(getPayslipByIdSchema),
  payslipsController.sendPayslipEmail
);

module.exports = router;
