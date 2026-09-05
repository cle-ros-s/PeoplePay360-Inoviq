const { z } = require('zod');
const {
  flexibleDate,
  optionalFlexibleDate,
  optionalUuid,
  requiredUuid,
  flexiblePositiveNumber,
} = require('../../utils/schemaTypes');

const contractStatusEnum = z.enum(['DRAFT', 'RUNNING', 'EXPIRED', 'CANCELLED']);

const createContractSchema = {
  body: z.object({
    employeeId: requiredUuid('Invalid employee ID'),
    name: z.string().min(1, 'Contract name is required'),
    wage: flexiblePositiveNumber('Wage must be a positive number'),
    startDate: flexibleDate,
    endDate: optionalFlexibleDate,
    salaryStructureId: requiredUuid('Invalid salary structure ID'),
    scheduleId: optionalUuid,
    departmentId: optionalUuid,
    jobPosition: z.string().nullable().optional(),
    status: contractStatusEnum.default('DRAFT'),
  }),
};

const updateContractSchema = {
  params: z.object({
    id: requiredUuid('Invalid contract ID'),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    wage: flexiblePositiveNumber('Wage must be a positive number').optional(),
    startDate: flexibleDate.optional(),
    endDate: optionalFlexibleDate,
    salaryStructureId: optionalUuid,
    scheduleId: optionalUuid,
    departmentId: optionalUuid,
    jobPosition: z.string().nullable().optional(),
    status: contractStatusEnum.optional(),
  }),
};

const listContractsSchema = {
  query: z.object({
    page: z.string().optional(),
    pageSize: z.string().optional(),
    employeeId: z.string().optional(),
    status: contractStatusEnum.optional(),
  }),
};

const getContractByIdSchema = {
  params: z.object({
    id: requiredUuid('Invalid contract ID'),
  }),
};

module.exports = {
  createContractSchema,
  updateContractSchema,
  listContractsSchema,
  getContractByIdSchema,
};
