const express = require('express');
const attendanceController = require('./attendance.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/rbac.middleware');
const { scopeEmployee } = require('../../middleware/scopeEmployee.middleware');
const { validate } = require('../../middleware/validate.middleware');
const {
  checkInSchema,
  checkOutSchema,
  updateAttendanceSchema,
  listAttendanceSchema,
  getAttendanceByIdSchema,
} = require('./attendance.schema');

const router = express.Router();

router.use(authenticate);

router.get('/', scopeEmployee, validate(listAttendanceSchema), attendanceController.listAttendance);
router.get('/:id', scopeEmployee, validate(getAttendanceByIdSchema), attendanceController.getAttendanceById);
router.post('/', scopeEmployee, validate(checkInSchema), attendanceController.checkIn);
router.patch('/:id/check-out', scopeEmployee, validate(checkOutSchema), attendanceController.checkOut);

router.patch(
  '/:id',
  requireRole('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER'),
  validate(updateAttendanceSchema),
  attendanceController.updateAttendance
);

router.delete(
  '/:id',
  requireRole('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER'),
  validate(getAttendanceByIdSchema),
  attendanceController.deleteAttendance
);

module.exports = router;
