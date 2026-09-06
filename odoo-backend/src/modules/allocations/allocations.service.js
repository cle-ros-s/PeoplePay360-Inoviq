const prisma = require('../../config/prisma');
const { getPaginationParams } = require('../../utils/pagination');
const { formatListResponse, AppError } = require('../../utils/responseFormatter');
const { globalCache } = require('../../utils/cache');
const { invalidateDashboardCache } = require('../dashboard/dashboard.service');

function invalidateAllocationCache() {
  globalCache.invalidatePrefix('allocations:');
  globalCache.invalidatePrefix('timeoff:');
  invalidateDashboardCache();
}

async function listAllocations(query, scopedEmployeeId = null) {
  const { page, pageSize, skip, take } = getPaginationParams(query);
  const { employeeId, timeOffTypeId, status } = query;
  const cacheKey = `allocations:list:${scopedEmployeeId || 'all'}:${employeeId || ''}:${timeOffTypeId || ''}:${status || ''}:${page}:${pageSize}`;

  return globalCache.getOrFetch(cacheKey, async () => {
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
      employee: a.employee
        ? {
            ...a.employee,
            name: `${a.employee.firstName || ''} ${a.employee.lastName || ''}`.trim(),
          }
        : null,
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
  }, 30000);
}

async function getAllocationById(id, scopedEmployeeId = null) {
  const cacheKey = `allocations:detail:${id}`;

  const allocation = await globalCache.getOrFetch(cacheKey, async () => {
    const found = await prisma.leaveAllocation.findUnique({
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

    if (!found) {
      throw new AppError('ALLOCATION_NOT_FOUND', 'Leave allocation not found', 404);
    }

    return {
      ...found,
      remainingAmount: Math.max(0, Math.round((found.allocatedAmount - found.takenAmount) * 100) / 100),
    };
  }, 30000);

  if (scopedEmployeeId && allocation.employeeId !== scopedEmployeeId) {
    throw new AppError('FORBIDDEN', 'Access denied to this allocation record', 403);
  }

  return allocation;
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

  const result = await prisma.leaveAllocation.create({
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

  invalidateAllocationCache();
  return result;
}

async function updateAllocation(id, data) {
  const allocation = await prisma.leaveAllocation.findUnique({ where: { id } });
  if (!allocation) {
    throw new AppError('ALLOCATION_NOT_FOUND', 'Leave allocation not found', 404);
  }

  const updateData = { ...data };
  if (updateData.validFrom) updateData.validFrom = new Date(updateData.validFrom);
  if (updateData.validTo) updateData.validTo = new Date(updateData.validTo);

  const result = await prisma.leaveAllocation.update({
    where: { id },
    data: updateData,
    include: {
      employee: { select: { id: true, firstName: true, lastName: true } },
      timeOffType: { select: { id: true, name: true, code: true } },
    },
  });

  invalidateAllocationCache();
  return result;
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
  invalidateAllocationCache();
  return { message: 'Allocation deleted successfully' };
}

async function bulkApproveAllocations(ids) {
  let targetIds = ids;
  if (!targetIds || targetIds.length === 0) {
    const pending = await prisma.leaveAllocation.findMany({
      where: { status: { in: ['SUBMITTED', 'DRAFT', 'PENDING'] } },
      select: { id: true },
    });
    targetIds = pending.map((p) => p.id);
  }

  const result = await prisma.leaveAllocation.updateMany({
    where: { id: { in: targetIds } },
    data: { status: 'APPROVED' },
  });

  invalidateAllocationCache();
  return { approved: result.count };
}

async function bulkRefuseAllocations(ids) {
  let targetIds = ids;
  if (!targetIds || targetIds.length === 0) {
    const pending = await prisma.leaveAllocation.findMany({
      where: { status: { in: ['SUBMITTED', 'DRAFT', 'PENDING'] } },
      select: { id: true },
    });
    targetIds = pending.map((p) => p.id);
  }

  const result = await prisma.leaveAllocation.updateMany({
    where: { id: { in: targetIds } },
    data: { status: 'REFUSED' },
  });

  invalidateAllocationCache();
  return { refused: result.count };
}

module.exports = {
  listAllocations,
  getAllocationById,
  createAllocation,
  updateAllocation,
  deleteAllocation,
  invalidateAllocationCache,
  bulkApproveAllocations,
  bulkRefuseAllocations,
};

