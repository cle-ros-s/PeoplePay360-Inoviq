const prisma = require('../../config/prisma');
const { computePayslip } = require('./payrollEngine');
const { generatePayslipPdfBuffer } = require('./payslipPdf.service');
const { sendPayslipEmail } = require('./emailSender.service');
const { getPaginationParams } = require('../../utils/pagination');
const { formatListResponse, AppError } = require('../../utils/responseFormatter');

const { globalCache } = require('../../utils/cache');
const { invalidateDashboardCache } = require('../dashboard/dashboard.service');

function invalidatePayslipCache() {
  globalCache.invalidatePrefix('payslips:');
  globalCache.invalidatePrefix('payruns:');
  invalidateDashboardCache();
}

async function listPayslips(query, scopedEmployeeId = null) {
  const { page, pageSize, skip, take } = getPaginationParams(query);
  const { payrunId, employeeId, status, period } = query;
  const cacheKey = `payslips:list:${scopedEmployeeId || 'all'}:${payrunId || ''}:${employeeId || ''}:${status || ''}:${period || ''}:${page}:${pageSize}`;

  return globalCache.getOrFetch(cacheKey, async () => {
    const where = {};
    if (scopedEmployeeId) {
      where.employeeId = scopedEmployeeId;
    } else if (employeeId) {
      where.employeeId = employeeId;
    }

    if (payrunId) where.payrunId = payrunId;
    if (status) where.status = status;
    if (period) {
      where.payrun = { name: { contains: period, mode: 'insensitive' } };
    }

    const [payslips, total] = await Promise.all([
      prisma.payslip.findMany({
        where,
        skip,
        take,
        orderBy: { periodStart: 'desc' },
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
          payrun: { select: { id: true, name: true, status: true } },
          salaryStructure: { select: { id: true, name: true, code: true } },
          _count: { select: { lines: true, warnings: true } },
        },
      }),
      prisma.payslip.count({ where }),
    ]);

    const formatted = payslips.map((p) => ({
      id: p.id,
      payrunId: p.payrunId,
      payrun: p.payrun,
      employeeId: p.employeeId,
      employee: p.employee
        ? {
            ...p.employee,
            name: `${p.employee.firstName || ''} ${p.employee.lastName || ''}`.trim(),
          }
        : null,
      contractId: p.contractId,
      salaryStructureId: p.salaryStructureId,
      salaryStructure: p.salaryStructure,
      periodStart: p.periodStart,
      periodEnd: p.periodEnd,
      workedDays: p.workedDays,
      totalDays: p.totalDays,
      basic: p.basic,
      gross: p.gross,
      net: p.net,
      status: p.status,
      lineCount: p._count.lines,
      warningCount: p._count.warnings,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return formatListResponse(formatted, total, page, pageSize);
  }, 30000);
}

async function computePayslipAttendanceAndPayrollSummary(payslip) {
  const pStart = new Date(payslip.periodStart);
  pStart.setUTCHours(0, 0, 0, 0);
  const pEnd = new Date(payslip.periodEnd);
  pEnd.setUTCHours(23, 59, 59, 999);

  // 1. Fetch Schedule with Lines
  const scheduleId = payslip.contract?.scheduleId || payslip.employee?.scheduleId;
  let schedule = null;
  if (scheduleId) {
    schedule = await prisma.workingSchedule.findUnique({
      where: { id: scheduleId },
      include: { lines: { orderBy: { dayOfWeek: 'asc' } } },
    });
  }

  const isWorkingDay = (date) => {
    const dayOfWeek = date.getUTCDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
    if (schedule && schedule.lines && schedule.lines.length > 0) {
      return schedule.lines.some((l) => l.dayOfWeek === dayOfWeek);
    }
    return dayOfWeek >= 1 && dayOfWeek <= 5;
  };

  // 2. Fetch Attendance Records for this period
  const attendances = await prisma.attendance.findMany({
    where: {
      employeeId: payslip.employeeId,
      checkIn: { gte: pStart, lte: pEnd },
    },
    orderBy: { checkIn: 'asc' },
  });

  // 3. Fetch Approved Time Off Requests for this period
  const timeOffRequests = await prisma.timeOffRequest.findMany({
    where: {
      employeeId: payslip.employeeId,
      status: 'APPROVED',
      OR: [
        { startDate: { lte: pEnd }, endDate: { gte: pStart } },
      ],
    },
    include: { timeOffType: true },
  });

  // 4. Fetch Active Attendance Alert if unresolved
  const activeAlert = await prisma.attendanceAlert.findFirst({
    where: {
      employeeId: payslip.employeeId,
      status: { in: ['OPEN', 'ACKNOWLEDGED', 'UNDER_REVIEW'] },
    },
    orderBy: { createdAt: 'desc' },
  });

  // 5. Day-by-day evaluation across the payslip period
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const attendanceDetails = [];
  let totalWorkingDays = 0;
  let daysWorked = 0;
  let leaveDays = 0;
  let absentDays = 0;
  let totalHoursWorked = 0;
  const leaveTypeCountMap = new Map();

  const oneDayMs = 24 * 60 * 60 * 1000;
  const totalDaysInPeriod = Math.round((pEnd.getTime() - pStart.getTime()) / oneDayMs);

  for (let i = 0; i < totalDaysInPeriod; i++) {
    const currDate = new Date(pStart.getTime() + i * oneDayMs);
    const dateStr = currDate.toISOString().split('T')[0];
    const dayOfWeek = currDate.getUTCDay();
    const dayName = dayNames[dayOfWeek];
    const scheduled = isWorkingDay(currDate);

    if (scheduled) {
      totalWorkingDays++;
    }

    const dayStart = new Date(Date.UTC(currDate.getUTCFullYear(), currDate.getUTCMonth(), currDate.getUTCDate(), 0, 0, 0));
    const dayEnd = new Date(Date.UTC(currDate.getUTCFullYear(), currDate.getUTCMonth(), currDate.getUTCDate(), 23, 59, 59, 999));

    // Daily standard hours from schedule (default 8)
    const dailyStandardHours = Number(schedule?.hoursPerDay) || (schedule?.hoursPerWeek ? Math.round((schedule.hoursPerWeek / 5) * 100) / 100 : 8);

    // Check attendance record (support UTC date, local date, and timestamp window)
    const attRecord = attendances.find((a) => {
      const aDate = new Date(a.checkIn);
      const aUtcStr = aDate.toISOString().split('T')[0];
      const aLocalStr = aDate.toLocaleDateString('en-CA');
      return aUtcStr === dateStr || aLocalStr === dateStr || (aDate >= dayStart && aDate <= dayEnd);
    });

    // Check covering approved leave
    const coveringLeave = timeOffRequests.find((t) => {
      const lStart = new Date(t.startDate);
      lStart.setUTCHours(0, 0, 0, 0);
      const lEnd = new Date(t.endDate);
      lEnd.setUTCHours(23, 59, 59, 999);
      return dayStart >= lStart && dayStart <= lEnd;
    });

    if (attRecord) {
      let hours = Number(attRecord.workedHours) || 0;
      if (hours <= 0 && attRecord.checkIn && attRecord.checkOut) {
        const diffMs = new Date(attRecord.checkOut).getTime() - new Date(attRecord.checkIn).getTime();
        if (diffMs > 0) {
          hours = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
        }
      }
      if (hours <= 0 && attRecord.checkIn) {
        hours = dailyStandardHours;
      }

      totalHoursWorked += hours;
      daysWorked++;

      const checkInTime = attRecord.checkIn ? new Date(attRecord.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' }) : null;
      const checkOutTime = attRecord.checkOut ? new Date(attRecord.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true, timeZone: 'UTC' }) : null;

      attendanceDetails.push({
        date: dateStr,
        dayOfWeek,
        dayName,
        isScheduled: scheduled,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        workedHours: hours,
        status: attRecord.status === 'LATE' ? 'LATE' : 'PRESENT',
        leaveType: null,
      });
    } else if (coveringLeave) {
      if (scheduled) {
        leaveDays++;
        const typeName = coveringLeave.timeOffType?.name || 'Leave';
        leaveTypeCountMap.set(typeName, (leaveTypeCountMap.get(typeName) || 0) + 1);
      }

      attendanceDetails.push({
        date: dateStr,
        dayOfWeek,
        dayName,
        isScheduled: scheduled,
        checkIn: null,
        checkOut: null,
        workedHours: 0,
        status: 'LEAVE',
        leaveType: coveringLeave.timeOffType?.name || 'Approved Leave',
      });
    } else {
      if (scheduled) {
        absentDays++;
        attendanceDetails.push({
          date: dateStr,
          dayOfWeek,
          dayName,
          isScheduled: true,
          checkIn: null,
          checkOut: null,
          workedHours: 0,
          status: 'ABSENT',
          leaveType: null,
        });
      } else {
        attendanceDetails.push({
          date: dateStr,
          dayOfWeek,
          dayName,
          isScheduled: false,
          checkIn: null,
          checkOut: null,
          workedHours: 0,
          status: 'REST_DAY',
          leaveType: null,
        });
      }
    }
  }

  const dailyStandardHours = Number(schedule?.hoursPerDay) || (schedule?.hoursPerWeek ? Math.round((schedule.hoursPerWeek / 5) * 100) / 100 : 8);

  // If no punch records exist for this pay period in DB, but the payslip was generated with workedDays:
  if (attendances.length === 0 && (payslip.workedDays > 0 || payslip.totalDays > 0)) {
    const fallbackWorkedDays = payslip.workedDays !== undefined && payslip.workedDays !== null
      ? payslip.workedDays
      : totalWorkingDays;
    daysWorked = Math.min(fallbackWorkedDays, totalWorkingDays > 0 ? totalWorkingDays : fallbackWorkedDays);
    absentDays = Math.max(0, totalWorkingDays - daysWorked - leaveDays);
    totalHoursWorked = Math.round(daysWorked * dailyStandardHours * 100) / 100;

    // Update attendance details to reflect present days
    let markedPresent = 0;
    for (const item of attendanceDetails) {
      if (item.isScheduled && item.status === 'ABSENT' && markedPresent < daysWorked) {
        item.status = 'PRESENT';
        item.workedHours = dailyStandardHours;
        item.checkIn = '09:00 AM';
        item.checkOut = '05:00 PM';
        markedPresent++;
      }
    }
  } else if (totalHoursWorked === 0 && daysWorked > 0) {
    totalHoursWorked = Math.round(daysWorked * dailyStandardHours * 100) / 100;
  }

  totalHoursWorked = Math.round(totalHoursWorked * 100) / 100;

  // 6. Calculate Earnings and Deductions from Payslip Lines
  const lines = payslip.lines || [];
  let totalEarnings = Number(payslip.gross) || 0;
  let totalDeductions = 0;

  for (const line of lines) {
    if (line.category === 'DEDUCTION') {
      totalDeductions += Math.abs(Number(line.amount) || 0);
    }
  }

  // If gross is 0, sum up non-deduction lines
  if (!totalEarnings) {
    totalEarnings = lines
      .filter((l) => l.category === 'BASIC' || l.category === 'ALLOWANCE' || l.category === 'GROSS')
      .reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  }

  totalEarnings = Math.round(totalEarnings * 100) / 100;
  totalDeductions = Math.round(totalDeductions * 100) / 100;
  const netSalary = Number(payslip.net) || (totalEarnings - totalDeductions);

  // 7. Leave Summary Structure
  const leaveByType = [];
  let annualLeaveDays = 0;
  let sickLeaveDays = 0;
  let unpaidLeaveDays = 0;

  for (const [typeName, count] of leaveTypeCountMap.entries()) {
    leaveByType.push({ typeName, days: count });
    const lower = typeName.toLowerCase();
    if (lower.includes('annual') || lower.includes('paid') || lower.includes('vacation')) {
      annualLeaveDays += count;
    } else if (lower.includes('sick') || lower.includes('medical')) {
      sickLeaveDays += count;
    } else if (lower.includes('unpaid') || lower.includes('loss')) {
      unpaidLeaveDays += count;
    }
  }

  return {
    attendanceSummary: {
      totalWorkingDays,
      daysWorked,
      leaveDays,
      absentDays,
      totalHoursWorked,
    },
    leaveSummary: {
      annualLeave: annualLeaveDays,
      sickLeave: sickLeaveDays,
      unpaidLeave: unpaidLeaveDays,
      byType: leaveByType,
      totalLeave: leaveDays,
    },
    payrollSummary: {
      totalEarnings,
      totalDeductions,
      netSalary,
    },
    attendanceDetails,
    attendanceRisk: activeAlert
      ? {
          hasRisk: true,
          alertId: activeAlert.id,
          consecutiveDaysAbsent: activeAlert.consecutiveDaysAbsent,
          status: activeAlert.status,
          severity: activeAlert.consecutiveDaysAbsent >= 10 ? 'HIGH' : 'MEDIUM',
          absenceStartDate: activeAlert.absenceStartDate,
          message: `This employee has ${activeAlert.consecutiveDaysAbsent} consecutive unrecorded scheduled working days flagged for review.`,
        }
      : null,
  };
}

async function getPayslipById(id, scopedEmployeeId = null) {
  const cacheKey = `payslips:detail:${id}`;

  const payslip = await globalCache.getOrFetch(cacheKey, async () => {
    const found = await prisma.payslip.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            department: true,
            schedule: { include: { lines: true } },
          },
        },
        contract: {
          include: {
            schedule: { include: { lines: true } },
          },
        },
        payrun: true,
        salaryStructure: {
          include: {
            rules: { orderBy: { sequence: 'asc' } },
          },
        },
        lines: {
          orderBy: { sequence: 'asc' },
        },
        warnings: true,
      },
    });

    if (!found) {
      throw new AppError('PAYSLIP_NOT_FOUND', 'Payslip not found', 404);
    }
    return found;
  }, 30000);

  if (scopedEmployeeId && payslip.employeeId !== scopedEmployeeId) {
    throw new AppError('FORBIDDEN', 'Access denied to this payslip', 403);
  }

  // Dynamic Attendance and Payroll Summary Calculation
  const computedSummary = await computePayslipAttendanceAndPayrollSummary(payslip);

  if (payslip.employee) {
    payslip.employee = {
      ...payslip.employee,
      name: `${payslip.employee.firstName || ''} ${payslip.employee.lastName || ''}`.trim(),
    };
  }

  return {
    ...payslip,
    ...computedSummary,
  };
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

async function updatePayslip(id, data, scopedEmployeeId = null) {
  const payslip = await getPayslipById(id, scopedEmployeeId);

  if (payslip.status === 'PAID') {
    throw new AppError('PAYSLIP_ALREADY_PAID', 'Cannot modify paid payslips; historical records are immutable', 400);
  }

  const workedDays = data.workedDays !== undefined ? data.workedDays : payslip.workedDays;
  const totalDays = data.totalDays !== undefined ? data.totalDays : payslip.totalDays;

  // Re-compute if contract & structure exist
  let basic = payslip.basic;
  let gross = payslip.gross;
  let net = payslip.net;
  let lines = [];

  if (payslip.contract && payslip.salaryStructure && payslip.salaryStructure.rules.length > 0) {
    const calc = computePayslip({
      contract: payslip.contract,
      salaryStructureRules: payslip.salaryStructure.rules,
      periodStart: payslip.periodStart,
      periodEnd: payslip.periodEnd,
      workedDays,
      totalDays,
    });
    basic = calc.basic;
    gross = calc.gross;
    net = calc.net;
    lines = calc.lines;
  }

  return executeTx(async (tx) => {
    if (lines.length > 0) {
      await tx.payslipLine.deleteMany({ where: { payslipId: id } });
      await tx.payslipLine.createMany({
        data: lines.map((l) => ({
          payslipId: id,
          salaryRuleId: l.salaryRuleId,
          name: l.name,
          code: l.code,
          category: l.category,
          sequence: l.sequence,
          amount: l.amount,
        })),
      });
    }

    const updated = await tx.payslip.update({
      where: { id },
      data: {
        workedDays,
        totalDays,
        basic,
        gross,
        net,
        status: 'COMPUTED',
      },
      include: {
        lines: { orderBy: { sequence: 'asc' } },
        employee: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
    invalidatePayslipCache();
    return updated;
  });
}

async function getPayslipPdf(id, scopedEmployeeId = null) {
  const payslip = await getPayslipById(id, scopedEmployeeId);
  return generatePayslipPdfBuffer(payslip);
}

async function sendSinglePayslipEmail(id, customRecipient = null) {
  const payslip = await getPayslipById(id);
  return sendPayslipEmail(payslip, customRecipient);
}

module.exports = {
  listPayslips,
  getPayslipById,
  updatePayslip,
  getPayslipPdf,
  sendSinglePayslipEmail,
  invalidatePayslipCache,
};
