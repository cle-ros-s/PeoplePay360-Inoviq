const express = require('express');
const departmentsController = require('./departments.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/rbac.middleware');
const { validate } = require('../../middleware/validate.middleware');
const {
  createDepartmentSchema,
  updateDepartmentSchema,
  listDepartmentsSchema,
  getDepartmentByIdSchema,
} = require('./departments.schema');

const router = express.Router();

router.use(authenticate);

router.get('/', validate(listDepartmentsSchema), departmentsController.listDepartments);
router.get('/:id', validate(getDepartmentByIdSchema), departmentsController.getDepartmentById);

router.post(
  '/',
  requireRole('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER'),
  validate(createDepartmentSchema),
  departmentsController.createDepartment
);

router.patch(
  '/:id',
  requireRole('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER'),
  validate(updateDepartmentSchema),
  departmentsController.updateDepartment
);

router.delete(
  '/:id',
  requireRole('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER'),
  validate(getDepartmentByIdSchema),
  departmentsController.deleteDepartment
);

module.exports = router;
