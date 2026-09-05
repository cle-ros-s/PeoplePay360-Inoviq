const { z } = require('zod');
const { requiredUuid, flexibleNonNegativeNumber } = require('../../utils/schemaTypes');

const scheduleLineSchema = z.object({
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  breakMinutes: z.coerce.number().int().min(0).default(60),
});

const createScheduleSchema = {
  body: z.object({
    name: z.string().min(1, 'Schedule name is required'),
    type: z.string().default('STANDARD'),
    lines: z.array(scheduleLineSchema).min(1, 'Schedule must have at least one line'),
  }),
};

const updateScheduleSchema = {
  params: z.object({
    id: requiredUuid('Invalid schedule ID'),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    type: z.string().optional(),
    lines: z.array(scheduleLineSchema).min(1).optional(),
  }),
};

const listSchedulesSchema = {
  query: z.object({
    page: z.string().optional(),
    pageSize: z.string().optional(),
    search: z.string().optional(),
  }),
};

const getScheduleByIdSchema = {
  params: z.object({
    id: requiredUuid('Invalid schedule ID'),
  }),
};

module.exports = {
  createScheduleSchema,
  updateScheduleSchema,
  listSchedulesSchema,
  getScheduleByIdSchema,
};
