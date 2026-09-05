const { z } = require('zod');

const timeOffUnitEnum = z.enum(['DAYS', 'HOURS']);

const createTimeOffTypeSchema = {
  body: z.object({
    name: z.string().min(1, 'Type name is required'),
    code: z.string().optional().nullable(),
    requiresAllocation: z.boolean().default(true),
    requiresApproval: z.boolean().optional(),
    color: z.string().optional().nullable(),
    unit: timeOffUnitEnum.default('DAYS'),
  }),
};

const updateTimeOffTypeSchema = {
  params: z.object({
    id: z.string().uuid('Invalid time off type ID'),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    code: z.string().min(1).optional(),
    requiresAllocation: z.boolean().optional(),
    unit: timeOffUnitEnum.optional(),
  }),
};

const listTimeOffTypesSchema = {
  query: z.object({
    page: z.string().optional(),
    pageSize: z.string().optional(),
    search: z.string().optional(),
  }),
};

const getTimeOffTypeByIdSchema = {
  params: z.object({
    id: z.string().uuid('Invalid time off type ID'),
  }),
};

module.exports = {
  createTimeOffTypeSchema,
  updateTimeOffTypeSchema,
  listTimeOffTypesSchema,
  getTimeOffTypeByIdSchema,
};
