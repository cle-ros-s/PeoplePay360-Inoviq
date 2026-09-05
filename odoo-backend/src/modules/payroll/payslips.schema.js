const { z } = require('zod');

const payslipStatusEnum = z.enum(['DRAFT', 'COMPUTED', 'VALIDATED', 'PAID']);

const listPayslipsSchema = {
  query: z.object({
    page: z.string().optional(),
    pageSize: z.string().optional(),
    payrunId: z.string().uuid().optional(),
    employeeId: z.string().uuid().optional(),
    status: payslipStatusEnum.optional(),
    period: z.string().optional(),
  }),
};

const getPayslipByIdSchema = {
  params: z.object({
    id: z.string().uuid('Invalid payslip ID'),
  }),
};

const updatePayslipSchema = {
  params: z.object({
    id: z.string().uuid('Invalid payslip ID'),
  }),
  body: z.object({
    workedDays: z.number().nonnegative().optional(),
    totalDays: z.number().positive().optional(),
  }),
};

module.exports = {
  listPayslipsSchema,
  getPayslipByIdSchema,
  updatePayslipSchema,
};
