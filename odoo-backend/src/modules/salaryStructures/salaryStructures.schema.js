const { z } = require('zod');

const createSalaryStructureSchema = {
  body: z.object({
    name: z.string().min(1, 'Structure name is required'),
    code: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
  }),
};

const updateSalaryStructureSchema = {
  params: z.object({
    id: z.string().uuid('Invalid salary structure ID'),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    code: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    isActive: z.boolean().optional(),
  }),
};

const reorderRulesSchema = {
  params: z.object({
    id: z.string().uuid('Invalid salary structure ID'),
  }),
  body: z.object({
    ruleOrders: z
      .array(
        z.object({
          ruleId: z.string(),
          sequence: z.number().int().positive('Sequence must be a positive integer'),
        })
      )
      .optional(),
    ruleIds: z.array(z.string()).optional(),
  }),
};

const listSalaryStructuresSchema = {
  query: z.object({
    page: z.string().optional(),
    pageSize: z.string().optional(),
    search: z.string().optional(),
    isActive: z.string().optional(),
  }),
};

const getSalaryStructureByIdSchema = {
  params: z.object({
    id: z.string().uuid('Invalid salary structure ID'),
  }),
};

module.exports = {
  createSalaryStructureSchema,
  updateSalaryStructureSchema,
  reorderRulesSchema,
  listSalaryStructuresSchema,
  getSalaryStructureByIdSchema,
};
