const { z } = require('zod');

const createDepartmentSchema = {
  body: z.object({
    name: z.string().min(1, 'Department name is required'),
    code: z.string().min(1, 'Department code is required'),
    managerId: z.string().uuid().nullable().optional(),
  }),
};

const updateDepartmentSchema = {
  params: z.object({
    id: z.string().uuid('Invalid department ID'),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    code: z.string().min(1).optional(),
    managerId: z.string().uuid().nullable().optional(),
  }),
};

const listDepartmentsSchema = {
  query: z.object({
    page: z.string().optional(),
    pageSize: z.string().optional(),
    search: z.string().optional(),
  }),
};

const getDepartmentByIdSchema = {
  params: z.object({
    id: z.string().uuid('Invalid department ID'),
  }),
};

module.exports = {
  createDepartmentSchema,
  updateDepartmentSchema,
  listDepartmentsSchema,
  getDepartmentByIdSchema,
};
