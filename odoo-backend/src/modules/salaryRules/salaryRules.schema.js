const { z } = require('zod');
const { requiredUuid, optionalNumber } = require('../../utils/schemaTypes');

const categoryEnum = z.enum(['BASIC', 'ALLOWANCE', 'DEDUCTION', 'GROSS', 'NET']);
const computationTypeEnum = z.enum(['FIXED', 'PERCENTAGE', 'FORMULA']);

const createSalaryRuleSchema = {
  body: z.object({
    salaryStructureId: requiredUuid('Invalid salary structure ID'),
    name: z.string().min(1, 'Rule name is required'),
    code: z.string().min(1, 'Rule code is required').regex(/^[A-Z0-9_]+$/, 'Code must be UPPERCASE letters, numbers, or underscores'),
    category: categoryEnum,
    sequence: z.coerce.number().int().positive().default(1),
    computationType: computationTypeEnum.default('FIXED'),
    computationMethod: computationTypeEnum.optional(),
    amount: optionalNumber,
    percentage: optionalNumber,
    percentageBasisCode: z.string().nullable().optional(),
    formula: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
  }),
};

const updateSalaryRuleSchema = {
  params: z.object({
    id: requiredUuid('Invalid salary rule ID'),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    code: z.string().regex(/^[A-Z0-9_]+$/).optional(),
    category: categoryEnum.optional(),
    sequence: z.coerce.number().int().positive().optional(),
    computationType: computationTypeEnum.optional(),
    computationMethod: computationTypeEnum.optional(),
    amount: optionalNumber,
    percentage: optionalNumber,
    percentageBasisCode: z.string().nullable().optional(),
    formula: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
  }),
};

const listSalaryRulesSchema = {
  query: z.object({
    page: z.string().optional(),
    pageSize: z.string().optional(),
    salaryStructureId: z.string().optional(),
    category: categoryEnum.optional(),
    search: z.string().optional(),
  }),
};

const getSalaryRuleByIdSchema = {
  params: z.object({
    id: requiredUuid('Invalid salary rule ID'),
  }),
};

module.exports = {
  createSalaryRuleSchema,
  updateSalaryRuleSchema,
  listSalaryRulesSchema,
  getSalaryRuleByIdSchema,
};
