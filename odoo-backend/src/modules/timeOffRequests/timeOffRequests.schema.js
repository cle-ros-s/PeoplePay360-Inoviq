const { z } = require('zod');

const timeOffRequestStatusEnum = z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REFUSED']);

const createTimeOffRequestSchema = {
  body: z.object({
    employeeId: z.string().uuid().optional(), // optional if employee role
    timeOffTypeId: z.string().uuid('Invalid time off type ID'),
    startDate: z.string().datetime('Valid ISO date required for startDate'),
    endDate: z.string().datetime('Valid ISO date required for endDate'),
    duration: z.number().positive('Duration must be positive (days or hours)'),
    reason: z.string().optional(),
  }),
};

const updateTimeOffRequestSchema = {
  params: z.object({
    id: z.string().uuid('Invalid time off request ID'),
  }),
  body: z.object({
    timeOffTypeId: z.string().uuid().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    duration: z.number().positive().optional(),
    reason: z.string().optional(),
    status: timeOffRequestStatusEnum.optional(),
  }),
};

const refuseRequestSchema = {
  params: z.object({
    id: z.string().uuid('Invalid time off request ID'),
  }),
  body: z.object({
    reason: z.string().optional(),
  }),
};

const listTimeOffRequestsSchema = {
  query: z.object({
    page: z.string().optional(),
    pageSize: z.string().optional(),
    employeeId: z.string().uuid().optional(),
    status: timeOffRequestStatusEnum.optional(),
    timeOffTypeId: z.string().uuid().optional(),
  }),
};

const getTimeOffRequestByIdSchema = {
  params: z.object({
    id: z.string().uuid('Invalid time off request ID'),
  }),
};

module.exports = {
  createTimeOffRequestSchema,
  updateTimeOffRequestSchema,
  refuseRequestSchema,
  listTimeOffRequestsSchema,
  getTimeOffRequestByIdSchema,
};
