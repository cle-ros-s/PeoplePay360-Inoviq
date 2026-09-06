const prisma = require('../../config/prisma');
const { getPaginationParams } = require('../../utils/pagination');
const { formatListResponse, AppError } = require('../../utils/responseFormatter');

const DEFAULT_THRESHOLD_DAYS = 7;

/**
 * Get configured absence alert threshold days
 */
async function getAlertDaysThreshold() {
  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: 'ABSENCE_ALERT_DAYS' },
    });
    if (setting && setting.value) {
      const parsed = parseInt(setting.value, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch (err) {
    console.warn('[SystemSetting Warning]: Failed reading ABSENCE_ALERT_DAYS:', err.message);
  }
  return DEFAULT_THRESHOLD_DAYS;
}

/**
 * Update configured absence alert threshold days
 */
async function updateAlertDaysThreshold(thresholdDays) {
  const parsed = parseInt(thresholdDays, 10);
  if (isNaN(parsed) || parsed < 1) {
    throw new AppError('INVALID_THRESHOLD', 'Threshold days must be a positive integer', 422);
  }

  const result = await prisma.systemSetting.upsert({
    where: { key: 'ABSENCE_ALERT_DAYS' },
    update: { value: String(parsed), description: 'Consecutive missing attendance days required to trigger an HR/Payroll risk alert.' },
    create: { key: 'ABSENCE_ALERT_DAYS', value: String(parsed), description: 'Consecutive missing attendance days required to trigger an HR/Payroll risk alert.' },
  });

  return {
    thresholdDays: parseInt(result.value, 10),
    message: `Absence alert threshold updated to ${result.value} days.`,
  };
}

/**
 * Normalizes a date to UTC midnight (YYYY-MM-DDT00:00:00.000Z)
 */
function toMidnightUTC(date) {
  const d = new Date(date);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

/**
 * Checks if a date is a scheduled working day for the given schedule
 */
function isScheduledWorkingDay(date, schedule) {
  const dayOfWeek = date.getUTCDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
  if (schedule && schedule.lines && schedule.lines.length > 0) {
    return schedule.lines.some((l) => l.dayOfWeek === dayOfWeek);
  }
  // Default Mon-Fri
  return dayOfWeek >= 1 && dayOfWeek <= 5;
}

/**
 * Core absence evaluation logic for an employee given pre-loaded records
 */
function evaluateEmployeeAbsence(employee, attendances, timeOffRequests, activePayruns, evaluationDate, threshold) {
  const evalDate = toMidnightUTC(evaluationDate);
  const activeContract = employee.contracts && employee.contracts.length > 0 ? employee.contracts[0] : null;
  const applicableSchedule = activeContract?.schedule || employee.schedule;

  // Filter attendances up to evalDate
  const evalEnd = new Date(Date.UTC(evalDate.getUTCFullYear(), evalDate.getUTCMonth(), evalDate.getUTCDate(), 23, 59, 59, 999));
  const empAttendances = attendances
    .filter((a) => a.employeeId === employee.id && new Date(a.checkIn) <= evalEnd)
    .sort((a, b) => new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime());

  const empLeaves = timeOffRequests.filter((t) => t.employeeId === employee.id);

  const latestAttendance = empAttendances.length > 0 ? empAttendances[0] : null;
  const lastAttendanceDate = latestAttendance ? new Date(latestAttendance.checkIn) : null;

  const maxLookbackDays = 60;
  const missingDays = [];
  let pendingLeaveFound = false;

  for (let i = 0; i < maxLookbackDays; i++) {
    const checkDate = new Date(evalDate.getTime() - i * 24 * 60 * 60 * 1000);
    const dayStart = new Date(Date.UTC(checkDate.getUTCFullYear(), checkDate.getUTCMonth(), checkDate.getUTCDate(), 0, 0, 0));
    const dayEnd = new Date(Date.UTC(checkDate.getUTCFullYear(), checkDate.getUTCMonth(), checkDate.getUTCDate(), 23, 59, 59, 999));

    // If date is before active contract start date, break
    if (activeContract && new Date(activeContract.startDate) > dayEnd) {
      break;
    }

    // Check if this date is a scheduled working day
    const isWorkingDay = isScheduledWorkingDay(checkDate, applicableSchedule);
    if (!isWorkingDay) {
      continue;
    }

    // Check if attendance exists on this day
    const hasAttendance = empAttendances.some((a) => {
      const aDate = new Date(a.checkIn);
      return aDate >= dayStart && aDate <= dayEnd;
    });

    if (hasAttendance) {
      break;
    }

    // Check if approved or pending leave covers this day
    const coveringLeave = empLeaves.find((t) => {
      const lStart = toMidnightUTC(t.startDate);
      const lEnd = toMidnightUTC(t.endDate);
      return dayStart >= lStart && dayStart <= lEnd;
    });

    if (coveringLeave) {
      if (coveringLeave.status === 'APPROVED') {
        break;
      } else if (coveringLeave.status === 'PENDING') {
        pendingLeaveFound = true;
      }
    }

    missingDays.push(dayStart);
  }

  const consecutiveMissingWorkingDays = missingDays.length;
  if (consecutiveMissingWorkingDays < threshold) {
    return null;
  }

  missingDays.sort((a, b) => a.getTime() - b.getTime());
  const absenceStartDate = missingDays[0];
  const absenceEndDate = missingDays[missingDays.length - 1];

  // 14-day history calculation prior to absenceStartDate
  const historyStart = new Date(absenceStartDate.getTime() - 14 * 24 * 60 * 60 * 1000);
  const historyEnd = new Date(absenceStartDate.getTime() - 1);

  const historyAttendances = empAttendances.filter((a) => {
    const aDate = new Date(a.checkIn);
    return aDate >= historyStart && aDate <= historyEnd;
  });

  let totalHoursWorked = 0;
  let totalDaysWorked = 0;
  const historySummary = [];

  for (let d = 14; d >= 1; d--) {
    const targetDate = new Date(absenceStartDate.getTime() - d * 24 * 60 * 60 * 1000);
    const dayStart = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), 0, 0, 0));
    const dayEnd = new Date(Date.UTC(targetDate.getUTCFullYear(), targetDate.getUTCMonth(), targetDate.getUTCDate(), 23, 59, 59, 999));

    const dayRecord = historyAttendances.find((a) => {
      const aDate = new Date(a.checkIn);
      return aDate >= dayStart && aDate <= dayEnd;
    });

    const isWorking = isScheduledWorkingDay(targetDate, applicableSchedule);

    if (dayRecord) {
      const hours = dayRecord.workedHours || 8.0;
      totalHoursWorked += hours;
      totalDaysWorked += 1;
      historySummary.push({
        date: dayStart.toISOString(),
        formattedDate: dayStart.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
        checkIn: dayRecord.checkIn ? new Date(dayRecord.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—',
        checkOut: dayRecord.checkOut ? new Date(dayRecord.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '—',
        workedHours: Math.round(hours * 100) / 100,
        status: dayRecord.status || 'PRESENT',
        isWorkingDay: isWorking,
      });
    } else {
      historySummary.push({
        date: dayStart.toISOString(),
        formattedDate: dayStart.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
        checkIn: '—',
        checkOut: '—',
        workedHours: 0,
        status: isWorking ? 'ABSENT' : 'OFF_DAY',
        isWorkingDay: isWorking,
      });
    }
  }

  totalHoursWorked = Math.round(totalHoursWorked * 100) / 100;
  const averageHoursPerDay = totalDaysWorked > 0 ? Math.round((totalHoursWorked / totalDaysWorked) * 100) / 100 : 0;

  // Active payrun matching
  const empActivePayrun = activePayruns.find((pr) =>
    pr.payrunEmployees && pr.payrunEmployees.some((pe) => pe.employeeId === employee.id)
  );

  return {
    employeeId: employee.id,
    departmentId: employee.departmentId,
    contractId: activeContract?.id || null,
    alertType: 'CONSECUTIVE_ABSENCE',
    thresholdDays: threshold,
    consecutiveDaysAbsent: consecutiveMissingWorkingDays,
    absenceStartDate,
    absenceEndDate,
    lastAttendanceDate,
    totalDaysWorked,
    totalHoursWorked,
    averageHoursPerDay,
    leaveStatus: pendingLeaveFound ? 'PENDING_REQUEST' : 'NO_REQUEST',
    payrollImpact: empActivePayrun ? 'ACTIVE_PAYRUN_INCLUDED' : 'REQUIRES_HR_REVIEW',
    activePayrunId: empActivePayrun?.id || null,
    historySummary,
  };
}

/**
 * Checks single employee for consecutive missing scheduled attendance days
 */
async function checkEmployeeAbsenceRisk(employeeId, evaluationDate = new Date(), thresholdDays = null) {
  const threshold = thresholdDays || (await getAlertDaysThreshold());
  const evalDate = toMidnightUTC(evaluationDate);

  const [employee, attendances, timeOffRequests, activePayruns] = await Promise.all([
    prisma.employee.findUnique({
      where: { id: employeeId },
      include: {
        department: true,
        schedule: { include: { lines: true } },
        contracts: {
          where: { status: 'RUNNING' },
          orderBy: { startDate: 'desc' },
          take: 1,
          include: { schedule: { include: { lines: true } } },
        },
      },
    }),
    prisma.attendance.findMany({
      where: { employeeId },
      orderBy: { checkIn: 'desc' },
    }),
    prisma.timeOffRequest.findMany({
      where: {
        employeeId,
        status: { in: ['APPROVED', 'PENDING'] },
      },
    }),
    prisma.payrun.findMany({
      where: { status: { in: ['DRAFT', 'COMPUTED', 'VALIDATED'] } },
      include: { payrunEmployees: true },
    }),
  ]);

  if (!employee || employee.status === 'TERMINATED' || employee.status === 'INACTIVE') {
    return null;
  }

  const alertData = evaluateEmployeeAbsence(employee, attendances, timeOffRequests, activePayruns, evalDate, threshold);
  if (!alertData) return null;

  const alert = await prisma.attendanceAlert.upsert({
    where: {
      employeeId_absenceStartDate_alertType: {
        employeeId: alertData.employeeId,
        absenceStartDate: alertData.absenceStartDate,
        alertType: alertData.alertType,
      },
    },
    update: {
      consecutiveDaysAbsent: alertData.consecutiveDaysAbsent,
      absenceEndDate: alertData.absenceEndDate,
      lastAttendanceDate: alertData.lastAttendanceDate,
      thresholdDays: alertData.thresholdDays,
      departmentId: alertData.departmentId,
      contractId: alertData.contractId,
      totalDaysWorked: alertData.totalDaysWorked,
      totalHoursWorked: alertData.totalHoursWorked,
      averageHoursPerDay: alertData.averageHoursPerDay,
      leaveStatus: alertData.leaveStatus,
      payrollImpact: alertData.payrollImpact,
      activePayrunId: alertData.activePayrunId,
      historySummary: alertData.historySummary,
    },
    create: {
      ...alertData,
      status: 'OPEN',
    },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          jobPosition: true,
          employeeType: true,
          department: { select: { id: true, name: true } },
        },
      },
      department: { select: { id: true, name: true } },
      contract: { select: { id: true, name: true, wage: true, status: true } },
    },
  });

  return alert;
}

/**
 * Runs attendance risk detection across all active employees in bulk
 */
async function runAttendanceRiskCheck(evaluationDate = new Date()) {
  const threshold = await getAlertDaysThreshold();
  const evalDate = toMidnightUTC(evaluationDate);

  // Bulk load all active employees, attendances, leaves, and payruns in parallel
  const [activeEmployees, attendances, timeOffRequests, activePayruns] = await Promise.all([
    prisma.employee.findMany({
      where: { status: 'ACTIVE' },
      include: {
        department: true,
        schedule: { include: { lines: true } },
        contracts: {
          where: { status: 'RUNNING' },
          orderBy: { startDate: 'desc' },
          take: 1,
          include: { schedule: { include: { lines: true } } },
        },
      },
    }),
    prisma.attendance.findMany({
      select: { employeeId: true, checkIn: true, checkOut: true, workedHours: true, status: true },
      orderBy: { checkIn: 'desc' },
    }),
    prisma.timeOffRequest.findMany({
      where: { status: { in: ['APPROVED', 'PENDING'] } },
      select: { employeeId: true, startDate: true, endDate: true, status: true },
    }),
    prisma.payrun.findMany({
      where: { status: { in: ['DRAFT', 'COMPUTED', 'VALIDATED'] } },
      include: { payrunEmployees: true },
    }),
  ]);

  const alertCandidates = [];
  for (const emp of activeEmployees) {
    const alertData = evaluateEmployeeAbsence(emp, attendances, timeOffRequests, activePayruns, evalDate, threshold);
    if (alertData) {
      alertCandidates.push(alertData);
    }
  }

  // Delta check: only upsert alerts that are new or whose absent days changed
  const existingAlerts = await prisma.attendanceAlert.findMany({
    select: { id: true, employeeId: true, absenceStartDate: true, consecutiveDaysAbsent: true },
  });
  const existingMap = new Map();
  for (const ea of existingAlerts) {
    const key = `${ea.employeeId}_${toMidnightUTC(ea.absenceStartDate).toISOString()}`;
    existingMap.set(key, ea);
  }

  const toUpsert = alertCandidates.filter((ac) => {
    const key = `${ac.employeeId}_${toMidnightUTC(ac.absenceStartDate).toISOString()}`;
    const existing = existingMap.get(key);
    return !existing || existing.consecutiveDaysAbsent !== ac.consecutiveDaysAbsent;
  });

  // Persist alerts via chunked upsert (chunk size 8 to stay within DB connection limits)
  const savedAlerts = [];
  const chunkSize = 8;
  for (let i = 0; i < toUpsert.length; i += chunkSize) {
    const chunk = toUpsert.slice(i, i + chunkSize);
    const chunkResults = await Promise.all(
      chunk.map((alertData) =>
        prisma.attendanceAlert.upsert({
          where: {
            employeeId_absenceStartDate_alertType: {
              employeeId: alertData.employeeId,
              absenceStartDate: alertData.absenceStartDate,
              alertType: alertData.alertType,
            },
          },
          update: {
            consecutiveDaysAbsent: alertData.consecutiveDaysAbsent,
            absenceEndDate: alertData.absenceEndDate,
            lastAttendanceDate: alertData.lastAttendanceDate,
            thresholdDays: alertData.thresholdDays,
            departmentId: alertData.departmentId,
            contractId: alertData.contractId,
            totalDaysWorked: alertData.totalDaysWorked,
            totalHoursWorked: alertData.totalHoursWorked,
            averageHoursPerDay: alertData.averageHoursPerDay,
            leaveStatus: alertData.leaveStatus,
            payrollImpact: alertData.payrollImpact,
            activePayrunId: alertData.activePayrunId,
            historySummary: alertData.historySummary,
          },
          create: {
            ...alertData,
            status: 'OPEN',
          },
        })
      )
    );
    savedAlerts.push(...chunkResults);
  }

  return {
    scannedEmployees: activeEmployees.length,
    alertsTriggered: alertCandidates.length,
    newAlertsCount: toUpsert.length,
    thresholdDays: threshold,
    alerts: alertCandidates,
  };
}

/**
 * Lists attendance alerts with pagination, filtering, and role scoping
 */
async function listAttendanceAlerts(query, scopedEmployeeId = null) {
  const { page, pageSize, skip, take } = getPaginationParams(query);
  const { status, departmentId, employeeId, employeeType, search, from, to } = query;

  const where = {};

  if (scopedEmployeeId) {
    where.employeeId = scopedEmployeeId;
  } else if (employeeId) {
    where.employeeId = employeeId;
  }

  if (status) {
    where.status = status;
  }

  if (departmentId) {
    where.departmentId = departmentId;
  }

  if (employeeType) {
    where.employee = { employeeType };
  }

  if (search) {
    where.employee = {
      ...where.employee,
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    };
  }

  if (from || to) {
    where.absenceStartDate = {};
    if (from) where.absenceStartDate.gte = new Date(from);
    if (to) where.absenceStartDate.lte = new Date(to);
  }

  const [alerts, total] = await Promise.all([
    prisma.attendanceAlert.findMany({
      where,
      skip,
      take,
      orderBy: [{ status: 'asc' }, { consecutiveDaysAbsent: 'desc' }, { absenceStartDate: 'desc' }],
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            jobPosition: true,
            employeeType: true,
            department: { select: { id: true, name: true } },
          },
        },
        department: { select: { id: true, name: true } },
        contract: { select: { id: true, name: true, wage: true, status: true } },
        resolvedByUser: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.attendanceAlert.count({ where }),
  ]);

  const formattedAlerts = alerts.map((a) => ({
    ...a,
    missingDays: a.consecutiveDaysAbsent,
    severity: a.consecutiveDaysAbsent >= 10 ? 'HIGH' : 'MEDIUM',
    preAbsenceSummary: {
      totalWorkedHours: a.totalHoursWorked || 0,
      averageDailyHours: a.averageHoursPerDay || 0,
      historicalAttendance: Array.isArray(a.historySummary) ? a.historySummary : (a.historySummary?.historicalAttendance || []),
    },
    employee: a.employee
      ? {
          ...a.employee,
          name: `${a.employee.firstName || ''} ${a.employee.lastName || ''}`.trim(),
        }
      : null,
  }));

  return formatListResponse(formattedAlerts, total, page, pageSize);
}

/**
 * Gets attendance alert by ID with full details
 */
async function getAttendanceAlertById(id, scopedEmployeeId = null) {
  const alert = await prisma.attendanceAlert.findUnique({
    where: { id },
    include: {
      employee: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          jobPosition: true,
          employeeType: true,
          status: true,
          department: { select: { id: true, name: true } },
          schedule: {
            select: {
              id: true,
              name: true,
              totalWeeklyHours: true,
              lines: { orderBy: { dayOfWeek: 'asc' } },
            },
          },
        },
      },
      department: { select: { id: true, name: true, code: true } },
      contract: {
        select: {
          id: true,
          name: true,
          wage: true,
          startDate: true,
          endDate: true,
          status: true,
          salaryStructure: { select: { id: true, name: true } },
        },
      },
      resolvedByUser: { select: { id: true, name: true, email: true } },
    },
  });

  if (!alert) {
    throw new AppError('ALERT_NOT_FOUND', 'Attendance alert record not found', 404);
  }

  if (scopedEmployeeId && alert.employeeId !== scopedEmployeeId) {
    throw new AppError('FORBIDDEN', 'You are not authorized to view this alert', 403);
  }

  // If requested by an employee, sanitize sensitive payroll/salary data
  if (scopedEmployeeId) {
    return {
      id: alert.id,
      employeeId: alert.employeeId,
      employeeName: `${alert.employee?.firstName || ''} ${alert.employee?.lastName || ''}`.trim(),
      lastAttendanceDate: alert.lastAttendanceDate,
      absenceStartDate: alert.absenceStartDate,
      absenceEndDate: alert.absenceEndDate,
      consecutiveDaysAbsent: alert.consecutiveDaysAbsent,
      missingDays: alert.consecutiveDaysAbsent,
      severity: alert.consecutiveDaysAbsent >= 10 ? 'HIGH' : 'MEDIUM',
      leaveStatus: alert.leaveStatus,
      status: alert.status,
      createdAt: alert.createdAt,
    };
  }

  return {
    ...alert,
    missingDays: alert.consecutiveDaysAbsent,
    severity: alert.consecutiveDaysAbsent >= 10 ? 'HIGH' : 'MEDIUM',
    preAbsenceSummary: {
      totalWorkedHours: alert.totalHoursWorked || 0,
      averageDailyHours: alert.averageHoursPerDay || 0,
      historicalAttendance: Array.isArray(alert.historySummary) ? alert.historySummary : (alert.historySummary?.historicalAttendance || []),
    },
    employee: alert.employee
      ? {
          ...alert.employee,
          name: `${alert.employee.firstName || ''} ${alert.employee.lastName || ''}`.trim(),
        }
      : null,
  };
}

/**
 * Gets the current employee's active reminder alert (for employee self-service view)
 */
async function getMyAttendanceAlert(employeeId) {
  if (!employeeId) {
    return null;
  }

  const alert = await prisma.attendanceAlert.findFirst({
    where: {
      employeeId,
      status: { in: ['OPEN', 'ACKNOWLEDGED', 'UNDER_REVIEW'] },
    },
    orderBy: { absenceStartDate: 'desc' },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  if (!alert) return { hasAlert: false, alert: null };

  return {
    hasAlert: true,
    alert: {
      id: alert.id,
      employeeId: alert.employeeId,
      employeeName: `${alert.employee?.firstName || ''} ${alert.employee?.lastName || ''}`.trim(),
      lastAttendanceDate: alert.lastAttendanceDate,
      absenceStartDate: alert.absenceStartDate,
      absenceEndDate: alert.absenceEndDate,
      consecutiveDaysAbsent: alert.consecutiveDaysAbsent,
      missingDays: alert.consecutiveDaysAbsent,
      leaveStatus: alert.leaveStatus,
      status: alert.status,
    },
  };
}

/**
 * Updates alert status (OPEN -> ACKNOWLEDGED / UNDER_REVIEW / RESOLVED / DISMISSED) with resolution audit notes
 */
async function updateAttendanceAlertStatus(id, { status, resolutionNote, resolutionNotes }, user) {
  const alert = await prisma.attendanceAlert.findUnique({
    where: { id },
  });

  if (!alert) {
    throw new AppError('ALERT_NOT_FOUND', 'Attendance alert record not found', 404);
  }

  const isResolving = status === 'RESOLVED' || status === 'DISMISSED';
  const noteToSave = resolutionNote || resolutionNotes || alert.resolutionNote;

  const updated = await prisma.attendanceAlert.update({
    where: { id },
    data: {
      status,
      resolutionNote: noteToSave,
      resolvedAt: isResolving ? new Date() : (status === 'OPEN' ? null : alert.resolvedAt),
      resolvedByUserId: isResolving ? user.id : (status === 'OPEN' ? null : alert.resolvedByUserId),
    },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      resolvedByUser: {
        select: { id: true, name: true },
      },
    },
  });

  return {
    ...updated,
    resolvedById: updated.resolvedByUserId,
    resolutionNotes: updated.resolutionNote,
    employee: updated.employee
      ? {
          ...updated.employee,
          name: `${updated.employee.firstName || ''} ${updated.employee.lastName || ''}`.trim(),
        }
      : null,
  };
}

module.exports = {
  getAlertDaysThreshold,
  updateAlertDaysThreshold,
  checkEmployeeAbsenceRisk,
  runAttendanceRiskCheck,
  listAttendanceAlerts,
  getAttendanceAlertById,
  getMyAttendanceAlert,
  updateAttendanceAlertStatus,
};
