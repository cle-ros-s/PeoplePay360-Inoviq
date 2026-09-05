const prisma = require('../../config/prisma');

// In-Memory Cache Store for Blazing Fast Dashboard Delivery (<5ms)
const dashboardCache = new Map();
const inFlightRequests = new Map();
const CACHE_TTL_MS = 5 * 1000; // 5 seconds TTL for instant reactivity

function getCacheKey(prefix, query = {}) {
  const sorted = Object.keys(query)
    .sort()
    .reduce((acc, k) => {
      if (query[k] !== undefined && query[k] !== null && query[k] !== '') {
        acc[k] = query[k];
      }
      return acc;
    }, {});
  return `${prefix}:${JSON.stringify(sorted)}`;
}

function invalidateDashboardCache() {
  dashboardCache.clear();
}

/**
 * Builds standard date and relation filters from query params
 */
function buildDashboardFilters(query = {}) {
  const { period, department, employeeType, from, to } = query;
  const employeeWhere = {};

  if (department) {
    employeeWhere.OR = [
      { departmentId: department },
      { department: { name: { contains: department, mode: 'insensitive' } } },
    ];
  }
  if (employeeType) {
    employeeWhere.employeeType = employeeType;
  }

  let startDate = null;
  let endDate = null;

  if (period) {
    const parts = period.split('-').map(Number);
    if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      const year = parts[0];
      const month = parts[1];
      startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
      endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    }
  } else if (from || to) {
    if (from) startDate = new Date(from);
    if (to) endDate = new Date(to);
  }

  const payslipDateWhere = {};
  if (startDate && endDate) {
    payslipDateWhere.periodStart = { gte: startDate, lte: endDate };
  } else if (startDate) {
    payslipDateWhere.periodStart = { gte: startDate };
  } else if (endDate) {
    payslipDateWhere.periodStart = { lte: endDate };
  }

  const attendanceDateWhere = {};
  if (startDate && endDate) {
    attendanceDateWhere.checkIn = { gte: startDate, lte: endDate };
  } else if (startDate) {
    attendanceDateWhere.checkIn = { gte: startDate };
  } else if (endDate) {
    attendanceDateWhere.checkIn = { lte: endDate };
  }

  const timeOffDateWhere = {};
  if (startDate && endDate) {
    timeOffDateWhere.OR = [
      { startDate: { lte: endDate }, endDate: { gte: startDate } },
    ];
  }

  return {
    employeeWhere,
    payslipDateWhere,
    attendanceDateWhere,
    timeOffDateWhere,
    startDate,
    endDate,
    period,
  };
}

/**
 * KPI aggregation endpoint (Optimized with Promise.all parallel database queries)
 */
async function getKpis(query) {
  const { employeeWhere, payslipDateWhere, attendanceDateWhere, timeOffDateWhere } = buildDashboardFilters(query);

  const payslipWhere = {
    ...payslipDateWhere,
    ...(Object.keys(employeeWhere).length ? { employee: employeeWhere } : {}),
  };

  const attendanceWhere = {
    ...attendanceDateWhere,
    ...(Object.keys(employeeWhere).length ? { employee: employeeWhere } : {}),
  };

  const timeOffWhere = {
    ...timeOffDateWhere,
    ...(Object.keys(employeeWhere).length ? { employee: employeeWhere } : {}),
  };

  const [
    paidPayslipsAgg,
    totalPayslipsCount,
    approvedTimeOffAgg,
    pendingTimeOffCount,
    attendanceCounts,
    activeEmployeesCount,
    unresolvedWarningsCount,
  ] = await Promise.all([
    prisma.payslip.aggregate({
      where: {
        status: 'PAID',
        ...payslipWhere,
      },
      _sum: { net: true, gross: true, basic: true },
      _avg: { net: true },
      _count: { id: true },
    }),
    prisma.payslip.count({
      where: payslipWhere,
    }),
    prisma.timeOffRequest.aggregate({
      where: {
        status: 'APPROVED',
        ...timeOffWhere,
      },
      _count: { id: true },
      _sum: { duration: true },
    }),
    prisma.timeOffRequest.count({
      where: {
        status: 'PENDING',
        ...timeOffWhere,
      },
    }),
    prisma.attendance.groupBy({
      by: ['status'],
      where: attendanceWhere,
      _count: { id: true },
    }),
    prisma.employee.count({
      where: {
        status: 'ACTIVE',
        ...employeeWhere,
      },
    }),
    prisma.payrollWarning.count({
      where: { isResolved: false },
    }),
  ]);

  const totalNetPaid = paidPayslipsAgg._sum.net || 0;
  const totalGrossPaid = paidPayslipsAgg._sum.gross || 0;
  const averageNetSalary = Math.round((paidPayslipsAgg._avg.net || 0) * 100) / 100;
  const paidPayslipCount = paidPayslipsAgg._count.id;
  const approvedTimeOffCount = approvedTimeOffAgg._count.id;
  const approvedTimeOffDays = approvedTimeOffAgg._sum.duration || 0;

  let totalAttendanceRows = 0;
  let healthyAttendanceRows = 0;

  for (const item of attendanceCounts) {
    totalAttendanceRows += item._count.id;
    if (item.status === 'PRESENT' || item.status === 'OVERTIME') {
      healthyAttendanceRows += item._count.id;
    }
  }

  const attendanceHealth =
    totalAttendanceRows > 0
      ? Math.round((healthyAttendanceRows / totalAttendanceRows) * 10000) / 100
      : 100.0;

  return {
    totalNetPaid: Math.round(totalNetPaid * 100) / 100,
    totalNetSalaryPaid: Math.round(totalNetPaid * 100) / 100,
    totalGrossPaid: Math.round(totalGrossPaid * 100) / 100,
    averageNetSalary,
    averageSalary: averageNetSalary,
    paidPayslipCount,
    totalPayslipsCount,
    payslipCount: totalPayslipsCount,
    payslipsGenerated: totalPayslipsCount,
    approvedTimeOff: approvedTimeOffDays || approvedTimeOffCount,
    approvedTimeOffCount,
    approvedTimeOffDays,
    pendingTimeOffCount,
    attendanceHealth,
    attendanceRate: attendanceHealth,
    activeEmployeesCount,
    unresolvedWarningsCount,
  };
}

/**
 * Salary cost breakdown grouped by Department (Lean queries & memory projection)
 */
/**
 * Salary cost breakdown grouped by Department (Pure DB Aggregation)
 */
async function getSalaryCostByDepartment(query) {
  const { employeeWhere } = buildDashboardFilters(query);
  const deptWhere = {};
  if (query?.department) {
    deptWhere.OR = [
      { id: query.department },
      { name: { contains: query.department, mode: 'insensitive' } },
    ];
  }

  const contractWhere = {
    status: 'RUNNING',
    departmentId: { not: null },
  };
  if (query?.employeeType) {
    contractWhere.employee = { employeeType: query.employeeType };
  }

  const [departments, contractAggs] = await Promise.all([
    prisma.department.findMany({
      where: deptWhere,
      select: {
        id: true,
        name: true,
        code: true,
        _count: {
          select: { employees: { where: { status: 'ACTIVE', ...employeeWhere } } },
        },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.contract.groupBy({
      by: ['departmentId'],
      where: contractWhere,
      _sum: { wage: true },
    }),
  ]);

  const contractMap = new Map();
  for (const c of contractAggs) {
    if (c.departmentId) contractMap.set(c.departmentId, c._sum.wage || 0);
  }

  return departments.map((dept) => {
    const headcount = dept._count.employees;
    const totalContractWage = contractMap.get(dept.id) || 0;

    return {
      departmentId: dept.id,
      departmentName: dept.name,
      department: dept.name,
      cost: Math.round(totalContractWage * 100) / 100,
      departmentCode: dept.code,
      headcount,
      totalContractWage: Math.round(totalContractWage * 100) / 100,
      totalGross: Math.round(totalContractWage * 100) / 100,
      totalNet: Math.round(totalContractWage * 100) / 100,
    };
  });
}

/**
 * Monthly Net Salary Trend over payruns (Pure DB Aggregation)
 */
async function getNetSalaryTrend() {
  const payruns = await prisma.payrun.findMany({
    orderBy: { periodStart: 'desc' },
    take: 12,
    select: {
      id: true,
      name: true,
      periodStart: true,
      periodEnd: true,
      status: true,
    },
  });

  const payrunIds = payruns.map((p) => p.id);
  const payslipAggregates = await prisma.payslip.groupBy({
    by: ['payrunId'],
    where: { payrunId: { in: payrunIds } },
    _sum: { basic: true, gross: true, net: true },
    _count: { id: true },
  });

  const aggMap = new Map();
  for (const agg of payslipAggregates) {
    aggMap.set(agg.payrunId, agg);
  }

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return payruns.reverse().map((p) => {
    const agg = aggMap.get(p.id);
    const totalBasic = agg?._sum?.basic || 0;
    const totalGross = agg?._sum?.gross || 0;
    const totalNet = agg?._sum?.net || 0;
    const payslipCount = agg?._count?.id || 0;

    const d = new Date(p.periodStart);
    const month = `${monthNames[d.getUTCMonth()]} ${d.getUTCFullYear()}`;

    return {
      payrunId: p.id,
      name: p.name,
      month,
      periodStart: p.periodStart,
      periodEnd: p.periodEnd,
      status: p.status,
      payslipCount,
      totalBasic: Math.round(totalBasic * 100) / 100,
      totalGross: Math.round(totalGross * 100) / 100,
      totalNet: Math.round(totalNet * 100) / 100,
    };
  });
}

/**
 * Payslip status breakdown
 */
async function getPayslipStatusBreakdown(query) {
  const { employeeWhere, payslipDateWhere } = buildDashboardFilters(query);
  const payslipWhere = {
    ...payslipDateWhere,
    ...(Object.keys(employeeWhere).length ? { employee: employeeWhere } : {}),
  };

  const statusGroups = await prisma.payslip.groupBy({
    by: ['status'],
    where: payslipWhere,
    _count: { id: true },
    _sum: { net: true, gross: true },
  });

  const allStatuses = ['DRAFT', 'COMPUTED', 'VALIDATED', 'PAID'];
  return allStatuses.map((status) => {
    const match = statusGroups.find((g) => g.status === status);
    return {
      status,
      count: match ? match._count.id : 0,
      totalNet: match && match._sum.net ? Math.round(match._sum.net * 100) / 100 : 0,
      totalGross: match && match._sum.gross ? Math.round(match._sum.gross * 100) / 100 : 0,
    };
  });
}

/**
 * Attendance Overview with breakdown by status and hours
 */
async function getAttendanceOverview(query) {
  const { employeeWhere, attendanceDateWhere } = buildDashboardFilters(query);
  const attendanceWhere = {
    ...attendanceDateWhere,
    ...(Object.keys(employeeWhere).length ? { employee: employeeWhere } : {}),
  };

  const [statusGroups, totalStats, manualEditsCount] = await Promise.all([
    prisma.attendance.groupBy({
      by: ['status'],
      where: attendanceWhere,
      _count: { id: true },
      _sum: { workedHours: true },
    }),
    prisma.attendance.aggregate({
      where: attendanceWhere,
      _count: { id: true },
      _sum: { workedHours: true },
      _avg: { workedHours: true },
    }),
    prisma.attendance.count({
      where: { ...attendanceWhere, isManualEdit: true },
    }),
  ]);

  const statusMap = {};
  for (const g of statusGroups) {
    statusMap[g.status] = {
      count: g._count.id,
      totalHours: g._sum.workedHours ? Math.round(g._sum.workedHours * 100) / 100 : 0,
    };
  }

  const present = statusMap['PRESENT']?.count || 0;
  const late = statusMap['LATE']?.count || 0;
  const overtime = statusMap['OVERTIME']?.count || 0;
  const missingCheckout = statusMap['MISSING_CHECKOUT']?.count || 0;
  const absent = statusMap['ABSENT']?.count || 0;

  return {
    present,
    late,
    overtime,
    missingCheckout,
    absent,
    totalRecords: totalStats._count.id,
    totalWorkedHours: totalStats._sum.workedHours ? Math.round(totalStats._sum.workedHours * 100) / 100 : 0,
    averageWorkedHours: totalStats._avg.workedHours ? Math.round(totalStats._avg.workedHours * 100) / 100 : 0,
    manualEditsCount,
    breakdown: {
      PRESENT: statusMap['PRESENT'] || { count: 0, totalHours: 0 },
      LATE: statusMap['LATE'] || { count: 0, totalHours: 0 },
      OVERTIME: statusMap['OVERTIME'] || { count: 0, totalHours: 0 },
      MISSING_CHECKOUT: statusMap['MISSING_CHECKOUT'] || { count: 0, totalHours: 0 },
      ABSENT: statusMap['ABSENT'] || { count: 0, totalHours: 0 },
    },
  };
}

/**
 * Time Off Overview (Parallelized)
 */
async function getTimeOffOverview(query) {
  const { employeeWhere, timeOffDateWhere } = buildDashboardFilters(query);
  const timeOffWhere = {
    ...timeOffDateWhere,
    ...(Object.keys(employeeWhere).length ? { employee: employeeWhere } : {}),
  };

  const [statusGroups, typeGroups, activeAllocations, types] = await Promise.all([
    prisma.timeOffRequest.groupBy({
      by: ['status'],
      where: timeOffWhere,
      _count: { id: true },
      _sum: { duration: true },
    }),
    prisma.timeOffRequest.groupBy({
      by: ['timeOffTypeId'],
      where: { ...timeOffWhere, status: 'APPROVED' },
      _count: { id: true },
      _sum: { duration: true },
    }),
    prisma.leaveAllocation.count({
      where: {
        status: 'APPROVED',
        ...(Object.keys(employeeWhere).length ? { employee: employeeWhere } : {}),
      },
    }),
    prisma.timeOffType.findMany({
      select: { id: true, name: true },
    }),
  ]);

  const typeMap = {};
  types.forEach((t) => {
    typeMap[t.id] = t.name;
  });

  const byType = typeGroups.map((g) => ({
    timeOffTypeId: g.timeOffTypeId,
    name: typeMap[g.timeOffTypeId] || 'Unknown',
    approvedCount: g._count.id,
    totalDuration: g._sum.duration || 0,
  }));

  const byStatus = {};
  ['DRAFT', 'PENDING', 'APPROVED', 'REFUSED'].forEach((st) => {
    const match = statusGroups.find((g) => g.status === st);
    byStatus[st] = {
      count: match ? match._count.id : 0,
      totalDuration: match && match._sum.duration ? match._sum.duration : 0,
    };
  });

  const pendingRequests = byStatus['PENDING']?.count || 0;
  const approvedDays = byStatus['APPROVED']?.totalDuration || 0;

  return {
    pendingRequests,
    approvedDays,
    activeAllocations,
    byStatus,
    byType,
  };
}

/**
 * Dashboard Warnings
 */
async function getDashboardWarnings() {
  const warnings = await prisma.payrollWarning.findMany({
    where: { isResolved: false },
    orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
    select: {
      id: true,
      type: true,
      message: true,
      severity: true,
      isResolved: true,
      createdAt: true,
      payrun: { select: { id: true, name: true, status: true } },
      employee: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    take: 20,
  });

  return {
    criticalCount: warnings.filter((w) => w.severity === 'CRITICAL').length,
    warningCount: warnings.filter((w) => w.severity === 'WARNING').length,
    warnings,
  };
}

/**
 * Single High-Speed Unified Summary endpoint with In-Memory Caching & Deduplication
 */
async function getDashboardSummary(query = {}) {
  const cacheKey = getCacheKey('summary', query);
  const cached = dashboardCache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  // If identical request is already running, return the existing in-flight promise
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const fetchPromise = (async () => {
    try {
      const [
        kpis,
        salaryCost,
        netTrend,
        payslipBreakdown,
        attendanceOverview,
        timeOffOverview,
        warnings,
      ] = await Promise.all([
        getKpis(query),
        getSalaryCostByDepartment(query),
        getNetSalaryTrend(),
        getPayslipStatusBreakdown(query),
        getAttendanceOverview(query),
        getTimeOffOverview(query),
        getDashboardWarnings(),
      ]);

      const data = {
        kpis,
        salaryCost,
        netTrend,
        payslipBreakdown,
        attendanceOverview,
        timeOffOverview,
        warnings,
      };

      dashboardCache.set(cacheKey, { timestamp: Date.now(), data });
      return data;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, fetchPromise);
  return fetchPromise;
}

module.exports = {
  getKpis,
  getSalaryCostByDepartment,
  getNetSalaryTrend,
  getPayslipStatusBreakdown,
  getAttendanceOverview,
  getTimeOffOverview,
  getDashboardWarnings,
  getDashboardSummary,
  invalidateDashboardCache,
};
