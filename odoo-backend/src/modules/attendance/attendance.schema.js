const { z } = require('zod');

const attendanceStatusEnum = z.enum(['PRESENT', 'LATE', 'OVERTIME', 'MISSING_CHECKOUT', 'ABSENT']);

const checkInSchema = {
  body: z.object({
    employeeId: z.string().uuid().optional(), // optional if employee role (inferred from token)
    checkIn: z.string().datetime().optional(), // defaults to now
    note: z.string().optional(),
  }),
};

const checkOutSchema = {
  params: z.object({
    id: z.string().uuid('Invalid attendance ID'),
  }),
  body: z.object({
    checkOut: z.string().datetime().optional(), // defaults to now
  }),
};

const updateAttendanceSchema = {
  params: z.object({
    id: z.string().uuid('Invalid attendance ID'),
  }),
  body: z.object({
    checkIn: z.string().datetime().optional(),
    checkOut: z.string().datetime().nullable().optional(),
    status: attendanceStatusEnum.optional(),
    workedHours: z.number().nonnegative().nullable().optional(),
    note: z.string().nullable().optional(),
  }),
};

const listAttendanceSchema = {
  query: z.object({
    page: z.string().optional(),
    pageSize: z.string().optional(),
    employeeId: z.string().uuid().optional(),
    status: attendanceStatusEnum.optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  }),
};

const getAttendanceByIdSchema = {
  params: z.object({
    id: z.string().uuid('Invalid attendance ID'),
  }),
};

module.exports = {
  checkInSchema,
  checkOutSchema,
  updateAttendanceSchema,
  listAttendanceSchema,
  getAttendanceByIdSchema,
};
