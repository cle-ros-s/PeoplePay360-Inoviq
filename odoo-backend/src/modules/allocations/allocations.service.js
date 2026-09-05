const prisma = require('../../config/prisma');
const { getPaginationParams } = require('../../utils/pagination');
const { formatListResponse, AppError } = require('../../utils/responseFormatter');

async function listAllocations(query, scopedEmployeeId = null) {
  const { page, pageSize, skip, take } = getPaginationParams(query);
  const { employeeId, timeOffTypeId, status } = query;

  const where = {};
  if (scopedEmployeeId) {
    where.employeeId = scopedEmployeeId;
  } else if (employeeId) {
    where.employeeId = employeeId;
  }

  if (timeOffTypeId) {
    where.timeOffTypeId = timeOffTypeId;
  }

  if (status) {
    where.status = status;
  }

  const [allocations, total] = await Promise.all([
    prisma.leaveAllocation.findMany({
      where,
      skip,
      take,
      orderBy: { validFrom: 'desc' },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, email: true, jobPosition: true },
        },
        timeOffType: {
          select: { id: true, name: true, code: true, unit: true, requiresAllocation: true },
        },
      },
    }),
    prisma.leaveAllocation.count({ where }),
  ]);

  const formatted = allocations.map((a) => ({
    id: a.id,
    employeeId: a.employeeId,
    employee: a.employee,
    timeOffTypeId: a.timeOffTypeId,
    timeOffType: a.timeOffType,
    allocatedAmount: a.allocatedAmount,
    takenAmount: a.takenAmount,
    remainingAmount: Math.max(0, Math.round((a.allocatedAmount - a.takenAmount) * 100) / 100),
    validFrom: a.validFrom,
    validTo: a.validTo,
    status: a.status,
    createdAt: a.createdAt,
    updatedAt: a.updatedAt,
  }));

  return formatListResponse(formatted, total, page, pageSize);
}

async function getAllocationById(id, scopedEmployeeId = null) {
  const allocation = await prisma.leaveAllocation.findUnique({
    where: { id },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, email: true, jobPosition: true, departmentId: true },
      },
      timeOffType: true,
      requests: {
        orderBy: { startDate: 'desc' },
      },
    },
  });

  if (!allocation) {
    throw new AppError('ALLOCATION_NOT_FOUND', 'Leave allocation not found', 404);
  }

  if (scopedEmployeeId && allocation.employeeId !== scopedEmployeeId) {
    throw new AppError('FORBIDDEN', 'Access denied to this allocation record', 403);
  }

  return {
    ...allocation,
    remainingAmount: Math.max(0, Math.round((allocation.allocatedAmount - allocation.takenAmount) * 100) / 100),
  };
}

async function createAllocation(data) {
  const employee = await prisma.employee.findUnique({ where: { id: data.employeeId } });
  if (!employee) {
    throw new AppError('EMPLOYEE_NOT_FOUND', 'Target employee not found', 404);
  }

  const timeOffType = await prisma.timeOffType.findUnique({ where: { id: data.timeOffTypeId } });
  if (!timeOffType) {
    throw new AppError('TIME_OFF_TYPE_NOT_FOUND', 'Time off type not found', 404);
  }

  const validFrom = new Date(data.validFrom);
  const validTo = new Date(data.validTo);

  if (validTo <= validFrom) {
    throw new AppError('INVALID_DATE_RANGE', 'validTo must be strictly after validFrom', 422);
  }

  return prisma.leaveAllocation.create({
    data: {
      employeeId: data.employeeId,
      timeOffTypeId: data.timeOffTypeId,
      allocatedAmount: data.allocatedAmount,
      takenAmount: 0.0,
      validFrom,
      validTo,
      status: data.status || 'APPROVED',
    },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true } },
      timeOffType: { select: { id: true, name: true, code: true, unit: true } },
    },
  });
}

async function updateAllocation(id, data) {
  const allocation = await prisma.leaveAllocation.findUnique({ where: { id } });
  if (!allocation) {
    throw new AppError('ALLOCATION_NOT_FOUND', 'Leave allocation not found', 404);
  }

  const updateData = { ...data };
  if (updateData.validFrom) updateData.validFrom = new Date(updateData.validFrom);
  if (updateData.validTo) updateData.validTo = new Date(updateData.validTo);

  return prisma.leaveAllocation.update({
    where: { id },
    data: updateData,
    include: {
      employee: { select: { id: true, firstName: true, lastName: true } },
      timeOffType: { select: { id: true, name: true, code: true } },
    },
  });
}

async function deleteAllocation(id) {
  const allocation = await prisma.leaveAllocation.findUnique({
    where: { id },
    include: { requests: { take: 1 } },
  });

  if (!allocation) {
    throw new AppError('ALLOCATION_NOT_FOUND', 'Leave allocation not found', 404);
  }

  if (allocation.requests.length > 0) {
    throw new AppError('ALLOCATION_IN_USE', 'Cannot delete allocation linked to existing time-off requests', 400);
  }

  await prisma.leaveAllocation.delete({ where: { id } });
  return { message: 'Allocation deleted successfully' };
}

module.exports = {
  listAllocations,
  getAllocationById,
  createAllocation,
  updateAllocation,
  deleteAllocation,
};
