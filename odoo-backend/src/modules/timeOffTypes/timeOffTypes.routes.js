const express = require('express');
const timeOffTypesController = require('./timeOffTypes.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/rbac.middleware');
const { validate } = require('../../middleware/validate.middleware');
const {
  createTimeOffTypeSchema,
  updateTimeOffTypeSchema,
  listTimeOffTypesSchema,
  getTimeOffTypeByIdSchema,
} = require('./timeOffTypes.schema');

const router = express.Router();

router.use(authenticate);

router.get('/', validate(listTimeOffTypesSchema), timeOffTypesController.listTimeOffTypes);
router.get('/:id', validate(getTimeOffTypeByIdSchema), timeOffTypesController.getTimeOffTypeById);

router.post(
  '/',
  requireRole('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER'),
  validate(createTimeOffTypeSchema),
  timeOffTypesController.createTimeOffType
);

router.patch(
  '/:id',
  requireRole('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER'),
  validate(updateTimeOffTypeSchema),
  timeOffTypesController.updateTimeOffType
);

router.delete(
  '/:id',
  requireRole('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER'),
  validate(getTimeOffTypeByIdSchema),
  timeOffTypesController.deleteTimeOffType
);

module.exports = router;
