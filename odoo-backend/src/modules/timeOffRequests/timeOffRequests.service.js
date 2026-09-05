const prisma = require('../../config/prisma');
const { getPaginationParams } = require('../../utils/pagination');
const { formatListResponse, AppError } = require('../../utils/responseFormatter');
const { globalCache } = require('../../utils/cache');
const { invalidateDashboardCache } = require('../dashboard/dashboard.service');

function invalidateTimeOffRequestCache() {
  globalCache.invalidatePrefix('timeoff:');
  globalCache.invalidatePrefix('allocations:');
  invalidateDashboardCache();
}

async function listTimeOffRequests(query, scopedEmployeeId = null) {
  const { page, pageSize, skip, take } = getPaginationParams(query);
  const { employeeId, status, timeOffTypeId } = query;
  const cacheKey = `timeoff:list:${scopedEmployeeId || 'all'}:${employeeId || ''}:${status || ''}:${timeOffTypeId || ''}:${page}:${pageSize}`;

  return globalCache.getOrFetch(cacheKey, async () => {
    const where = {};
    if (scopedEmployeeId) {
      where.employeeId = scopedEmployeeId;
    } else if (employeeId) {
      where.employeeId = employeeId;
    }

    if (status) {
      where.status = status;
    }

    if (timeOffTypeId) {
      where.timeOffTypeId = timeOffTypeId;
    }

    const [requests, total] = await Promise.all([
      prisma.timeOffRequest.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              jobPosition: true,
              department: { select: { id: true, name: true } },
              user: { select: { id: true, role: true, email: true } },
            },
          },
          timeOffType: {
            select: { id: true, name: true, code: true, unit: true, requiresAllocation: true },
          },
          allocation: {
            select: { id: true, allocatedAmount: true, takenAmount: true },
          },
        },
      }),
      prisma.timeOffRequest.count({ where }),
    ]);

    const formattedRequests = requests.map((req) => ({
      ...req,
      employee: req.employee
        ? {
            ...req.employee,
            name: `${req.employee.firstName || ''} ${req.employee.lastName || ''}`.trim(),
            role: req.employee.user?.role || 'EMPLOYEE',
          }
        : null,
    }));

    return formatListResponse(formattedRequests, total, page, pageSize);
  }, 30000);
}

async function getTimeOffRequestById(id, scopedEmployeeId = null) {
  const cacheKey = `timeoff:detail:${id}`;

  const request = await globalCache.getOrFetch(cacheKey, async () => {
    const found = await prisma.timeOffRequest.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            jobPosition: true,
            department: { select: { id: true, name: true } },
          },
        },
        timeOffType: true,
        allocation: true,
      },
    });

    if (!found) {
      throw new AppError('TIME_OFF_REQUEST_NOT_FOUND', 'Time off request not found', 404);
    }
    return found;
  }, 30000);

  if (scopedEmployeeId && request.employeeId !== scopedEmployeeId) {
    throw new AppError('FORBIDDEN', 'Access denied to this time-off request', 403);
  }

  if (request.employee) {
    request.employee.name = `${request.employee.firstName || ''} ${request.employee.lastName || ''}`.trim();
  }

  return request;
}

async function createTimeOffRequest(data, user) {
  let targetEmployeeId = user.role === 'EMPLOYEE' ? user.employeeId : (data.employeeId || user.employeeId);

  if (!targetEmployeeId) {
    const firstEmp = await prisma.employee.findFirst({ where: { status: 'ACTIVE' } });
    if (firstEmp) {
      targetEmployeeId = firstEmp.id;
    } else {
      throw new AppError('EMPLOYEE_REQUIRED', 'Employee ID is required for time-off request', 400);
    }
  }

  const timeOffType = await prisma.timeOffType.findUnique({ where: { id: data.timeOffTypeId } });
  if (!timeOffType) {
    throw new AppError('TIME_OFF_TYPE_NOT_FOUND', 'Time off type not found', 404);
  }

  const startDate = new Date(data.startDate);
  const endDate = new Date(data.endDate);

  if (endDate < startDate) {
    throw new AppError('INVALID_DATE_RANGE', 'endDate must be on or after startDate', 422);
  }

  const result = await prisma.timeOffRequest.create({
    data: {
      employeeId: targetEmployeeId,
      timeOffTypeId: data.timeOffTypeId,
      startDate,
      endDate,
      duration: data.duration,
      reason: data.reason || null,
      status: 'PENDING',
    },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true } },
      timeOffType: { select: { id: true, name: true, code: true, unit: true } },
    },
  });

  invalidateTimeOffRequestCache();
  return result;
}

async function executeTx(fn) {
  try {
    return await prisma.$transaction(fn, { maxWait: 10000, timeout: 20000 });
  } catch (err) {
    if (err.code === 'P2028' || err.message?.includes('Transaction')) {
      return await prisma.$transaction(fn, { maxWait: 10000, timeout: 20000 });
    }
    throw err;
  }
}

async function approveTimeOffRequest(id, user) {
  const result = await executeTx(async (tx) => {
    const request = await tx.timeOffRequest.findUnique({
      where: { id },
      include: { timeOffType: true },
    });

    if (!request) {
      throw new AppError('TIME_OFF_REQUEST_NOT_FOUND', 'Time off request not found', 404);
    }

    if (request.status === 'APPROVED') {
      throw new AppError('ALREADY_APPROVED', 'Time off request is already approved', 400);
    }

    // If type requires allocation, find matching active allocation
    if (request.timeOffType.requiresAllocation) {
      const allocation = await tx.leaveAllocation.findFirst({
        where: {
          employeeId: request.employeeId,
          timeOffTypeId: request.timeOffTypeId,
          status: 'APPROVED',
          validFrom: { lte: request.startDate },
          validTo: { gte: request.endDate },
        },
      });

      if (!allocation) {
        throw new AppError(
          'INSUFFICIENT_TIME_OFF_BALANCE',
          `No approved allocation found covering period ${request.startDate.toISOString().slice(0, 10)} to ${request.endDate.toISOString().slice(0, 10)} for this leave type`,
          409
        );
      }

      const availableBalance = allocation.allocatedAmount - allocation.takenAmount;
      if (availableBalance < request.duration) {
        throw new AppError(
          'INSUFFICIENT_TIME_OFF_BALANCE',
          `Insufficient leave balance. Available: ${availableBalance}, Requested: ${request.duration}`,
          409
        );
      }

      // Deduct atomically
      await tx.leaveAllocation.update({
        where: { id: allocation.id },
        data: {
          takenAmount: allocation.takenAmount + request.duration,
        },
      });

      return tx.timeOffRequest.update({
        where: { id },
        data: {
          status: 'APPROVED',
          allocationId: allocation.id,
          approvedByUserId: user.id,
          refusalReason: null,
        },
        include: {
          employee: { select: { id: true, firstName: true, lastName: true } },
          timeOffType: { select: { id: true, name: true, code: true } },
          allocation: true,
        },
      });
    }

    // Type does not require allocation
    return tx.timeOffRequest.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedByUserId: user.id,
        refusalReason: null,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        timeOffType: { select: { id: true, name: true, code: true } },
      },
    });
  });

  invalidateTimeOffRequestCache();
  return result;
}

async function refuseTimeOffRequest(id, refusalReason, user) {
  const result = await executeTx(async (tx) => {
    const request = await tx.timeOffRequest.findUnique({
      where: { id },
      include: { allocation: true },
    });

    if (!request) {
      throw new AppError('TIME_OFF_REQUEST_NOT_FOUND', 'Time off request not found', 404);
    }

    // If request was previously approved and deducted from an allocation, refund it
    if (request.status === 'APPROVED' && request.allocationId && request.allocation) {
      await tx.leaveAllocation.update({
        where: { id: request.allocationId },
        data: {
          takenAmount: Math.max(0, request.allocation.takenAmount - request.duration),
        },
      });
    }

    return tx.timeOffRequest.update({
      where: { id },
      data: {
        status: 'REFUSED',
        refusalReason: refusalReason || 'Request refused by manager',
        approvedByUserId: user.id,
      },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true } },
        timeOffType: { select: { id: true, name: true, code: true } },
      },
    });
  });

  invalidateTimeOffRequestCache();
  return result;
}

async function updateTimeOffRequest(id, data, scopedEmployeeId = null) {
  const request = await prisma.timeOffRequest.findUnique({ where: { id } });
  if (!request) {
    throw new AppError('TIME_OFF_REQUEST_NOT_FOUND', 'Time off request not found', 404);
  }

  if (scopedEmployeeId && request.employeeId !== scopedEmployeeId) {
    throw new AppError('FORBIDDEN', 'Access denied to this time-off request', 403);
  }

  if (request.status === 'APPROVED') {
    throw new AppError('CANNOT_MODIFY_APPROVED', 'Approved requests cannot be directly modified; refuse or re-submit instead', 400);
  }

  const updateData = { ...data };
  if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
  if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

  const result = await prisma.timeOffRequest.update({
    where: { id },
    data: updateData,
    include: {
      employee: { select: { id: true, firstName: true, lastName: true } },
      timeOffType: { select: { id: true, name: true, code: true } },
    },
  });

  invalidateTimeOffRequestCache();
  return result;
}

async function deleteTimeOffRequest(id, scopedEmployeeId = null) {
  const request = await prisma.timeOffRequest.findUnique({ where: { id } });
  if (!request) {
    throw new AppError('TIME_OFF_REQUEST_NOT_FOUND', 'Time off request not found', 404);
  }

  if (scopedEmployeeId && request.employeeId !== scopedEmployeeId) {
    throw new AppError('FORBIDDEN', 'Access denied to this time-off request', 403);
  }

  if (request.status === 'APPROVED') {
    throw new AppError('CANNOT_DELETE_APPROVED', 'Approved time-off requests cannot be deleted directly', 400);
  }

  await prisma.timeOffRequest.delete({ where: { id } });
  invalidateTimeOffRequestCache();
  return { message: 'Time off request deleted successfully' };
}

module.exports = {
  listTimeOffRequests,
  getTimeOffRequestById,
  createTimeOffRequest,
  approveTimeOffRequest,
  refuseTimeOffRequest,
  updateTimeOffRequest,
  deleteTimeOffRequest,
  invalidateTimeOffRequestCache,
};
