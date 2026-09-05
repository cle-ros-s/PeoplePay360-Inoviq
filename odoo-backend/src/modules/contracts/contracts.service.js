const prisma = require('../../config/prisma');
const { getPaginationParams } = require('../../utils/pagination');
const { formatListResponse, AppError } = require('../../utils/responseFormatter');

async function listContracts(query, scopedEmployeeId = null) {
  const { page, pageSize, skip, take } = getPaginationParams(query);
  const { employeeId, status } = query;

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

  return formatListResponse(contracts, total, page, pageSize);
}

async function getContractById(id, scopedEmployeeId = null) {
  const contract = await prisma.contract.findUnique({
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

  if (!contract) {
    throw new AppError('CONTRACT_NOT_FOUND', 'Contract not found', 404);
  }

  if (scopedEmployeeId && contract.employeeId !== scopedEmployeeId) {
    throw new AppError('FORBIDDEN', 'Access denied to this contract record', 403);
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

  return prisma.contract.create({
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

  return prisma.contract.update({
    where: { id },
    data: updateData,
    include: {
      employee: { select: { id: true, firstName: true, lastName: true } },
      salaryStructure: { select: { id: true, name: true, code: true } },
      schedule: { select: { id: true, name: true } },
    },
  });
}

async function deleteContract(id) {
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: { payslips: { take: 1 } },
  });

  if (!contract) {
    throw new AppError('CONTRACT_NOT_FOUND', 'Contract not found', 404);
  }

  if (contract.payslips.length > 0) {
    throw new AppError('CONTRACT_HAS_PAYSLIPS', 'Cannot delete contract linked to existing payslips', 400);
  }

  await prisma.contract.delete({ where: { id } });
  return { message: 'Contract deleted successfully' };
}

module.exports = {
  listContracts,
  getContractById,
  createContract,
  updateContract,
  deleteContract,
};
