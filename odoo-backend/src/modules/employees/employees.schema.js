const { z } = require('zod');
const { optionalUuid, requiredUuid } = require('../../utils/schemaTypes');

const employeeTypeEnum = z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN']);
const employeeStatusEnum = z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED']);

const createEmployeeSchema = {
  body: z
    .object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      name: z.string().optional(),
      email: z.string().email('Invalid email address'),
      phone: z.string().nullable().optional(),
      jobPosition: z.string().min(1, 'Job position is required'),
      employeeType: employeeTypeEnum.default('FULL_TIME'),
      status: employeeStatusEnum.default('ACTIVE'),
      departmentId: optionalUuid,
      managerId: optionalUuid,
      scheduleId: optionalUuid,
      userId: optionalUuid,
      bankName: z.string().nullable().optional(),
      bankAccountNumber: z.string().nullable().optional(),
      bankIfscOrRouting: z.string().nullable().optional(),
      bankIfsc: z.string().nullable().optional(),
      taxId: z.string().nullable().optional(),
    })
    .transform((data) => {
      let firstName = data.firstName;
      let lastName = data.lastName;
      if (!firstName && data.name) {
        const parts = data.name.trim().split(/\s+/);
        firstName = parts[0] || 'Employee';
        lastName = parts.slice(1).join(' ') || '.';
      }
      return {
        ...data,
        firstName: firstName || 'Employee',
        lastName: lastName || '.',
        bankIfscOrRouting: data.bankIfscOrRouting || data.bankIfsc || null,
      };
    }),
};

const updateEmployeeSchema = {
  params: z.object({
    id: requiredUuid('Invalid employee ID'),
  }),
  body: z
    .object({
      firstName: z.string().min(1).optional(),
      lastName: z.string().min(1).optional(),
      name: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().nullable().optional(),
      jobPosition: z.string().min(1).optional(),
      employeeType: employeeTypeEnum.optional(),
      status: employeeStatusEnum.optional(),
      departmentId: optionalUuid,
      managerId: optionalUuid,
      scheduleId: optionalUuid,
      userId: optionalUuid,
      bankName: z.string().nullable().optional(),
      bankAccountNumber: z.string().nullable().optional(),
      bankIfscOrRouting: z.string().nullable().optional(),
      bankIfsc: z.string().nullable().optional(),
      taxId: z.string().nullable().optional(),
    })
    .transform((data) => {
      let firstName = data.firstName;
      let lastName = data.lastName;
      if (!firstName && data.name) {
        const parts = data.name.trim().split(/\s+/);
        firstName = parts[0];
        lastName = parts.slice(1).join(' ') || '.';
      }
      return {
        ...data,
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        bankIfscOrRouting: data.bankIfscOrRouting || data.bankIfsc || undefined,
      };
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
    id: requiredUuid('Invalid employee ID'),
  }),
};

module.exports = {
  createEmployeeSchema,
  updateEmployeeSchema,
  listEmployeesSchema,
  getEmployeeByIdSchema,
};
