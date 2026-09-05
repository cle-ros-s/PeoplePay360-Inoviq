const { z } = require('zod');

const contractStatusEnum = z.enum(['DRAFT', 'RUNNING', 'EXPIRED', 'CANCELLED']);

const createContractSchema = {
  body: z.object({
    employeeId: z.string().uuid('Invalid employee ID'),
    name: z.string().min(1, 'Contract name is required'),
    wage: z.number().positive('Wage must be a positive number'),
    startDate: z.string().datetime('Valid ISO date required for startDate'),
    endDate: z.string().datetime('Valid ISO date required for endDate').nullable().optional(),
    salaryStructureId: z.string().uuid('Invalid salary structure ID'),
    scheduleId: z.string().uuid().nullable().optional(),
    departmentId: z.string().uuid().nullable().optional(),
    jobPosition: z.string().nullable().optional(),
    status: contractStatusEnum.default('DRAFT'),
  }),
};

const updateContractSchema = {
  params: z.object({
    id: z.string().uuid('Invalid contract ID'),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    wage: z.number().positive().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().nullable().optional(),
    salaryStructureId: z.string().uuid().optional(),
    scheduleId: z.string().uuid().nullable().optional(),
    departmentId: z.string().uuid().nullable().optional(),
    jobPosition: z.string().nullable().optional(),
    status: contractStatusEnum.optional(),
  }),
};

const listContractsSchema = {
  query: z.object({
    page: z.string().optional(),
    pageSize: z.string().optional(),
    employeeId: z.string().uuid().optional(),
    status: contractStatusEnum.optional(),
  }),
};

const getContractByIdSchema = {
  params: z.object({
    id: z.string().uuid('Invalid contract ID'),
  }),
};

module.exports = {
  createContractSchema,
  updateContractSchema,
  listContractsSchema,
  getContractByIdSchema,
};
