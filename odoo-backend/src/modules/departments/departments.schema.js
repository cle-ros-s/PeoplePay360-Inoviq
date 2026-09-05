const { z } = require('zod');
const { optionalUuid, requiredUuid } = require('../../utils/schemaTypes');

const createDepartmentSchema = {
  body: z.object({
    name: z.string().min(1, 'Department name is required'),
    code: z.string().optional().nullable(),
    managerId: optionalUuid,
  }),
};

const updateDepartmentSchema = {
  params: z.object({
    id: requiredUuid('Invalid department ID'),
  }),
  body: z.object({
    name: z.string().min(1).optional(),
    code: z.string().optional().nullable(),
    managerId: optionalUuid,
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
    id: requiredUuid('Invalid department ID'),
  }),
};

module.exports = {
  createDepartmentSchema,
  updateDepartmentSchema,
  listDepartmentsSchema,
  getDepartmentByIdSchema,
};
