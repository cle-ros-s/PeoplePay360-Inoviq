const express = require('express');
const timeOffRequestsController = require('./timeOffRequests.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/rbac.middleware');
const { scopeEmployee } = require('../../middleware/scopeEmployee.middleware');
const { validate } = require('../../middleware/validate.middleware');
const {
  createTimeOffRequestSchema,
  updateTimeOffRequestSchema,
  refuseRequestSchema,
  listTimeOffRequestsSchema,
  getTimeOffRequestByIdSchema,
} = require('./timeOffRequests.schema');

const router = express.Router();

router.use(authenticate);

router.get('/', scopeEmployee, validate(listTimeOffRequestsSchema), timeOffRequestsController.listTimeOffRequests);
router.get('/:id', scopeEmployee, validate(getTimeOffRequestByIdSchema), timeOffRequestsController.getTimeOffRequestById);
router.post('/', scopeEmployee, validate(createTimeOffRequestSchema), timeOffRequestsController.createTimeOffRequest);

router.patch(
  '/:id/approve',
  requireRole('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'),
  validate(getTimeOffRequestByIdSchema),
  timeOffRequestsController.approveTimeOffRequest
);

router.patch(
  '/:id/refuse',
  requireRole('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_MANAGER', 'HR_PAYROLL_USER'),
  validate(refuseRequestSchema),
  timeOffRequestsController.refuseTimeOffRequest
);

router.patch('/:id', scopeEmployee, validate(updateTimeOffRequestSchema), timeOffRequestsController.updateTimeOffRequest);
router.delete('/:id', scopeEmployee, validate(getTimeOffRequestByIdSchema), timeOffRequestsController.deleteTimeOffRequest);

module.exports = router;
