const prisma = require('../../config/prisma');

/**
 * Evaluates and regenerates all payroll warnings for a given payrun and its payslips
 * @param {string} payrunId - ID of the payrun
 * @param {Object} [tx] - Optional Prisma transaction client
 * @returns {Promise<Array>} List of generated warnings
 */
async function generatePayrunWarnings(payrunId, tx = prisma) {
  // Delete previous unresolved warnings for this payrun to prevent uncontrolled duplicates
  await tx.payrollWarning.deleteMany({
    where: { payrunId },
  });

  const payrun = await tx.payrun.findUnique({
    where: { id: payrunId },
    include: {
      payrunEmployees: {
        include: {
          employee: {
            include: {
              schedule: true,
              contracts: {
                where: {
                  status: 'RUNNING',
                },
              },
            },
          },
        },
      },
      payslips: {
        include: {
          employee: {
            include: {
              schedule: true,
              contracts: {
                where: { status: 'RUNNING' },
              },
            },
          },
        },
      },
    },
  });

  if (!payrun) return [];

  const employeeIds = payrun.payrunEmployees.map((pe) => pe.employee.id);

  // Batch query duplicate payslips across employees in a single query
  const duplicatePayslips = await tx.payslip.findMany({
    where: {
      employeeId: { in: employeeIds },
      payrunId: { not: payrunId },
      periodStart: { lte: payrun.periodEnd },
      periodEnd: { gte: payrun.periodStart },
      status: { in: ['COMPUTED', 'VALIDATED', 'PAID'] },
    },
    include: { payrun: true },
  });

  const duplicateMap = new Map();
  for (const dp of duplicatePayslips) {
    if (!duplicateMap.has(dp.employeeId)) {
      duplicateMap.set(dp.employeeId, dp);
    }
  }

  const warningsToCreate = [];

  for (const pe of payrun.payrunEmployees) {
    const employee = pe.employee;
    const payslip = payrun.payslips.find((p) => p.employeeId === employee.id);

    // 1. Check Missing Bank Details (WARNING)
    if (!employee.bankAccountNumber || !employee.bankName) {
      warningsToCreate.push({
        payrunId,
        payslipId: payslip ? payslip.id : null,
        employeeId: employee.id,
        warningType: 'MISSING_BANK_DETAILS',
        severity: 'WARNING',
        message: `Employee ${employee.firstName} ${employee.lastName} is missing bank details (account or bank name)`,
      });
    }

    // 2. Check Missing Schedule (WARNING)
    if (!employee.scheduleId || !employee.schedule) {
      warningsToCreate.push({
        payrunId,
        payslipId: payslip ? payslip.id : null,
        employeeId: employee.id,
        warningType: 'MISSING_SCHEDULE',
        severity: 'WARNING',
        message: `Employee ${employee.firstName} ${employee.lastName} has no assigned working schedule`,
      });
    }

    // 3. Check Missing Contract (CRITICAL)
    const activeContract = employee.contracts.find((c) => {
      const contractStart = new Date(c.startDate);
      const contractEnd = c.endDate ? new Date(c.endDate) : null;
      const periodStart = new Date(payrun.periodStart);
      const periodEnd = new Date(payrun.periodEnd);
      // Contract must overlap with period
      return contractStart <= periodEnd && (!contractEnd || contractEnd >= periodStart);
    });

    if (!activeContract) {
      warningsToCreate.push({
        payrunId,
        payslipId: payslip ? payslip.id : null,
        employeeId: employee.id,
        warningType: 'MISSING_CONTRACT',
        severity: 'CRITICAL',
        message: `Employee ${employee.firstName} ${employee.lastName} has no active contract overlapping the pay period`,
      });
    }

    // 4. Check Duplicate Payslip in another payrun
    const duplicatePayslip = duplicateMap.get(employee.id);

    if (duplicatePayslip) {
      const isLockedOrPaid =
        duplicatePayslip.payrun?.status === 'PAID' || duplicatePayslip.payrun?.status === 'VALIDATED';

      warningsToCreate.push({
        payrunId,
        payslipId: payslip ? payslip.id : null,
        employeeId: employee.id,
        warningType: 'DUPLICATE_PAYSLIP',
        severity: isLockedOrPaid ? 'CRITICAL' : 'WARNING',
        message: isLockedOrPaid
          ? `Employee ${employee.firstName} ${employee.lastName} already has a finalized payslip in payrun "${duplicatePayslip.payrun.name}" for overlapping period`
          : `Employee ${employee.firstName} ${employee.lastName} has an unvalidated payslip in concurrent draft payrun "${duplicatePayslip.payrun.name}" for overlapping period`,
      });
    }

    // 5. Check Negative Net Salary (CRITICAL)
    if (payslip && payslip.net < 0) {
      warningsToCreate.push({
        payrunId,
        payslipId: payslip.id,
        employeeId: employee.id,
        warningType: 'NEGATIVE_NET',
        severity: 'CRITICAL',
        message: `Employee ${employee.firstName} ${employee.lastName} has a negative net salary (${payslip.net})`,
      });
    }
  }

  if (warningsToCreate.length > 0) {
    await tx.payrollWarning.createMany({
      data: warningsToCreate,
    });
  }

  return tx.payrollWarning.findMany({
    where: { payrunId },
    include: {
      employee: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  });
}

/**
 * Resolves an individual payroll warning by ID.
 */
async function resolveWarning(warningId) {
  return prisma.payrollWarning.update({
    where: { id: warningId },
    data: { isResolved: true },
  });
}

/**
 * Resolves all payroll warnings for a given payrun.
 */
async function resolveAllWarnings(payrunId) {
  return prisma.payrollWarning.updateMany({
    where: { payrunId, isResolved: false },
    data: { isResolved: true },
  });
}

module.exports = {
  generatePayrunWarnings,
  resolveWarning,
  resolveAllWarnings,
};
