const express = require('express');
const salaryRulesController = require('./salaryRules.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/rbac.middleware');
const { validate } = require('../../middleware/validate.middleware');
const {
  createSalaryRuleSchema,
  updateSalaryRuleSchema,
  listSalaryRulesSchema,
  getSalaryRuleByIdSchema,
} = require('./salaryRules.schema');

const router = express.Router();

router.use(authenticate);

router.get(
  '/',
  requireRole('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER'),
  validate(listSalaryRulesSchema),
  salaryRulesController.listSalaryRules
);

router.get(
  '/:id',
  requireRole('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER'),
  validate(getSalaryRuleByIdSchema),
  salaryRulesController.getSalaryRuleById
);

router.post(
  '/',
  requireRole('ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER'),
  validate(createSalaryRuleSchema),
  salaryRulesController.createSalaryRule
);

router.patch(
  '/:id',
  requireRole('ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER'),
  validate(updateSalaryRuleSchema),
  salaryRulesController.updateSalaryRule
);

router.delete(
  '/:id',
  requireRole('ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER'),
  validate(getSalaryRuleByIdSchema),
  salaryRulesController.deleteSalaryRule
);

module.exports = router;
