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

  return prisma.$transaction(async (tx) => {
    const payrun = await tx.payrun.create({
      data: {
        name: data.name,
        periodStart: pStart,
        periodEnd: pEnd,
        salaryStructureId: data.salaryStructureId,
        status: 'DRAFT',
      },
    });

    for (const empId of data.employeeIds) {
      await tx.payrunEmployee.create({
        data: {
          payrunId: payrun.id,
          employeeId: empId,
        },
      });

      // Find contract overlapping period if any
      const activeContract = await tx.contract.findFirst({
        where: {
          employeeId: empId,
          status: 'RUNNING',
          startDate: { lte: pEnd },
          OR: [{ endDate: null }, { endDate: { gte: pStart } }],
        },
      });

      await tx.payslip.create({
        data: {
          payrunId: payrun.id,
          employeeId: empId,
          contractId: activeContract ? activeContract.id : null,
          salaryStructureId: data.salaryStructureId,
          periodStart: pStart,
          periodEnd: pEnd,
          workedDays: totalDays,
          totalDays,
          basic: 0,
          gross: 0,
          net: 0,
          status: 'DRAFT',
        },
      });
    }

    // Generate initial warnings
    await generatePayrunWarnings(payrun.id, tx);

    return getPayrunById(payrun.id, tx);
  });
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

  return prisma.$transaction(async (tx) => {
    for (const payslip of payrun.payslips) {
      const employee = payslip.employee;

      // Find contract overlapping period
      const contract = employee.contracts.find((c) => {
        const cStart = new Date(c.startDate);
        const cEnd = c.endDate ? new Date(c.endDate) : null;
        return cStart <= new Date(payrun.periodEnd) && (!cEnd || cEnd >= new Date(payrun.periodStart));
      });

      if (!contract) {
        // Leave payslip at 0 amounts and status COMPUTED with warning
        await tx.payslipLine.deleteMany({ where: { payslipId: payslip.id } });
        await tx.payslip.update({
          where: { id: payslip.id },
          data: {
            basic: 0,
            gross: 0,
            net: 0,
            status: 'COMPUTED',
            contractId: null,
          },
        });
        continue;
      }

      // Calculate worked days from attendance in period
      const attendancesInPeriod = await tx.attendance.findMany({
        where: {
          employeeId: employee.id,
          checkIn: {
            gte: new Date(payrun.periodStart),
            lte: new Date(payrun.periodEnd),
          },
        },
      });

      // If attendances are recorded, count unique days; otherwise default to totalDays
      let workedDays = totalDays;
      if (attendancesInPeriod.length > 0) {
        const uniqueDates = new Set(
          attendancesInPeriod.map((a) => new Date(a.checkIn).toISOString().slice(0, 10))
        );
        workedDays = Math.min(totalDays, uniqueDates.size);
      }

      // Compute with engine
      const calculation = computePayslip({
        contract,
        salaryStructureRules: structureRules,
        periodStart: payrun.periodStart,
        periodEnd: payrun.periodEnd,
        workedDays,
        totalDays,
      });

      // Atomically replace lines
      await tx.payslipLine.deleteMany({ where: { payslipId: payslip.id } });

      await tx.payslipLine.createMany({
        data: calculation.lines.map((l) => ({
          payslipId: payslip.id,
          salaryRuleId: l.salaryRuleId,
          name: l.name,
          code: l.code,
          category: l.category,
          sequence: l.sequence,
          amount: l.amount,
        })),
      });

      await tx.payslip.update({
        where: { id: payslip.id },
        data: {
          contractId: contract.id,
          workedDays,
          totalDays,
          basic: calculation.basic,
          gross: calculation.gross,
          net: calculation.net,
          status: 'COMPUTED',
        },
      });
    }

    // Regenerate warnings
    await generatePayrunWarnings(payrun.id, tx);

    // Update payrun status to COMPUTED
    await tx.payrun.update({
      where: { id: payrun.id },
      data: { status: 'COMPUTED' },
    });

    return getPayrunById(payrun.id, tx);
  });
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

  return prisma.$transaction(async (tx) => {
    await tx.payslip.updateMany({
      where: { payrunId: id },
      data: { status: 'VALIDATED' },
    });

    const updated = await tx.payrun.update({
      where: { id },
      data: { status: 'VALIDATED' },
    });

    return getPayrunById(updated.id, tx);
  });
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

  return prisma.$transaction(async (tx) => {
    await tx.payslip.updateMany({
      where: { payrunId: id },
      data: { status: 'PAID' },
    });

    const updated = await tx.payrun.update({
      where: { id },
      data: { status: 'PAID' },
    });

    return getPayrunById(updated.id, tx);
  });
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

  return {
    ...payrun,
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

  await prisma.payrun.delete({ where: { id } });
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
