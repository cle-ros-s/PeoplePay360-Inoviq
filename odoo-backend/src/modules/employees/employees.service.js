const prisma = require('../../config/prisma');
const { getPaginationParams } = require('../../utils/pagination');
const { formatListResponse, AppError } = require('../../utils/responseFormatter');

function extractEmployeeData(data) {
  let firstName = data.firstName;
  let lastName = data.lastName;

  if (!firstName && data.name) {
    const parts = data.name.trim().split(/\s+/);
    firstName = parts[0] || 'Employee';
    lastName = parts.slice(1).join(' ') || '.';
  }

  const clean = {};
  if (firstName !== undefined) clean.firstName = firstName;
  if (lastName !== undefined) clean.lastName = lastName;
  if (data.email !== undefined && data.email !== null) clean.email = data.email.toLowerCase().trim();
  if (data.phone !== undefined) clean.phone = data.phone || null;
  if (data.jobPosition !== undefined) clean.jobPosition = data.jobPosition;
  if (data.employeeType !== undefined) clean.employeeType = data.employeeType;
  if (data.status !== undefined) clean.status = data.status;
  if (data.departmentId !== undefined) clean.departmentId = data.departmentId || null;
  if (data.managerId !== undefined) clean.managerId = data.managerId || null;
  if (data.scheduleId !== undefined) clean.scheduleId = data.scheduleId || null;
  if (data.userId !== undefined) clean.userId = data.userId || null;
  if (data.bankName !== undefined) clean.bankName = data.bankName || null;
  if (data.bankAccountNumber !== undefined) clean.bankAccountNumber = data.bankAccountNumber || null;
  if (data.bankIfscOrRouting !== undefined || data.bankIfsc !== undefined) {
    clean.bankIfscOrRouting = data.bankIfscOrRouting || data.bankIfsc || null;
  }
  if (data.taxId !== undefined) clean.taxId = data.taxId || null;

  return clean;
}

const employeeListCache = new Map();
const EMP_CACHE_TTL = 15 * 1000;

function getEmpCacheKey(query, scopedEmployeeId) {
  return `${scopedEmployeeId || 'all'}:${JSON.stringify(query || {})}`;
}

async function listEmployees(query, scopedEmployeeId = null) {
  const cacheKey = getEmpCacheKey(query, scopedEmployeeId);
  const cached = employeeListCache.get(cacheKey);
  const now = Date.now();

  if (cached && now - cached.timestamp < EMP_CACHE_TTL) {
    return cached.data;
  }

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
        user: { select: { id: true, name: true, email: true, role: true } },
        department: { select: { id: true, name: true, code: true } },
        manager: { select: { id: true, firstName: true, lastName: true, email: true } },
        schedule: { select: { id: true, name: true, totalWeeklyHours: true } },
        contracts: {
          where: { status: 'RUNNING' },
          take: 1,
          select: { id: true, wage: true, startDate: true, endDate: true, status: true },
        },
      },
    }),
    prisma.employee.count({ where }),
  ]);

  const formatted = employees.map((emp) => ({
    id: emp.id,
    userId: emp.userId,
    user: emp.user,
    role: emp.user?.role || 'EMPLOYEE',
    firstName: emp.firstName,
    lastName: emp.lastName,
    name: `${emp.firstName} ${emp.lastName}`.trim(),
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
      contracts: emp.contracts?.length || 0,
      attendance: 0,
      timeOffRequests: 0,
      allocations: 0,
      payslips: 0,
    },
    createdAt: emp.createdAt,
    updatedAt: emp.updatedAt,
  }));

  const response = formatListResponse(formatted, total, page, pageSize);
  employeeListCache.set(cacheKey, { timestamp: Date.now(), data: response });
  return response;
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
  const cleanData = extractEmployeeData(data);

  const existing = await prisma.employee.findUnique({
    where: { email: cleanData.email },
  });

  if (existing) {
    throw new AppError('DUPLICATE_EMAIL', 'An employee with this email already exists', 409);
  }

  if (cleanData.userId) {
    const userAlreadyLinked = await prisma.employee.findUnique({
      where: { userId: cleanData.userId },
    });
    if (userAlreadyLinked) {
      throw new AppError('USER_ALREADY_LINKED', 'This user is already linked to another employee', 409);
    }
  }

  return prisma.employee.create({
    data: cleanData,
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

  const cleanData = extractEmployeeData(data);
  if (cleanData.managerId === id) {
    cleanData.managerId = null;
  }

  if (cleanData.email && cleanData.email !== employee.email) {
    const existing = await prisma.employee.findUnique({
      where: { email: cleanData.email },
    });
    if (existing) {
      throw new AppError('DUPLICATE_EMAIL', 'An employee with this email already exists', 409);
    }
  }

  return prisma.employee.update({
    where: { id },
    data: cleanData,
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
