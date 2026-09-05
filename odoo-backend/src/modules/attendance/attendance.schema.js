const { z } = require('zod');
const {
  flexibleDate,
  optionalFlexibleDate,
  optionalUuid,
  requiredUuid,
  flexibleNonNegativeNumber,
} = require('../../utils/schemaTypes');

const attendanceStatusEnum = z.enum(['PRESENT', 'LATE', 'OVERTIME', 'MISSING_CHECKOUT', 'ABSENT']);

const checkInSchema = {
  body: z.object({
    employeeId: optionalUuid,
    checkIn: optionalFlexibleDate,
    note: z.string().nullable().optional(),
  }),
};

const checkOutSchema = {
  params: z.object({
    id: requiredUuid('Invalid attendance ID'),
  }),
  body: z.object({
    checkOut: optionalFlexibleDate,
  }),
};

const updateAttendanceSchema = {
  params: z.object({
    id: requiredUuid('Invalid attendance ID'),
  }),
  body: z.object({
    checkIn: flexibleDate.optional(),
    checkOut: optionalFlexibleDate,
    status: attendanceStatusEnum.optional(),
    workedHours: flexibleNonNegativeNumber().nullable().optional(),
    note: z.string().nullable().optional(),
  }),
};

const listAttendanceSchema = {
  query: z.object({
    page: z.string().optional(),
    pageSize: z.string().optional(),
    employeeId: z.string().optional(),
    status: attendanceStatusEnum.optional(),
    from: z.string().optional(),
    to: z.string().optional(),
  }),
};

const getAttendanceByIdSchema = {
  params: z.object({
    id: requiredUuid('Invalid attendance ID'),
  }),
};

module.exports = {
  checkInSchema,
  checkOutSchema,
  updateAttendanceSchema,
  listAttendanceSchema,
  getAttendanceByIdSchema,
};
