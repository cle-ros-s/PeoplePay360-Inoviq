const prisma = require('../../config/prisma');
const { getPaginationParams } = require('../../utils/pagination');
const { formatListResponse, AppError } = require('../../utils/responseFormatter');

async function listEmployees(query, scopedEmployeeId = null) {
  const { page, pageSize, skip, take } = getPaginationParams(query);
  const { search, department, status, type } = query;

  const where = {};

  if (scopedEmployeeId) {
    where.id = scopedEmployeeId;
  } else {
    if (status) where.status = status;
    if (type) where.employeeType = type;
    if (department) {
      where.OR = [{ departmentId: department }, { department: { name: { contains: department, mode: 'insensitive' } } }];
    }
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { jobPosition: { contains: search, mode: 'insensitive' } },
      ];
    }
  }

  const [employees, total] = await Promise.all([
    prisma.employee.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        department: { select: { id: true, name: true, code: true } },
        manager: { select: { id: true, firstName: true, lastName: true, email: true } },
        schedule: { select: { id: true, name: true, totalWeeklyHours: true } },
        contracts: {
          where: { status: 'RUNNING' },
          take: 1,
          select: { id: true, wage: true, startDate: true, endDate: true, status: true },
        },
        _count: {
          select: {
            contracts: true,
            attendance: true,
            timeOffRequests: true,
            allocations: true,
            payslips: true,
          },
        },
      },
    }),
    prisma.employee.count({ where }),
  ]);

  const formatted = employees.map((emp) => ({
    id: emp.id,
    userId: emp.userId,
    firstName: emp.firstName,
    lastName: emp.lastName,
    name: `${emp.firstName} ${emp.lastName}`,
    email: emp.email,
    phone: emp.phone,
    jobPosition: emp.jobPosition,
    employeeType: emp.employeeType,
    status: emp.status,
    departmentId: emp.departmentId,
    department: emp.department,
    managerId: emp.managerId,
    manager: emp.manager,
    scheduleId: emp.scheduleId,
    schedule: emp.schedule,
    bankName: emp.bankName,
    bankAccountNumber: emp.bankAccountNumber,
    bankIfscOrRouting: emp.bankIfscOrRouting,
    taxId: emp.taxId,
    activeContract: emp.contracts[0] || null,
    counts: {
      contracts: emp._count.contracts,
      attendance: emp._count.attendance,
      timeOffRequests: emp._count.timeOffRequests,
      allocations: emp._count.allocations,
      payslips: emp._count.payslips,
    },
    createdAt: emp.createdAt,
    updatedAt: emp.updatedAt,
  }));

  return formatListResponse(formatted, total, page, pageSize);
}

async function getEmployeeById(id, scopedEmployeeId = null) {
  if (scopedEmployeeId && scopedEmployeeId !== id) {
    throw new AppError('FORBIDDEN', 'Access denied to this employee record', 403);
  }

  const employee = await prisma.employee.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, role: true } },
      department: true,
      manager: { select: { id: true, firstName: true, lastName: true, email: true, jobPosition: true } },
      subordinates: { select: { id: true, firstName: true, lastName: true, email: true, jobPosition: true } },
      schedule: {
        include: {
          lines: { orderBy: { dayOfWeek: 'asc' } },
        },
      },
      contracts: {
        orderBy: { startDate: 'desc' },
        include: {
          salaryStructure: { select: { id: true, name: true, code: true } },
        },
      },
      _count: {
        select: {
          contracts: true,
          attendance: true,
          timeOffRequests: true,
          allocations: true,
          payslips: true,
        },
      },
    },
  });

  if (!employee) {
    throw new AppError('EMPLOYEE_NOT_FOUND', 'Employee not found', 404);
  }

  const activeContract = employee.contracts.find((c) => c.status === 'RUNNING') || null;

  return {
    ...employee,
    name: `${employee.firstName} ${employee.lastName}`,
    activeContract,
    counts: {
      contracts: employee._count.contracts,
      attendance: employee._count.attendance,
      timeOffRequests: employee._count.timeOffRequests,
      allocations: employee._count.allocations,
      payslips: employee._count.payslips,
    },
  };
}

async function createEmployee(data) {
  const existing = await prisma.employee.findUnique({
    where: { email: data.email.toLowerCase().trim() },
  });

  if (existing) {
    throw new AppError('DUPLICATE_EMAIL', 'An employee with this email already exists', 409);
  }

  if (data.userId) {
    const userAlreadyLinked = await prisma.employee.findUnique({
      where: { userId: data.userId },
    });
    if (userAlreadyLinked) {
      throw new AppError('USER_ALREADY_LINKED', 'This user is already linked to another employee', 409);
    }
  }

  return prisma.employee.create({
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email.toLowerCase().trim(),
      phone: data.phone || null,
      jobPosition: data.jobPosition,
      employeeType: data.employeeType || 'FULL_TIME',
      status: data.status || 'ACTIVE',
      departmentId: data.departmentId || null,
      managerId: data.managerId || null,
      scheduleId: data.scheduleId || null,
      userId: data.userId || null,
      bankName: data.bankName || null,
      bankAccountNumber: data.bankAccountNumber || null,
      bankIfscOrRouting: data.bankIfscOrRouting || null,
      taxId: data.taxId || null,
    },
    include: {
      department: true,
      schedule: true,
      manager: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

async function updateEmployee(id, data) {
  const employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) {
    throw new AppError('EMPLOYEE_NOT_FOUND', 'Employee not found', 404);
  }

  if (data.email && data.email.toLowerCase().trim() !== employee.email) {
    const existing = await prisma.employee.findUnique({
      where: { email: data.email.toLowerCase().trim() },
    });
    if (existing) {
      throw new AppError('DUPLICATE_EMAIL', 'An employee with this email already exists', 409);
    }
  }

  const updateData = { ...data };
  if (updateData.email) updateData.email = updateData.email.toLowerCase().trim();

  return prisma.employee.update({
    where: { id },
    data: updateData,
    include: {
      department: true,
      schedule: true,
      manager: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

async function deleteEmployee(id) {
  const employee = await prisma.employee.findUnique({ where: { id } });
  if (!employee) {
    throw new AppError('EMPLOYEE_NOT_FOUND', 'Employee not found', 404);
  }

  await prisma.employee.delete({ where: { id } });
  return { message: 'Employee deleted successfully' };
}

module.exports = {
  listEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
