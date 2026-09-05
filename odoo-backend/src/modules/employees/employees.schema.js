const { z } = require('zod');

const employeeTypeEnum = z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']);
const employeeStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED']);

const createEmployeeSchema = {
  body: z.object({
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().nullable().optional(),
    jobPosition: z.string().min(1, 'Job position is required'),
    employeeType: employeeTypeEnum.default('FULL_TIME'),
    status: employeeStatusEnum.default('ACTIVE'),
    departmentId: z.string().uuid().nullable().optional(),
    managerId: z.string().uuid().nullable().optional(),
    scheduleId: z.string().uuid().nullable().optional(),
    userId: z.string().uuid().nullable().optional(),
    bankName: z.string().nullable().optional(),
    bankAccountNumber: z.string().nullable().optional(),
    bankIfscOrRouting: z.string().nullable().optional(),
    taxId: z.string().nullable().optional(),
  }),
};

const updateEmployeeSchema = {
  params: z.object({
    id: z.string().uuid('Invalid employee ID'),
  }),
  body: z.object({
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().nullable().optional(),
    jobPosition: z.string().min(1).optional(),
    employeeType: employeeTypeEnum.optional(),
    status: employeeStatusEnum.optional(),
    departmentId: z.string().uuid().nullable().optional(),
    managerId: z.string().uuid().nullable().optional(),
    scheduleId: z.string().uuid().nullable().optional(),
    userId: z.string().uuid().nullable().optional(),
    bankName: z.string().nullable().optional(),
    bankAccountNumber: z.string().nullable().optional(),
    bankIfscOrRouting: z.string().nullable().optional(),
    taxId: z.string().nullable().optional(),
  }),
};

const listEmployeesSchema = {
  query: z.object({
    page: z.string().optional(),
    pageSize: z.string().optional(),
    search: z.string().optional(),
    department: z.string().optional(),
    status: employeeStatusEnum.optional(),
    type: employeeTypeEnum.optional(),
  }),
};

const getEmployeeByIdSchema = {
  params: z.object({
    id: z.string().uuid('Invalid employee ID'),
  }),
};

module.exports = {
  createEmployeeSchema,
  updateEmployeeSchema,
  listEmployeesSchema,
  getEmployeeByIdSchema,
};
