const prisma = require('../../config/prisma');
const { getPaginationParams } = require('../../utils/pagination');
const { formatListResponse, AppError } = require('../../utils/responseFormatter');

async function listTimeOffTypes(query) {
  const { page, pageSize, skip, take } = getPaginationParams(query);
  const { search } = query;

  const where = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [types, total] = await Promise.all([
    prisma.timeOffType.findMany({
      where,
      skip,
      take,
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { allocations: true, requests: true } },
      },
    }),
    prisma.timeOffType.count({ where }),
  ]);

  const formatted = types.map((t) => ({
    id: t.id,
    name: t.name,
    code: t.code,
    requiresAllocation: t.requiresAllocation,
    unit: t.unit,
    allocationCount: t._count.allocations,
    requestCount: t._count.requests,
    createdAt: t.createdAt,
    updatedAt: t.updatedAt,
  }));

  return formatListResponse(formatted, total, page, pageSize);
}

async function getTimeOffTypeById(id) {
  const type = await prisma.timeOffType.findUnique({
    where: { id },
    include: {
      _count: { select: { allocations: true, requests: true } },
    },
  });

  if (!type) {
    throw new AppError('TIME_OFF_TYPE_NOT_FOUND', 'Time off type not found', 404);
  }

  return {
    ...type,
    allocationCount: type._count.allocations,
    requestCount: type._count.requests,
  };
}

async function createTimeOffType(data) {
  const code = (data.code && data.code.trim())
    ? data.code.trim().toUpperCase()
    : data.name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 15);

  const existing = await prisma.timeOffType.findFirst({
    where: {
      OR: [
        { name: { equals: data.name.trim(), mode: 'insensitive' } },
        { code: { equals: code, mode: 'insensitive' } },
      ],
    },
  });

  if (existing) {
    throw new AppError('DUPLICATE_TIME_OFF_TYPE', 'Time off type name or code already exists', 409);
  }

  return prisma.timeOffType.create({
    data: {
      name: data.name.trim(),
      code,
      requiresAllocation: data.requiresAllocation !== undefined ? data.requiresAllocation : true,
      unit: data.unit || 'DAYS',
    },
  });
}

async function updateTimeOffType(id, data) {
  const type = await prisma.timeOffType.findUnique({ where: { id } });
  if (!type) {
    throw new AppError('TIME_OFF_TYPE_NOT_FOUND', 'Time off type not found', 404);
  }

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.code !== undefined) updateData.code = data.code.toUpperCase();
  if (data.requiresAllocation !== undefined) updateData.requiresAllocation = data.requiresAllocation;
  if (data.unit !== undefined) updateData.unit = data.unit;

  return prisma.timeOffType.update({
    where: { id },
    data: updateData,
  });
}

async function deleteTimeOffType(id) {
  const type = await prisma.timeOffType.findUnique({
    where: { id },
    include: { _count: { select: { allocations: true, requests: true } } },
  });

  if (!type) {
    throw new AppError('TIME_OFF_TYPE_NOT_FOUND', 'Time off type not found', 404);
  }

  if (type._count.allocations > 0 || type._count.requests > 0) {
    throw new AppError(
      'TIME_OFF_TYPE_IN_USE',
      'Cannot delete time off type that is referenced by allocations or requests',
      400
    );
  }

  await prisma.timeOffType.delete({ where: { id } });
  return { message: 'Time off type deleted successfully' };
}

module.exports = {
  listTimeOffTypes,
  getTimeOffTypeById,
  createTimeOffType,
  updateTimeOffType,
  deleteTimeOffType,
};
