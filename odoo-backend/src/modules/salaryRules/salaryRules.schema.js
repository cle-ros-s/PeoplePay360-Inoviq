const { z } = require('zod');

const categoryEnum = z.enum(['BASIC', 'ALLOWANCE', 'DEDUCTION', 'GROSS', 'NET']);
const computationTypeEnum = z.enum(['FIXED', 'PERCENTAGE', 'FORMULA']);

const createSalaryRuleSchema = {
  body: z.object({
    salaryStructureId: z.string().uuid('Invalid salary structure ID'),
    name: z.string().min(1, 'Rule name is required'),
    code: z.string().min(1, 'Rule code is required').regex(/^[A-Z0-9_]+$/, 'Code must be UPPERCASE letters, numbers, or underscores'),
    category: categoryEnum,
    sequence: z.number().int().positive().default(1),
    computationType: computationTypeEnum.default('FIXED'),
    amount: z.number().optional(),
    percentage: z.number().optional(),
    percentageBasisCode: z.string().optional(),
    formula: z.string().optional(),
  }),
};

const updateSalaryRuleSchema = {
  params: z.object({
    id: z.string().uuid('Invalid salary rule ID'),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    code: z.string().regex(/^[A-Z0-9_]+$/).optional(),
    category: categoryEnum.optional(),
    sequence: z.number().int().positive().optional(),
    computationType: computationTypeEnum.optional(),
    amount: z.number().nullable().optional(),
    percentage: z.number().nullable().optional(),
    percentageBasisCode: z.string().nullable().optional(),
    formula: z.string().nullable().optional(),
  }),
};

const listSalaryRulesSchema = {
  query: z.object({
    page: z.string().optional(),
    pageSize: z.string().optional(),
    salaryStructureId: z.string().uuid().optional(),
    category: categoryEnum.optional(),
    search: z.string().optional(),
  }),
};

const getSalaryRuleByIdSchema = {
  params: z.object({
    id: z.string().uuid('Invalid salary rule ID'),
  }),
};

module.exports = {
  createSalaryRuleSchema,
  updateSalaryRuleSchema,
  listSalaryRulesSchema,
  getSalaryRuleByIdSchema,
};
