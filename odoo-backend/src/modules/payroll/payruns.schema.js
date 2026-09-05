const { z } = require('zod');

const payrunStatusEnum = z.enum(['DRAFT', 'COMPUTED', 'VALIDATED', 'PAID']);
const employeeTypeEnum = z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']);

const getEligibleEmployeesSchema = {
  query: z.object({
    periodStart: z.string().datetime('Valid ISO date required for periodStart'),
    periodEnd: z.string().datetime('Valid ISO date required for periodEnd'),
    salaryStructureId: z.string().uuid('Invalid salary structure ID').optional(),
    departmentId: z.string().uuid().optional(),
    employeeType: employeeTypeEnum.optional(),
  }),
};

const createPayrunSchema = {
  body: z.object({
    name: z.string().min(1, 'Payrun name is required'),
    periodStart: z.string().datetime('Valid ISO date required for periodStart'),
    periodEnd: z.string().datetime('Valid ISO date required for periodEnd'),
    salaryStructureId: z.string().uuid('Invalid salary structure ID'),
    employeeIds: z.array(z.string().uuid()).min(1, 'At least one employee must be selected'),
  }),
};

const listPayrunsSchema = {
  query: z.object({
    page: z.string().optional(),
    pageSize: z.string().optional(),
    status: payrunStatusEnum.optional(),
    period: z.string().optional(),
  }),
};

const getPayrunByIdSchema = {
  params: z.object({
    id: z.string().uuid('Invalid payrun ID'),
  }),
};

module.exports = {
  getEligibleEmployeesSchema,
  createPayrunSchema,
  listPayrunsSchema,
  getPayrunByIdSchema,
};
