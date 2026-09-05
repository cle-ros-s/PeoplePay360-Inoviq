const express = require('express');
const schedulesController = require('./schedules.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/rbac.middleware');
const { validate } = require('../../middleware/validate.middleware');
const {
  createScheduleSchema,
  updateScheduleSchema,
  listSchedulesSchema,
  getScheduleByIdSchema,
} = require('./schedules.schema');

const router = express.Router();

router.use(authenticate);

router.get('/', validate(listSchedulesSchema), schedulesController.listSchedules);
router.get('/:id', validate(getScheduleByIdSchema), schedulesController.getScheduleById);

router.post(
  '/',
  requireRole('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER'),
  validate(createScheduleSchema),
  schedulesController.createSchedule
);

router.patch(
  '/:id',
  requireRole('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER'),
  validate(updateScheduleSchema),
  schedulesController.updateSchedule
);

router.delete(
  '/:id',
  requireRole('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER'),
  validate(getScheduleByIdSchema),
  schedulesController.deleteSchedule
);

module.exports = router;
