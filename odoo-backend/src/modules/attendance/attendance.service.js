const prisma = require('../../config/prisma');
const { deriveAttendanceStatus } = require('./attendance.status');
const { getPaginationParams } = require('../../utils/pagination');
const { formatListResponse, AppError } = require('../../utils/responseFormatter');

const { globalCache } = require('../../utils/cache');
const { invalidateDashboardCache } = require('../dashboard/dashboard.service');

function invalidateAttendanceCache() {
  globalCache.invalidatePrefix('attendance:');
  invalidateDashboardCache();
}

async function listAttendance(query, scopedEmployeeId = null) {
  const { page, pageSize, skip, take } = getPaginationParams(query);
  const { employeeId, status, from, to } = query;
  const cacheKey = `attendance:list:${scopedEmployeeId || 'all'}:${employeeId || ''}:${status || ''}:${from || ''}:${to || ''}:${page}:${pageSize}`;

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

    if (from || to) {
      where.checkIn = {};
      if (from) where.checkIn.gte = new Date(from);
      if (to) where.checkIn.lte = new Date(to);
    }

    const [records, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        skip,
        take,
        orderBy: { checkIn: 'desc' },
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
        },
      }),
      prisma.attendance.count({ where }),
    ]);

    const formattedRecords = records.map((r) => ({
      ...r,
      employee: r.employee
        ? {
            ...r.employee,
            name: `${r.employee.firstName || ''} ${r.employee.lastName || ''}`.trim(),
          }
        : null,
    }));

    return formatListResponse(formattedRecords, total, page, pageSize);
  }, 30000);
}

async function getAttendanceById(id, scopedEmployeeId = null) {
  const cacheKey = `attendance:detail:${id}`;

  const record = await globalCache.getOrFetch(cacheKey, async () => {
    const found = await prisma.attendance.findUnique({
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
      },
    });

    if (!found) {
      throw new AppError('ATTENDANCE_NOT_FOUND', 'Attendance record not found', 404);
    }
    return found;
  }, 30000);

  if (scopedEmployeeId && record.employeeId !== scopedEmployeeId) {
    throw new AppError('FORBIDDEN', 'Access denied to this attendance record', 403);
  }

  return record;
}

async function checkIn(data, user) {
  const targetEmployeeId = user.role === 'EMPLOYEE' ? user.employeeId : (data.employeeId || user.employeeId);

  if (!targetEmployeeId) {
    throw new AppError('EMPLOYEE_REQUIRED', 'Employee ID is required for check-in', 400);
  }

  // Prevent multiple open check-ins without checkout
  const activeCheckIn = await prisma.attendance.findFirst({
    where: {
      employeeId: targetEmployeeId,
      checkOut: null,
    },
  });

  if (activeCheckIn) {
    throw new AppError('ACTIVE_CHECKIN_EXISTS', 'Employee already has an active check-in without check-out', 409);
  }

  const checkInTime = data.checkIn ? new Date(data.checkIn) : new Date();

  const result = await prisma.attendance.create({
    data: {
      employeeId: targetEmployeeId,
      checkIn: checkInTime,
      checkOut: null,
      workedHours: null,
      status: 'MISSING_CHECKOUT',
      note: data.note || null,
    },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  invalidateAttendanceCache();
  return result;
}

async function checkOut(id, data, user) {
  const record = await prisma.attendance.findUnique({
    where: { id },
    include: {
      employee: {
        include: {
          schedule: {
            include: { lines: true },
          },
        },
      },
    },
  });

  if (!record) {
    throw new AppError('ATTENDANCE_NOT_FOUND', 'Attendance record not found', 404);
  }

  if (user.role === 'EMPLOYEE' && record.employeeId !== user.employeeId) {
    throw new AppError('FORBIDDEN', 'Cannot check out for another employee', 403);
  }

  if (record.checkOut) {
    throw new AppError('ALREADY_CHECKED_OUT', 'This attendance entry has already been checked out', 400);
  }

  const checkOutTime = data.checkOut ? new Date(data.checkOut) : new Date();

  if (checkOutTime <= record.checkIn) {
    throw new AppError('INVALID_CHECKOUT_TIME', 'Check-out time must be after check-in time', 422);
  }

  const { workedHours, status } = deriveAttendanceStatus(
    record.checkIn,
    checkOutTime,
    record.employee.schedule
  );

  const result = await prisma.attendance.update({
    where: { id },
    data: {
      checkOut: checkOutTime,
      workedHours,
      status,
    },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  invalidateAttendanceCache();
  return result;
}

async function updateAttendance(id, data, user) {
  const record = await prisma.attendance.findUnique({
    where: { id },
    include: {
      employee: {
        include: {
          schedule: { include: { lines: true } },
        },
      },
    },
  });

  if (!record) {
    throw new AppError('ATTENDANCE_NOT_FOUND', 'Attendance record not found', 404);
  }

  const checkIn = data.checkIn ? new Date(data.checkIn) : record.checkIn;
  const checkOut = data.checkOut !== undefined ? (data.checkOut ? new Date(data.checkOut) : null) : record.checkOut;

  let workedHours = data.workedHours;
  let status = data.status;

  if (checkOut && checkIn) {
    if (checkOut <= checkIn) {
      throw new AppError('INVALID_TIME_RANGE', 'Check-out time must be after check-in time', 422);
    }
    const diffMs = checkOut.getTime() - checkIn.getTime();
    workedHours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;

    if (status === undefined) {
      const derived = deriveAttendanceStatus(checkIn, checkOut, record.employee.schedule);
      status = derived.status;
    }
  } else if (!checkOut) {
    workedHours = null;
    status = 'MISSING_CHECKOUT';
  }

  const noteContent = data.notes !== undefined ? data.notes : (data.note !== undefined ? data.note : record.note);

  const result = await prisma.attendance.update({
    where: { id },
    data: {
      checkIn,
      checkOut,
      workedHours,
      status: status || record.status,
      isManualEdit: true,
      correctedByUserId: user.id,
      note: noteContent,
    },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });

  invalidateAttendanceCache();
  return result;
}

async function deleteAttendance(id) {
  const record = await prisma.attendance.findUnique({ where: { id } });
  if (!record) {
    throw new AppError('ATTENDANCE_NOT_FOUND', 'Attendance record not found', 404);
  }

  await prisma.attendance.delete({ where: { id } });
  invalidateAttendanceCache();
  return { message: 'Attendance record deleted successfully' };
}

module.exports = {
  listAttendance,
  getAttendanceById,
  checkIn,
  checkOut,
  updateAttendance,
  deleteAttendance,
  invalidateAttendanceCache,
};
