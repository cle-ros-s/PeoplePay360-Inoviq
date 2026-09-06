const express = require('express');
const salaryStructuresController = require('./salaryStructures.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/rbac.middleware');
const { validate } = require('../../middleware/validate.middleware');
const {
  createSalaryStructureSchema,
  updateSalaryStructureSchema,
  reorderRulesSchema,
  listSalaryStructuresSchema,
  getSalaryStructureByIdSchema,
} = require('./salaryStructures.schema');

const router = express.Router();

router.use(authenticate);

router.get(
  '/',
  requireRole('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER'),
  validate(listSalaryStructuresSchema),
  salaryStructuresController.listSalaryStructures
);

router.get(
  '/:id',
  requireRole('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER'),
  validate(getSalaryStructureByIdSchema),
  salaryStructuresController.getSalaryStructureById
);

router.post(
  '/',
  requireRole('ADMIN', 'HR_PAYROLL_MANAGER'),
  validate(createSalaryStructureSchema),
  salaryStructuresController.createSalaryStructure
);

router.patch(
  '/:id',
  requireRole('ADMIN', 'HR_PAYROLL_MANAGER'),
  validate(updateSalaryStructureSchema),
  salaryStructuresController.updateSalaryStructure
);

router.patch(
  '/:id/reorder-rules',
  requireRole('ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER'),
  validate(reorderRulesSchema),
  salaryStructuresController.reorderRules
);

router.get(
  '/:id/rules',
  requireRole('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER'),
  salaryStructuresController.getRulesForStructure
);

router.post(
  '/:id/rules',
  requireRole('ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER'),
  salaryStructuresController.createRuleForStructure
);

router.delete(
  '/:id',
  requireRole('ADMIN', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER', 'HR_MANAGER'),
  validate(getSalaryStructureByIdSchema),
  salaryStructuresController.deleteSalaryStructure
);

module.exports = router;
