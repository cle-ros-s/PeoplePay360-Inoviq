const { z } = require('zod');

const allocationStatusEnum = z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REFUSED']);

const createAllocationSchema = {
  body: z.object({
    employeeId: z.string().uuid('Invalid employee ID'),
    timeOffTypeId: z.string().uuid('Invalid time off type ID'),
    allocatedAmount: z.number().positive('Allocated amount must be positive'),
    validFrom: z.string().datetime('Valid ISO date required for validFrom'),
    validTo: z.string().datetime('Valid ISO date required for validTo'),
    status: allocationStatusEnum.default('APPROVED'),
  }),
};

const updateAllocationSchema = {
  params: z.object({
    id: z.string().uuid('Invalid allocation ID'),
  }),
  body: z.object({
    allocatedAmount: z.number().positive().optional(),
    takenAmount: z.number().nonnegative().optional(),
    validFrom: z.string().datetime().optional(),
    validTo: z.string().datetime().optional(),
    status: allocationStatusEnum.optional(),
  }),
};

const listAllocationsSchema = {
  query: z.object({
    page: z.string().optional(),
    pageSize: z.string().optional(),
    employeeId: z.string().uuid().optional(),
    timeOffTypeId: z.string().uuid().optional(),
    status: allocationStatusEnum.optional(),
  }),
};

const getAllocationByIdSchema = {
  params: z.object({
    id: z.string().uuid('Invalid allocation ID'),
  }),
};

module.exports = {
  createAllocationSchema,
  updateAllocationSchema,
  listAllocationsSchema,
  getAllocationByIdSchema,
};
