const { z } = require('zod');

const roleEnum = z.enum(['ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER', 'EMPLOYEE']);

const createUserSchema = {
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(1, 'Name is required'),
    role: roleEnum.default('EMPLOYEE'),
  }),
};

const updateUserSchema = {
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
  body: z.object({
    email: z.string().email('Invalid email address').optional(),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    name: z.string().min(1).optional(),
    role: roleEnum.optional(),
  }),
};

const listUsersSchema = {
  query: z.object({
    page: z.string().optional(),
    pageSize: z.string().optional(),
    search: z.string().optional(),
    role: roleEnum.optional(),
  }),
};

const getUserByIdSchema = {
  params: z.object({
    id: z.string().uuid('Invalid user ID'),
  }),
};

module.exports = {
  createUserSchema,
  updateUserSchema,
  listUsersSchema,
  getUserByIdSchema,
};
