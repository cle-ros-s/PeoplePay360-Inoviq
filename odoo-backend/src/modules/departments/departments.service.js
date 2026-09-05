const prisma = require('../../config/prisma');
const { getPaginationParams } = require('../../utils/pagination');
const { formatListResponse, AppError } = require('../../utils/responseFormatter');

const deptListCache = new Map();
const DEPT_CACHE_TTL = 5 * 60 * 1000;

async function listDepartments(query = {}) {
  const { page, pageSize, skip, take } = getPaginationParams(query);
  const { search } = query;
  const cacheKey = `${search || ''}:${page}:${pageSize}`;
  const cached = deptListCache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < DEPT_CACHE_TTL) {
    return cached.data;
  }

  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [departments, total] = await Promise.all([
    prisma.department.findMany({
      where,
      skip,
      take,
      orderBy: { name: 'asc' },
      include: {
        manager: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        _count: {
          select: { employees: true },
        },
      },
    }),
    prisma.department.count({ where }),
  ]);

  const formatted = departments.map((d) => ({
    id: d.id,
    name: d.name,
    code: d.code,
    managerId: d.managerId,
    manager: d.manager,
    employeeCount: d._count.employees,
    createdAt: d.createdAt,
    updatedAt: d.updatedAt,
  }));

  const response = formatListResponse(formatted, total, page, pageSize);
  deptListCache.set(cacheKey, { timestamp: Date.now(), data: response });
  return response;
}

async function getDepartmentById(id) {
  const department = await prisma.department.findUnique({
    where: { id },
    include: {
      manager: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      employees: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          jobPosition: true,
          status: true,
          employeeType: true,
        },
      },
      _count: {
        select: { employees: true },
      },
    },
  });

  if (!department) {
    throw new AppError('DEPARTMENT_NOT_FOUND', 'Department not found', 404);
  }

  return {
    ...department,
    employeeCount: department._count.employees,
  };
}

async function createDepartment(data) {
  let deptCode = data.code ? data.code.trim().toUpperCase() : '';
  if (!deptCode) {
    deptCode = data.name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 8);
    if (!deptCode) deptCode = `DEPT_${Date.now().toString().slice(-4)}`;
  }

  // Check if code exists, append random digits if collision
  const existingCode = await prisma.department.findUnique({
    where: { code: deptCode },
  });
  if (existingCode) {
    deptCode = `${deptCode.slice(0, 5)}_${Math.floor(100 + Math.random() * 900)}`;
  }

  const existingName = await prisma.department.findFirst({
    where: {
      name: { equals: data.name.trim(), mode: 'insensitive' },
    },
  });

  if (existingName) {
    throw new AppError('DUPLICATE_DEPARTMENT', 'A department with this name already exists', 409);
  }

  return prisma.department.create({
    data: {
      name: data.name.trim(),
      code: deptCode,
      managerId: data.managerId || null,
    },
    include: {
      manager: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });
}

async function updateDepartment(id, data) {
  const department = await prisma.department.findUnique({ where: { id } });
  if (!department) {
    throw new AppError('DEPARTMENT_NOT_FOUND', 'Department not found', 404);
  }

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.code !== undefined) updateData.code = data.code.toUpperCase();
  if (data.managerId !== undefined) updateData.managerId = data.managerId;

  return prisma.department.update({
    where: { id },
    data: updateData,
    include: {
      manager: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      _count: {
        select: { employees: true },
      },
    },
  });
}

async function deleteDepartment(id) {
  const department = await prisma.department.findUnique({
    where: { id },
    include: { _count: { select: { employees: true } } },
  });

  if (!department) {
    throw new AppError('DEPARTMENT_NOT_FOUND', 'Department not found', 404);
  }

  if (department._count.employees > 0) {
    throw new AppError(
      'DEPARTMENT_NOT_EMPTY',
      `Cannot delete department because it has ${department._count.employees} assigned employees`,
      400
    );
  }

  await prisma.department.delete({ where: { id } });
  return { message: 'Department deleted successfully' };
}

module.exports = {
  listDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
};
