const { differenceInCalendarDays } = require('date-fns');
const prisma = require('../../config/prisma');
const { computePayslip } = require('./payrollEngine');
const { generatePayrunWarnings } = require('./payrollWarnings.service');
const { sendBulkPayrunPayslips } = require('./emailSender.service');
const { getPaginationParams } = require('../../utils/pagination');
const { formatListResponse, AppError } = require('../../utils/responseFormatter');

/**
 * Lists eligible employees for a payrun without modifying the database.
 */
async function getEligibleEmployees(query) {
  const { periodStart, periodEnd, salaryStructureId, departmentId, employeeType } = query;
  const pStart = new Date(periodStart);
  const pEnd = new Date(periodEnd);

  const where = {
    status: 'ACTIVE',
  };

  if (departmentId) where.departmentId = departmentId;
  if (employeeType) where.employeeType = employeeType;

  const employees = await prisma.employee.findMany({
    where,
    include: {
      department: true,
      schedule: true,
      contracts: {
        where: {
          status: 'RUNNING',
          startDate: { lte: pEnd },
          OR: [{ endDate: null }, { endDate: { gte: pStart } }],
          ...(salaryStructureId ? { salaryStructureId } : {}),
        },
        include: { salaryStructure: true },
        take: 1,
      },
    },
    orderBy: { firstName: 'asc' },
  });

  return employees.map((emp) => {
    const contract = emp.contracts[0] || null;
    return {
      id: emp.id,
      name: `${emp.firstName} ${emp.lastName}`,
      email: emp.email,
      jobPosition: emp.jobPosition,
      employeeType: emp.employeeType,
      department: emp.department ? emp.department.name : null,
      departmentId: emp.departmentId,
      hasActiveContract: !!contract,
      contract: contract
        ? {
            id: contract.id,
            wage: contract.wage,
            salaryStructureId: contract.salaryStructureId,
            salaryStructureName: contract.salaryStructure ? contract.salaryStructure.name : null,
          }
        : null,
      hasBankDetails: !!(emp.bankAccountNumber && emp.bankName),
      hasSchedule: !!emp.scheduleId,
    };
  });
}

async function executeTx(fn) {
  try {
    return await prisma.$transaction(fn, { maxWait: 20000, timeout: 60000 });
  } catch (err) {
    if (err.code === 'P2028' || err.message?.includes('Transaction')) {
      return await prisma.$transaction(fn, { maxWait: 20000, timeout: 60000 });
    }
    throw err;
  }
}

/**
 * Creates a new payrun in DRAFT status with initial payslips.
 */
async function createPayrun(data) {
  const pStart = new Date(data.periodStart);
  const pEnd = new Date(data.periodEnd);

  if (pEnd < pStart) {
    throw new AppError('INVALID_PERIOD', 'periodEnd must be on or after periodStart', 422);
  }

  const structure = await prisma.salaryStructure.findUnique({
    where: { id: data.salaryStructureId },
    include: { rules: true },
  });

  if (!structure) {
    throw new AppError('SALARY_STRUCTURE_NOT_FOUND', 'Salary structure not found', 404);
  }

  const totalDays = Math.max(1, differenceInCalendarDays(pEnd, pStart) + 1);

  // Pre-query active contracts in ONE query
  const contracts = await prisma.contract.findMany({
    where: {
      employeeId: { in: data.employeeIds },
      status: 'RUNNING',
      startDate: { lte: pEnd },
      OR: [{ endDate: null }, { endDate: { gte: pStart } }],
    },
  });

  const contractByEmp = new Map();
  for (const c of contracts) {
    if (!contractByEmp.has(c.employeeId)) {
      contractByEmp.set(c.employeeId, c);
    }
  }

  const createdPayrunId = await executeTx(async (tx) => {
    const payrun = await tx.payrun.create({
      data: {
        name: data.name,
        periodStart: pStart,
        periodEnd: pEnd,
        salaryStructureId: data.salaryStructureId,
        status: 'DRAFT',
      },
    });

    await tx.payrunEmployee.createMany({
      data: data.employeeIds.map((empId) => ({
        payrunId: payrun.id,
        employeeId: empId,
      })),
    });

    await tx.payslip.createMany({
      data: data.employeeIds.map((empId) => ({
        payrunId: payrun.id,
        employeeId: empId,
        contractId: contractByEmp.has(empId) ? contractByEmp.get(empId).id : null,
        salaryStructureId: data.salaryStructureId,
        periodStart: pStart,
        periodEnd: pEnd,
        workedDays: totalDays,
        totalDays,
        basic: 0,
        gross: 0,
        net: 0,
        status: 'DRAFT',
      })),
    });

    return payrun.id;
  });

  // Generate initial warnings after transaction commit
  await generatePayrunWarnings(createdPayrunId);

  return getPayrunById(createdPayrunId);
}

/**
 * Computes payroll for all payslips in the payrun.
 */
async function computePayrun(id) {
  const payrun = await prisma.payrun.findUnique({
    where: { id },
    include: {
      salaryStructure: {
        include: {
          rules: { orderBy: { sequence: 'asc' } },
        },
      },
      payslips: {
        include: {
          employee: {
            include: {
              contracts: {
                where: { status: 'RUNNING' },
                include: { salaryStructure: { include: { rules: true } } },
              },
              attendance: true,
            },
          },
        },
      },
    },
  });

  if (!payrun) {
    throw new AppError('PAYRUN_NOT_FOUND', 'Payrun not found', 404);
  }

  if (payrun.status === 'PAID') {
    throw new AppError('PAYRUN_ALREADY_PAID', 'Cannot re-compute a paid payrun; paid payroll is immutable', 400);
  }

  const structureRules = payrun.salaryStructure.rules;
  if (!structureRules || structureRules.length === 0) {
    throw new AppError('EMPTY_SALARY_STRUCTURE', 'Salary structure has no rules defined for calculation', 422);
  }

  const totalDays = Math.max(1, differenceInCalendarDays(new Date(payrun.periodEnd), new Date(payrun.periodStart)) + 1);

  const empIds = payrun.payslips.map((p) => p.employeeId);

  // Pre-query all attendances in period for all employees in ONE query
  const allAttendances = await prisma.attendance.findMany({
    where: {
      employeeId: { in: empIds },
      checkIn: {
        gte: new Date(payrun.periodStart),
        lte: new Date(payrun.periodEnd),
      },
    },
  });

  const attendanceMap = new Map();
  for (const a of allAttendances) {
    if (!attendanceMap.has(a.employeeId)) {
      attendanceMap.set(a.employeeId, []);
    }
    attendanceMap.get(a.employeeId).push(a);
  }

  // Pre-compute calculation lines and updates in memory
  const allLinesToCreate = [];
  const payslipUpdates = [];

  for (const payslip of payrun.payslips) {
    const employee = payslip.employee;

    const contract = employee.contracts.find((c) => {
      const cStart = new Date(c.startDate);
      const cEnd = c.endDate ? new Date(c.endDate) : null;
      return cStart <= new Date(payrun.periodEnd) && (!cEnd || cEnd >= new Date(payrun.periodStart));
    });

    if (!contract) {
      payslipUpdates.push({
        id: payslip.id,
        contractId: null,
        workedDays: totalDays,
        totalDays,
        basic: 0,
        gross: 0,
        net: 0,
        status: 'COMPUTED',
      });
      continue;
    }

    const attendancesInPeriod = attendanceMap.get(employee.id) || [];
    let workedDays = totalDays;
    if (attendancesInPeriod.length > 0) {
      const uniqueDates = new Set(
        attendancesInPeriod.map((a) => new Date(a.checkIn).toISOString().slice(0, 10))
      );
      workedDays = Math.min(totalDays, uniqueDates.size);
    }

    const calculation = computePayslip({
      contract,
      salaryStructureRules: structureRules,
      periodStart: payrun.periodStart,
      periodEnd: payrun.periodEnd,
      workedDays,
      totalDays,
    });

    for (const l of calculation.lines) {
      allLinesToCreate.push({
        payslipId: payslip.id,
        salaryRuleId: l.salaryRuleId,
        name: l.name,
        code: l.code,
        category: l.category,
        sequence: l.sequence,
        amount: l.amount,
      });
    }

    payslipUpdates.push({
      id: payslip.id,
      contractId: contract.id,
      workedDays,
      totalDays,
      basic: calculation.basic,
      gross: calculation.gross,
      net: calculation.net,
      status: 'COMPUTED',
    });
  }

  const payslipIds = payrun.payslips.map((p) => p.id);

  await executeTx(async (tx) => {
    await tx.payslipLine.deleteMany({ where: { payslipId: { in: payslipIds } } });

    if (allLinesToCreate.length > 0) {
      await tx.payslipLine.createMany({ data: allLinesToCreate });
    }

    await Promise.all(
      payslipUpdates.map((update) => {
        const { id: psId, ...data } = update;
        return tx.payslip.update({
          where: { id: psId },
          data,
        });
      })
    );

    await tx.payrun.update({
      where: { id: payrun.id },
      data: { status: 'COMPUTED' },
    });

    return payrun.id;
  });

  // Regenerate warnings after compute transaction commits
  await generatePayrunWarnings(id);

  return getPayrunById(id);
}

/**
 * Validates a payrun. Blocks if unresolved CRITICAL warnings exist.
 */
async function validatePayrun(id) {
  const payrun = await prisma.payrun.findUnique({
    where: { id },
    include: {
      warnings: {
        where: { severity: 'CRITICAL', isResolved: false },
      },
    },
  });

  if (!payrun) {
    throw new AppError('PAYRUN_NOT_FOUND', 'Payrun not found', 404);
  }

  if (payrun.status === 'PAID') {
    throw new AppError('PAYRUN_ALREADY_PAID', 'Payrun is already finalized and paid', 400);
  }

  if (payrun.warnings.length > 0) {
    const criticalMessages = payrun.warnings.map((w) => w.message).join('; ');
    throw new AppError(
      'PAYRUN_HAS_CRITICAL_WARNINGS',
      `Cannot validate payrun. It has ${payrun.warnings.length} unresolved critical warnings: ${criticalMessages}`,
      422
    );
  }

  const updatedId = await executeTx(async (tx) => {
    await tx.payslip.updateMany({
      where: { payrunId: id },
      data: { status: 'VALIDATED' },
    });

    const updated = await tx.payrun.update({
      where: { id },
      data: { status: 'VALIDATED' },
    });

    return updated.id;
  });

  return getPayrunById(updatedId);
}

/**
 * Marks a payrun as PAID. Only allowed from VALIDATED status.
 */
async function markPayrunAsPaid(id) {
  const payrun = await prisma.payrun.findUnique({ where: { id } });

  if (!payrun) {
    throw new AppError('PAYRUN_NOT_FOUND', 'Payrun not found', 404);
  }

  if (payrun.status === 'PAID') {
    throw new AppError('PAYRUN_ALREADY_PAID', 'Payrun is already marked as paid', 400);
  }

  if (payrun.status !== 'VALIDATED') {
    throw new AppError(
      'INVALID_PAYRUN_STATE',
      `Cannot mark payrun as paid from status "${payrun.status}". Payrun must be in VALIDATED status first.`,
      422
    );
  }

  const updatedId = await executeTx(async (tx) => {
    await tx.payslip.updateMany({
      where: { payrunId: id },
      data: { status: 'PAID' },
    });

    const updated = await tx.payrun.update({
      where: { id },
      data: { status: 'PAID' },
    });

    return updated.id;
  });

  return getPayrunById(updatedId);
}

/**
 * Lists payruns with pagination and stats.
 */
async function listPayruns(query) {
  const { page, pageSize, skip, take } = getPaginationParams(query);
  const { status, period } = query;

  const where = {};
  if (status) where.status = status;
  if (period) {
    where.OR = [
      { name: { contains: period, mode: 'insensitive' } },
    ];
  }

  const [payruns, total] = await Promise.all([
    prisma.payrun.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        salaryStructure: { select: { id: true, name: true, code: true } },
        payslips: {
          select: { basic: true, gross: true, net: true, status: true },
        },
        warnings: {
          where: { isResolved: false },
          select: { id: true, severity: true },
        },
        _count: { select: { payrunEmployees: true, payslips: true } },
      },
    }),
    prisma.payrun.count({ where }),
  ]);

  const formatted = payruns.map((p) => {
    const totalBasic = p.payslips.reduce((sum, ps) => sum + (ps.basic || 0), 0);
    const totalGross = p.payslips.reduce((sum, ps) => sum + (ps.gross || 0), 0);
    const totalNet = p.payslips.reduce((sum, ps) => sum + (ps.net || 0), 0);
    const criticalWarningCount = p.warnings.filter((w) => w.severity === 'CRITICAL').length;

    return {
      id: p.id,
      name: p.name,
      periodStart: p.periodStart,
      periodEnd: p.periodEnd,
      salaryStructureId: p.salaryStructureId,
      salaryStructure: p.salaryStructure,
      status: p.status,
      employeeCount: p._count.payrunEmployees,
      payslipCount: p._count.payslips,
      totalBasic: Math.round(totalBasic * 100) / 100,
      totalGross: Math.round(totalGross * 100) / 100,
      totalNet: Math.round(totalNet * 100) / 100,
      warningCount: p.warnings.length,
      criticalWarningCount,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    };
  });

  return formatListResponse(formatted, total, page, pageSize);
}

/**
 * Gets a single payrun by ID with full details.
 */
async function getPayrunById(id, db = prisma) {
  const payrun = await db.payrun.findUnique({
    where: { id },
    include: {
      salaryStructure: {
        include: {
          rules: { orderBy: { sequence: 'asc' } },
        },
      },
      payrunEmployees: {
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
      },
      payslips: {
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
          contract: {
            select: { id: true, wage: true, status: true },
          },
          lines: { orderBy: { sequence: 'asc' } },
        },
        orderBy: { employee: { firstName: 'asc' } },
      },
      warnings: {
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      },
    },
  });

  if (!payrun) {
    throw new AppError('PAYRUN_NOT_FOUND', 'Payrun not found', 404);
  }

  const totalBasic = payrun.payslips.reduce((sum, ps) => sum + (ps.basic || 0), 0);
  const totalGross = payrun.payslips.reduce((sum, ps) => sum + (ps.gross || 0), 0);
  const totalNet = payrun.payslips.reduce((sum, ps) => sum + (ps.net || 0), 0);
  const criticalWarnings = payrun.warnings.filter((w) => w.severity === 'CRITICAL' && !w.isResolved);

  const formattedPayslips = payrun.payslips.map((ps) => ({
    ...ps,
    employee: ps.employee
      ? {
          ...ps.employee,
          name: `${ps.employee.firstName || ''} ${ps.employee.lastName || ''}`.trim(),
        }
      : null,
  }));

  return {
    ...payrun,
    payslips: formattedPayslips,
    employeeCount: payrun.payrunEmployees.length,
    payslipCount: payrun.payslips.length,
    totalBasic: Math.round(totalBasic * 100) / 100,
    totalGross: Math.round(totalGross * 100) / 100,
    totalNet: Math.round(totalNet * 100) / 100,
    warningCount: payrun.warnings.length,
    criticalWarningCount: criticalWarnings.length,
    canValidate: criticalWarnings.length === 0 && payrun.status !== 'PAID',
    canMarkPaid: payrun.status === 'VALIDATED',
  };
}

/**
 * Deletes a payrun if it is not PAID.
 */
async function deletePayrun(id) {
  const payrun = await prisma.payrun.findUnique({ where: { id } });
  if (!payrun) {
    throw new AppError('PAYRUN_NOT_FOUND', 'Payrun not found', 404);
  }

  if (payrun.status === 'PAID') {
    throw new AppError('CANNOT_DELETE_PAID_PAYRUN', 'Cannot delete a paid payrun; historical records are immutable', 400);
  }

  await executeTx(async (tx) => {
    const payslips = await tx.payslip.findMany({ where: { payrunId: id }, select: { id: true } });
    const payslipIds = payslips.map((p) => p.id);

    if (payslipIds.length > 0) {
      await tx.payslipLine.deleteMany({ where: { payslipId: { in: payslipIds } } });
    }
    await tx.payrollWarning.deleteMany({ where: { payrunId: id } });
    await tx.payslip.deleteMany({ where: { payrunId: id } });
    await tx.payrunEmployee.deleteMany({ where: { payrunId: id } });
    await tx.payrun.delete({ where: { id } });
  });

  return { message: 'Payrun deleted successfully' };
}

module.exports = {
  getEligibleEmployees,
  createPayrun,
  computePayrun,
  validatePayrun,
  markPayrunAsPaid,
  listPayruns,
  getPayrunById,
  deletePayrun,
  sendBulkPayrunPayslips,
};
