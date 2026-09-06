const prisma = require('../../config/prisma');
const { getPaginationParams } = require('../../utils/pagination');
const { formatListResponse, AppError } = require('../../utils/responseFormatter');
const { globalCache } = require('../../utils/cache');
const { invalidateDashboardCache } = require('../dashboard/dashboard.service');

function invalidateContractCache() {
  globalCache.invalidatePrefix('contracts:');
  globalCache.invalidatePrefix('employees:');
  invalidateDashboardCache();
}

async function listContracts(query, scopedEmployeeId = null) {
  const { page, pageSize, skip, take } = getPaginationParams(query);
  const { employeeId, status } = query;
  const cacheKey = `contracts:list:${scopedEmployeeId || 'all'}:${employeeId || ''}:${status || ''}:${page}:${pageSize}`;

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

    const [contracts, total] = await Promise.all([
      prisma.contract.findMany({
        where,
        skip,
        take,
        orderBy: [{ status: 'asc' }, { startDate: 'desc' }],
        include: {
          employee: {
            select: { id: true, firstName: true, lastName: true, email: true, jobPosition: true },
          },
          salaryStructure: {
            select: { id: true, name: true, code: true },
          },
          schedule: {
            select: { id: true, name: true, totalWeeklyHours: true },
          },
          department: {
            select: { id: true, name: true, code: true },
          },
        },
      }),
      prisma.contract.count({ where }),
    ]);

    const formattedContracts = contracts.map((c) => ({
      ...c,
      employee: c.employee
        ? {
            ...c.employee,
            name: `${c.employee.firstName || ''} ${c.employee.lastName || ''}`.trim(),
          }
        : null,
    }));

    return formatListResponse(formattedContracts, total, page, pageSize);
  }, 30000);
}

async function getContractById(id, scopedEmployeeId = null) {
  const cacheKey = `contracts:detail:${id}`;

  const contract = await globalCache.getOrFetch(cacheKey, async () => {
    const found = await prisma.contract.findUnique({
      where: { id },
      include: {
        employee: {
          select: { id: true, firstName: true, lastName: true, email: true, jobPosition: true, departmentId: true },
        },
        salaryStructure: {
          include: {
            rules: { orderBy: { sequence: 'asc' } },
          },
        },
        schedule: {
          include: {
            lines: { orderBy: { dayOfWeek: 'asc' } },
          },
        },
        department: true,
      },
    });

    if (!found) {
      throw new AppError('CONTRACT_NOT_FOUND', 'Contract not found', 404);
    }
    return found;
  }, 30000);

  if (scopedEmployeeId && contract.employeeId !== scopedEmployeeId) {
    throw new AppError('FORBIDDEN', 'Access denied to this contract record', 403);
  }

  if (contract.employee) {
    contract.employee.name = `${contract.employee.firstName || ''} ${contract.employee.lastName || ''}`.trim();
  }

  return contract;
}

async function createContract(data) {
  const employee = await prisma.employee.findUnique({ where: { id: data.employeeId } });
  if (!employee) {
    throw new AppError('EMPLOYEE_NOT_FOUND', 'Target employee not found', 404);
  }

  const salaryStructure = await prisma.salaryStructure.findUnique({
    where: { id: data.salaryStructureId },
  });
  if (!salaryStructure) {
    throw new AppError('SALARY_STRUCTURE_NOT_FOUND', 'Salary structure not found', 404);
  }

  // If status is RUNNING, ensure previous RUNNING contracts for this employee are marked EXPIRED
  if (data.status === 'RUNNING') {
    await prisma.contract.updateMany({
      where: { employeeId: data.employeeId, status: 'RUNNING' },
      data: { status: 'EXPIRED' },
    });
  }

  const contractName = data.name || `${employee.firstName} ${employee.lastName} Contract`;

  const result = await prisma.contract.create({
    data: {
      employeeId: data.employeeId,
      name: contractName,
      wage: data.wage,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      salaryStructureId: data.salaryStructureId,
      scheduleId: data.scheduleId || employee.scheduleId || null,
      departmentId: data.departmentId || employee.departmentId || null,
      jobPosition: data.jobPosition || employee.jobPosition || null,
      status: data.status || 'DRAFT',
    },
    include: {
      employee: { select: { id: true, firstName: true, lastName: true } },
      salaryStructure: { select: { id: true, name: true, code: true } },
    },
  });

  invalidateContractCache();
  return result;
}

async function updateContract(id, data) {
  const contract = await prisma.contract.findUnique({ where: { id } });
  if (!contract) {
    throw new AppError('CONTRACT_NOT_FOUND', 'Contract not found', 404);
  }

  if (data.status === 'RUNNING' && contract.status !== 'RUNNING') {
    await prisma.contract.updateMany({
      where: { employeeId: contract.employeeId, status: 'RUNNING', id: { not: id } },
      data: { status: 'EXPIRED' },
    });
  }

  const updateData = { ...data };
  if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
  if (updateData.endDate !== undefined) {
    updateData.endDate = updateData.endDate ? new Date(updateData.endDate) : null;
  }

  const result = await prisma.contract.update({
    where: { id },
    data: updateData,
    include: {
      employee: { select: { id: true, firstName: true, lastName: true } },
      salaryStructure: { select: { id: true, name: true, code: true } },
      schedule: { select: { id: true, name: true } },
    },
  });

  invalidateContractCache();
  return result;
}

async function deleteContract(id) {
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: {
      payslips: {
        select: { id: true, status: true },
      },
    },
  });

  if (!contract) {
    throw new AppError('CONTRACT_NOT_FOUND', 'Contract not found', 404);
  }

  // Check if any linked payslips are finalized/paid
  const hasPaidPayslips = contract.payslips.some((p) => p.status === 'PAID');

  if (hasPaidPayslips) {
    // Gracefully cancel and archive the contract to preserve audit integrity
    await prisma.contract.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
    return {
      message: 'Contract is linked to historical paid payslips; it has been marked as CANCELLED and archived.',
      status: 'CANCELLED',
    };
  }

  // If only linked to draft/computed payslips, unlink them cleanly and delete
  if (contract.payslips.length > 0) {
    await prisma.payslip.updateMany({
      where: { contractId: id },
      data: { contractId: null },
    });
  }

  await prisma.contract.delete({ where: { id } });
  invalidateContractCache();
  return { message: 'Contract deleted successfully' };
}

module.exports = {
  listContracts,
  getContractById,
  createContract,
  updateContract,
  deleteContract,
  invalidateContractCache,
};

