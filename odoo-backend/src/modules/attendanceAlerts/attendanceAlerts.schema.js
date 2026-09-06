const { z } = require('zod');

const alertStatusEnum = z.enum(['OPEN', 'ACKNOWLEDGED', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED']);

const updateAlertStatusSchema = z.object({
  status: alertStatusEnum,
  resolutionNote: z.string().optional().nullable(),
  resolutionNotes: z.string().optional().nullable(),
});

const updateThresholdSchema = z.object({
  threshold: z.preprocess(
    (v) => (v !== undefined && v !== null && v !== '' ? parseInt(v, 10) : undefined),
    z.number().min(1, 'Threshold must be at least 1 day').max(60, 'Threshold cannot exceed 60 days').optional()
  ),
  thresholdDays: z.preprocess(
    (v) => (v !== undefined && v !== null && v !== '' ? parseInt(v, 10) : undefined),
    z.number().min(1, 'Threshold must be at least 1 day').max(60, 'Threshold cannot exceed 60 days').optional()
  ),
});

const runCheckQuerySchema = z.object({
  evaluationDate: z.string().optional(),
  employeeId: z.string().optional(),
});

const listAlertsQuerySchema = z.object({
  page: z.preprocess((v) => (v ? parseInt(v, 10) : 1), z.number().min(1).default(1)),
  pageSize: z.preprocess((v) => (v ? parseInt(v, 10) : 20), z.number().min(1).max(100).default(20)),
  status: alertStatusEnum.optional(),
  departmentId: z.string().optional(),
  employeeId: z.string().optional(),
  employeeType: z.string().optional(),
  search: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});

module.exports = {
  updateAlertStatusSchema,
  updateThresholdSchema,
  runCheckQuerySchema,
  listAlertsQuerySchema,
};
