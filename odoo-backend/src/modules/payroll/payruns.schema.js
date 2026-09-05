const { z } = require('zod');
const { flexibleDate, optionalUuid, requiredUuid } = require('../../utils/schemaTypes');

const payrunStatusEnum = z.enum(['DRAFT', 'COMPUTED', 'VALIDATED', 'PAID']);
const employeeTypeEnum = z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']);

const getEligibleEmployeesSchema = {
  query: z.object({
    periodStart: flexibleDate,
    periodEnd: flexibleDate,
    salaryStructureId: optionalUuid,
    departmentId: optionalUuid,
    employeeType: employeeTypeEnum.optional(),
  }),
};

const createPayrunSchema = {
  body: z.object({
    name: z.string().min(1, 'Payrun name is required'),
    periodStart: flexibleDate,
    periodEnd: flexibleDate,
    salaryStructureId: requiredUuid('Invalid salary structure ID'),
    employeeIds: z.array(requiredUuid('Invalid employee ID')).min(1, 'At least one employee must be selected'),
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
    id: requiredUuid('Invalid payrun ID'),
  }),
};

module.exports = {
  getEligibleEmployeesSchema,
  createPayrunSchema,
  listPayrunsSchema,
  getPayrunByIdSchema,
};
