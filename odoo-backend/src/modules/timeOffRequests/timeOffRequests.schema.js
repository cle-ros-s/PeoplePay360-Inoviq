const { z } = require('zod');
const {
  flexibleDate,
  optionalUuid,
  requiredUuid,
  flexiblePositiveNumber,
} = require('../../utils/schemaTypes');

const timeOffStatusEnum = z.enum(['DRAFT', 'PENDING', 'SUBMITTED', 'APPROVED', 'REFUSED']).transform((val) => (val === 'SUBMITTED' ? 'PENDING' : val));

const createTimeOffRequestSchema = {
  body: z.object({
    employeeId: optionalUuid,
    timeOffTypeId: requiredUuid('Invalid time off type ID'),
    startDate: flexibleDate,
    endDate: flexibleDate,
    duration: flexiblePositiveNumber('Duration must be a positive number'),
    reason: z.string().nullable().optional(),
  }),
};

const updateTimeOffRequestSchema = {
  params: z.object({
    id: requiredUuid('Invalid request ID'),
  }),
  body: z.object({
    startDate: flexibleDate.optional(),
    endDate: flexibleDate.optional(),
    duration: flexiblePositiveNumber('Duration must be a positive number').optional(),
    reason: z.string().nullable().optional(),
    timeOffTypeId: optionalUuid,
  }),
};

const listTimeOffRequestsSchema = {
  query: z.object({
    page: z.string().optional(),
    pageSize: z.string().optional(),
    employeeId: z.string().optional(),
    status: timeOffStatusEnum.optional(),
    timeOffTypeId: z.string().optional(),
  }),
};

const getTimeOffRequestByIdSchema = {
  params: z.object({
    id: requiredUuid('Invalid request ID'),
  }),
};

const refuseRequestSchema = {
  params: z.object({
    id: requiredUuid('Invalid request ID'),
  }),
  body: z.object({
    refusalReason: z.string().optional(),
    reason: z.string().optional(),
  }).transform((d) => ({
    refusalReason: d.refusalReason || d.reason || 'Request refused by manager',
  })),
};

module.exports = {
  createTimeOffRequestSchema,
  updateTimeOffRequestSchema,
  listTimeOffRequestsSchema,
  getTimeOffRequestByIdSchema,
  refuseRequestSchema,
};
