const express = require('express');
const allocationsController = require('./allocations.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/rbac.middleware');
const { scopeEmployee } = require('../../middleware/scopeEmployee.middleware');
const { validate } = require('../../middleware/validate.middleware');
const {
  createAllocationSchema,
  updateAllocationSchema,
  listAllocationsSchema,
  getAllocationByIdSchema,
} = require('./allocations.schema');

const router = express.Router();

router.use(authenticate);

router.get('/', scopeEmployee, validate(listAllocationsSchema), allocationsController.listAllocations);
router.get('/:id', scopeEmployee, validate(getAllocationByIdSchema), allocationsController.getAllocationById);

router.post(
  '/',
  requireRole('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'),
  validate(createAllocationSchema),
  allocationsController.createAllocation
);

router.patch(
  '/:id',
  requireRole('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'),
  validate(updateAllocationSchema),
  allocationsController.updateAllocation
);

router.delete(
  '/:id',
  requireRole('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'),
  validate(getAllocationByIdSchema),
  allocationsController.deleteAllocation
);

module.exports = router;
