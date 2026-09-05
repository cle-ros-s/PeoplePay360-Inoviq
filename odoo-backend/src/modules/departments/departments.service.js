const prisma = require('../../config/prisma');
const { getPaginationParams } = require('../../utils/pagination');
const { formatListResponse, AppError } = require('../../utils/responseFormatter');

async function listDepartments(query) {
  const { page, pageSize, skip, take } = getPaginationParams(query);
  const { search } = query;

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

  return formatListResponse(formatted, total, page, pageSize);
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
  const existing = await prisma.department.findFirst({
    where: {
      OR: [
        { name: { equals: data.name, mode: 'insensitive' } },
        { code: { equals: data.code, mode: 'insensitive' } },
      ],
    },
  });

  if (existing) {
    throw new AppError('DUPLICATE_DEPARTMENT', 'Department name or code already exists', 409);
  }

  return prisma.department.create({
    data: {
      name: data.name,
      code: data.code.toUpperCase(),
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
