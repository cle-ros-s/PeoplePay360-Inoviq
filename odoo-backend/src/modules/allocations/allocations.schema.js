const { z } = require('zod');
const {
  flexibleDate,
  optionalUuid,
  requiredUuid,
  flexiblePositiveNumber,
  flexibleNonNegativeNumber,
} = require('../../utils/schemaTypes');

const allocationStatusEnum = z.enum(['DRAFT', 'PENDING', 'APPROVED', 'REFUSED']);

const createAllocationSchema = {
  body: z.object({
    employeeId: requiredUuid('Invalid employee ID'),
    timeOffTypeId: requiredUuid('Invalid time off type ID'),
    allocatedAmount: flexiblePositiveNumber('Allocated amount must be positive'),
    validFrom: flexibleDate,
    validTo: flexibleDate,
    status: allocationStatusEnum.default('APPROVED'),
  }),
};

const updateAllocationSchema = {
  params: z.object({
    id: requiredUuid('Invalid allocation ID'),
  }),
  body: z.object({
    allocatedAmount: flexiblePositiveNumber('Allocated amount must be positive').optional(),
    takenAmount: flexibleNonNegativeNumber('Taken amount must be non-negative').optional(),
    validFrom: flexibleDate.optional(),
    validTo: flexibleDate.optional(),
    status: allocationStatusEnum.optional(),
  }),
};

const listAllocationsSchema = {
  query: z.object({
    page: z.string().optional(),
    pageSize: z.string().optional(),
    employeeId: z.string().optional(),
    timeOffTypeId: z.string().optional(),
    status: allocationStatusEnum.optional(),
  }),
};

const getAllocationByIdSchema = {
  params: z.object({
    id: requiredUuid('Invalid allocation ID'),
  }),
};

module.exports = {
  createAllocationSchema,
  updateAllocationSchema,
  listAllocationsSchema,
  getAllocationByIdSchema,
};
