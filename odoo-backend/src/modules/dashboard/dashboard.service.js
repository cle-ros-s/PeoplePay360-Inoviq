const prisma = require('../../config/prisma');

/**
 * Builds standard date and relation filters from query params
 */
function buildDashboardFilters(query = {}) {
  const { period, department, employeeType, from, to } = query;
  const employeeWhere = { status: 'ACTIVE' };

  if (department) {
    employeeWhere.OR = [
      { departmentId: department },
      { department: { name: { contains: department, mode: 'insensitive' } } },
    ];
  }
  if (employeeType) {
    employeeWhere.employeeType = employeeType;
  }

  const dateFilter = {};
  if (from) dateFilter.gte = new Date(from);
  if (to) dateFilter.lte = new Date(to);

  return { employeeWhere, dateFilter, period };
}

/**
 * KPI aggregation endpoint
 */
async function getKpis(query) {
  const { employeeWhere } = buildDashboardFilters(query);

  // 1. Total Net Salary Paid (SUM(net) WHERE status = PAID)
  const paidPayslipsAgg = await prisma.payslip.aggregate({
    where: {
      status: 'PAID',
      employee: employeeWhere,
    },
    _sum: { net: true, gross: true, basic: true },
    _avg: { net: true },
    _count: { id: true },
  });

  const totalNetPaid = paidPayslipsAgg._sum.net || 0;
  const totalGrossPaid = paidPayslipsAgg._sum.gross || 0;
  const averageNetSalary = Math.round((paidPayslipsAgg._avg.net || 0) * 100) / 100;
  const paidPayslipCount = paidPayslipsAgg._count.id;

  // 2. All Payslips Count
  const totalPayslipsCount = await prisma.payslip.count({
    where: { employee: employeeWhere },
  });

  // 3. Approved Time Off Count & Days
  const approvedTimeOffAgg = await prisma.timeOffRequest.aggregate({
    where: {
      status: 'APPROVED',
      employee: employeeWhere,
    },
    _count: { id: true },
    _sum: { duration: true },
  });

  const approvedTimeOffCount = approvedTimeOffAgg._count.id;
  const approvedTimeOffDays = approvedTimeOffAgg._sum.duration || 0;

  // 4. Pending Time Off Count
  const pendingTimeOffCount = await prisma.timeOffRequest.count({
    where: {
      status: 'PENDING',
      employee: employeeWhere,
    },
  });

  // 5. Attendance Health: (PRESENT + OVERTIME) / total * 100
  const attendanceCounts = await prisma.attendance.groupBy({
    by: ['status'],
    where: {
      employee: employeeWhere,
    },
    _count: { id: true },
  });

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

  // 6. Active Employees Count
  const activeEmployeesCount = await prisma.employee.count({
    where: employeeWhere,
  });

  // 7. Unresolved Critical Warnings Count
  const unresolvedWarningsCount = await prisma.payrollWarning.count({
    where: { isResolved: false },
  });

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
 * Salary cost breakdown grouped by Department
 */
async function getSalaryCostByDepartment(query) {
  const departments = await prisma.department.findMany({
    include: {
      employees: {
        where: { status: 'ACTIVE' },
        include: {
          contracts: {
            where: { status: 'RUNNING' },
            take: 1,
          },
          payslips: {
            where: { status: { in: ['COMPUTED', 'VALIDATED', 'PAID'] } },
            orderBy: { periodStart: 'desc' },
            take: 1,
          },
        },
      },
    },
  });

  return departments.map((dept) => {
    const headcount = dept.employees.length;
    let totalContractWage = 0;
    let totalNet = 0;
    let totalGross = 0;

    for (const emp of dept.employees) {
      if (emp.contracts[0]) {
        totalContractWage += emp.contracts[0].wage;
      }
      if (emp.payslips[0]) {
        totalGross += emp.payslips[0].gross;
        totalNet += emp.payslips[0].net;
      }
    }

    const calculatedCost = totalGross > 0 ? totalGross : totalContractWage;

    return {
      departmentId: dept.id,
      departmentName: dept.name,
      department: dept.name,
      cost: Math.round(calculatedCost * 100) / 100,
      departmentCode: dept.code,
      headcount,
      totalContractWage: Math.round(totalContractWage * 100) / 100,
      totalGross: Math.round(totalGross * 100) / 100,
      totalNet: Math.round(totalNet * 100) / 100,
    };
  });
}

/**
 * Monthly Net Salary Trend over payruns
 */
async function getNetSalaryTrend() {
  const payruns = await prisma.payrun.findMany({
    orderBy: { periodStart: 'asc' },
    include: {
      payslips: {
        select: { basic: true, gross: true, net: true, status: true },
      },
    },
  });

  return payruns.map((p) => {
    const totalBasic = p.payslips.reduce((sum, ps) => sum + (ps.basic || 0), 0);
    const totalGross = p.payslips.reduce((sum, ps) => sum + (ps.gross || 0), 0);
    const totalNet = p.payslips.reduce((sum, ps) => sum + (ps.net || 0), 0);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const d = new Date(p.periodStart);
    const month = `${monthNames[d.getUTCMonth()]} ${d.getUTCFullYear()}`;

    return {
      payrunId: p.id,
      name: p.name,
      month,
      periodStart: p.periodStart,
      periodEnd: p.periodEnd,
      status: p.status,
      payslipCount: p.payslips.length,
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
  const { employeeWhere } = buildDashboardFilters(query);

  const statusGroups = await prisma.payslip.groupBy({
    by: ['status'],
    where: { employee: employeeWhere },
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
  const { employeeWhere } = buildDashboardFilters(query);

  const [statusGroups, totalStats, manualEditsCount] = await Promise.all([
    prisma.attendance.groupBy({
      by: ['status'],
      where: { employee: employeeWhere },
      _count: { id: true },
      _sum: { workedHours: true },
    }),
    prisma.attendance.aggregate({
      where: { employee: employeeWhere },
      _count: { id: true },
      _sum: { workedHours: true },
      _avg: { workedHours: true },
    }),
    prisma.attendance.count({
      where: { employee: employeeWhere, isManualEdit: true },
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
 * Time Off Overview
 */
async function getTimeOffOverview(query) {
  const { employeeWhere } = buildDashboardFilters(query);

  const [statusGroups, typeGroups, activeAllocations] = await Promise.all([
    prisma.timeOffRequest.groupBy({
      by: ['status'],
      where: { employee: employeeWhere },
      _count: { id: true },
      _sum: { duration: true },
    }),
    prisma.timeOffRequest.groupBy({
      by: ['timeOffTypeId'],
      where: { employee: employeeWhere, status: 'APPROVED' },
      _count: { id: true },
      _sum: { duration: true },
    }),
    prisma.leaveAllocation.count({
      where: { status: 'APPROVED' },
    }),
  ]);

  const types = await prisma.timeOffType.findMany();
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
    include: {
      payrun: { select: { id: true, name: true, status: true } },
      employee: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
    take: 50,
  });

  return {
    criticalCount: warnings.filter((w) => w.severity === 'CRITICAL').length,
    warningCount: warnings.filter((w) => w.severity === 'WARNING').length,
    warnings,
  };
}

module.exports = {
  getKpis,
  getSalaryCostByDepartment,
  getNetSalaryTrend,
  getPayslipStatusBreakdown,
  getAttendanceOverview,
  getTimeOffOverview,
  getDashboardWarnings,
};
