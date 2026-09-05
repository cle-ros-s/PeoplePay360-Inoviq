const express = require('express');
const employeesController = require('./employees.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/rbac.middleware');
const { scopeEmployee } = require('../../middleware/scopeEmployee.middleware');
const { validate } = require('../../middleware/validate.middleware');
const {
  createEmployeeSchema,
  updateEmployeeSchema,
  listEmployeesSchema,
  getEmployeeByIdSchema,
} = require('./employees.schema');

const router = express.Router();

router.use(authenticate);

router.get('/', scopeEmployee, validate(listEmployeesSchema), employeesController.listEmployees);
router.get('/:id', scopeEmployee, validate(getEmployeeByIdSchema), employeesController.getEmployeeById);

router.post(
  '/',
  requireRole('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'),
  validate(createEmployeeSchema),
  employeesController.createEmployee
);

router.patch(
  '/:id',
  requireRole('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'),
  validate(updateEmployeeSchema),
  employeesController.updateEmployee
);

router.delete(
  '/:id',
  requireRole('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'),
  validate(getEmployeeByIdSchema),
  employeesController.deleteEmployee
);

module.exports = router;
