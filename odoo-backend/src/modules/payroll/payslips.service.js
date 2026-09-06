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

async function getPayslipById(id, scopedEmployeeId = null) {
  const cacheKey = `payslips:detail:${id}`;

  const payslip = await globalCache.getOrFetch(cacheKey, async () => {
    const found = await prisma.payslip.findUnique({
      where: { id },
      include: {
        employee: {
          include: {
            department: true,
            schedule: true,
          },
        },
        contract: true,
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

  if (payslip.employee) {
    payslip.employee = {
      ...payslip.employee,
      name: `${payslip.employee.firstName || ''} ${payslip.employee.lastName || ''}`.trim(),
    };
  }

  return payslip;
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
