const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seed() {
  console.log(' Starting PeoplePay360 database seed...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Seed Working Schedule (40 Hours / Week)
  console.log('  -> Seeding Working Schedules...');
  const scheduleLines = [
    { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', breakMinutes: 60, hours: 8.0 },
    { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', breakMinutes: 60, hours: 8.0 },
    { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', breakMinutes: 60, hours: 8.0 },
    { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', breakMinutes: 60, hours: 8.0 },
    { dayOfWeek: 5, startTime: '09:00', endTime: '18:00', breakMinutes: 60, hours: 8.0 },
  ];

  let standardSchedule = await prisma.workingSchedule.findFirst({
    where: { name: '40 Hours / Week' },
  });

  if (!standardSchedule) {
    standardSchedule = await prisma.workingSchedule.create({
      data: {
        name: '40 Hours / Week',
        type: 'STANDARD',
        totalWeeklyHours: 40.0,
        lines: {
          create: scheduleLines,
        },
      },
    });
  }

  // 2. Seed Salary Structure & Rules
  console.log('  -> Seeding Salary Structures & Rules...');
  let regularSalaryStructure = await prisma.salaryStructure.findUnique({
    where: { code: 'REGULAR_SALARY' },
  });

  if (!regularSalaryStructure) {
    regularSalaryStructure = await prisma.salaryStructure.create({
      data: {
        name: 'Regular Salary',
        code: 'REGULAR_SALARY',
        isActive: true,
        rules: {
          create: [
            {
              name: 'Basic Salary',
              code: 'BASIC',
              category: 'BASIC',
              sequence: 1,
              computationType: 'FIXED',
              amount: null, // derived from contract wage
            },
            {
              name: 'House Rent Allowance',
              code: 'HRA',
              category: 'ALLOWANCE',
              sequence: 2,
              computationType: 'PERCENTAGE',
              percentage: 40,
              percentageBasisCode: 'BASIC',
            },
            {
              name: 'Provident Fund',
              code: 'PF',
              category: 'DEDUCTION',
              sequence: 3,
              computationType: 'PERCENTAGE',
              percentage: 12,
              percentageBasisCode: 'BASIC',
            },
            {
              name: 'Gross Salary',
              code: 'GROSS',
              category: 'GROSS',
              sequence: 4,
              computationType: 'FORMULA',
              formula: 'BASIC + HRA',
            },
            {
              name: 'Net Salary',
              code: 'NET',
              category: 'NET',
              sequence: 5,
              computationType: 'FORMULA',
              formula: 'GROSS - PF',
            },
          ],
        },
      },
    });
  }

  // 3. Seed Departments
  console.log('  -> Seeding Departments...');
  const engineeringDept = await prisma.department.upsert({
    where: { code: 'ENG' },
    update: {},
    create: { name: 'Engineering', code: 'ENG' },
  });

  const hrDept = await prisma.department.upsert({
    where: { code: 'HR' },
    update: {},
    create: { name: 'Human Resources', code: 'HR' },
  });

  const salesDept = await prisma.department.upsert({
    where: { code: 'SALES' },
    update: {},
    create: { name: 'Sales & Marketing', code: 'SALES' },
  });

  // 4. Seed Time-Off Types
  console.log('  -> Seeding Time-Off Types...');
  const ptoType = await prisma.timeOffType.upsert({
    where: { code: 'PTO' },
    update: {},
    create: {
      name: 'Paid Time Off',
      code: 'PTO',
      requiresAllocation: true,
      unit: 'DAYS',
    },
  });

  const unpaidType = await prisma.timeOffType.upsert({
    where: { code: 'UNPAID' },
    update: {},
    create: {
      name: 'Unpaid Leave',
      code: 'UNPAID',
      requiresAllocation: false,
      unit: 'DAYS',
    },
  });

  const sickType = await prisma.timeOffType.upsert({
    where: { code: 'SICK' },
    update: {},
    create: {
      name: 'Sick Leave',
      code: 'SICK',
      requiresAllocation: true,
      unit: 'DAYS',
    },
  });

  // 5. Seed Users for all 5 Roles
  console.log('  -> Seeding Users for all 5 roles...');
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@peoplepay360.dev' },
    update: { passwordHash, role: 'ADMIN' },
    create: {
      email: 'admin@peoplepay360.dev',
      passwordHash,
      name: 'Platform Administrator',
      role: 'ADMIN',
    },
  });

  const hrManagerUser = await prisma.user.upsert({
    where: { email: 'hr.manager@peoplepay360.dev' },
    update: { passwordHash, role: 'HR_MANAGER' },
    create: {
      email: 'hr.manager@peoplepay360.dev',
      passwordHash,
      name: 'Helen Rogers (HR Manager)',
      role: 'HR_MANAGER',
    },
  });

  const hrPayrollUser = await prisma.user.upsert({
    where: { email: 'payroll.user@peoplepay360.dev' },
    update: { passwordHash, role: 'HR_PAYROLL_USER' },
    create: {
      email: 'payroll.user@peoplepay360.dev',
      passwordHash,
      name: 'Paul Vance (Payroll User)',
      role: 'HR_PAYROLL_USER',
    },
  });

  const hrPayrollManagerUser = await prisma.user.upsert({
    where: { email: 'payroll.manager@peoplepay360.dev' },
    update: { passwordHash, role: 'HR_PAYROLL_MANAGER' },
    create: {
      email: 'payroll.manager@peoplepay360.dev',
      passwordHash,
      name: 'Pamela Miller (Payroll Manager)',
      role: 'HR_PAYROLL_MANAGER',
    },
  });

  const employeeUser = await prisma.user.upsert({
    where: { email: 'employee@peoplepay360.dev' },
    update: { passwordHash, role: 'EMPLOYEE' },
    create: {
      email: 'employee@peoplepay360.dev',
      passwordHash,
      name: 'Ethan Hunt',
      role: 'EMPLOYEE',
    },
  });

  // 6. Seed Employees across Departments (~8 Employees)
  console.log('  -> Seeding Employees...');
  const employeesData = [
    {
      email: 'employee@peoplepay360.dev',
      userId: employeeUser.id,
      firstName: 'Ethan',
      lastName: 'Hunt',
      phone: '+1-555-0101',
      jobPosition: 'Senior Software Engineer',
      employeeType: 'FULL_TIME',
      departmentId: engineeringDept.id,
      scheduleId: standardSchedule.id,
      wage: 65000,
      bankName: 'Silicon Valley Bank',
      bankAccountNumber: 'SVB-987654321',
      bankIfscOrRouting: 'SVB0001',
      taxId: 'TX-ETHAN-01',
    },
    {
      email: 'alice.chen@peoplepay360.dev',
      firstName: 'Alice',
      lastName: 'Chen',
      phone: '+1-555-0102',
      jobPosition: 'Lead Backend Architect',
      employeeType: 'FULL_TIME',
      departmentId: engineeringDept.id,
      scheduleId: standardSchedule.id,
      wage: 80000,
      bankName: 'Chase Bank',
      bankAccountNumber: 'CHS-123456789',
      bankIfscOrRouting: 'CHS0002',
      taxId: 'TX-ALICE-02',
    },
    {
      email: 'david.kumar@peoplepay360.dev',
      firstName: 'David',
      lastName: 'Kumar',
      phone: '+1-555-0103',
      jobPosition: 'Frontend Developer',
      employeeType: 'FULL_TIME',
      departmentId: engineeringDept.id,
      scheduleId: standardSchedule.id,
      wage: 52000,
      bankName: 'Bank of America',
      bankAccountNumber: 'BOA-456789123',
      bankIfscOrRouting: 'BOA0003',
      taxId: 'TX-DAVID-03',
    },
    {
      email: 'hr.manager@peoplepay360.dev',
      userId: hrManagerUser.id,
      firstName: 'Helen',
      lastName: 'Rogers',
      phone: '+1-555-0104',
      jobPosition: 'Head of People Operations',
      employeeType: 'FULL_TIME',
      departmentId: hrDept.id,
      scheduleId: standardSchedule.id,
      wage: 70000,
      bankName: 'Wells Fargo',
      bankAccountNumber: 'WFG-789123456',
      bankIfscOrRouting: 'WFG0004',
      taxId: 'TX-HELEN-04',
    },
    {
      email: 'sophia.martinez@peoplepay360.dev',
      firstName: 'Sophia',
      lastName: 'Martinez',
      phone: '+1-555-0105',
      jobPosition: 'Talent Acquisition Specialist',
      employeeType: 'FULL_TIME',
      departmentId: hrDept.id,
      scheduleId: standardSchedule.id,
      wage: 48000,
      bankName: 'Citibank',
      bankAccountNumber: 'CITI-321654987',
      bankIfscOrRouting: 'CITI0005',
      taxId: 'TX-SOPHIA-05',
    },
    {
      email: 'marcus.brooks@peoplepay360.dev',
      firstName: 'Marcus',
      lastName: 'Brooks',
      phone: '+1-555-0106',
      jobPosition: 'VP of Sales',
      employeeType: 'FULL_TIME',
      departmentId: salesDept.id,
      scheduleId: standardSchedule.id,
      wage: 90000,
      bankName: 'Chase Bank',
      bankAccountNumber: 'CHS-654987321',
      bankIfscOrRouting: 'CHS0006',
      taxId: 'TX-MARCUS-06',
    },
    {
      email: 'olivia.taylor@peoplepay360.dev',
      firstName: 'Olivia',
      lastName: 'Taylor',
      phone: '+1-555-0107',
      jobPosition: 'Marketing Strategist',
      employeeType: 'FULL_TIME',
      departmentId: salesDept.id,
      scheduleId: standardSchedule.id,
      wage: 55000,
      bankName: 'Wells Fargo',
      bankAccountNumber: 'WFG-147258369',
      bankIfscOrRouting: 'WFG0007',
      taxId: 'TX-OLIVIA-07',
    },
    {
      email: 'liam.wilson@peoplepay360.dev',
      firstName: 'Liam',
      lastName: 'Wilson',
      phone: '+1-555-0108',
      jobPosition: 'Junior Sales Representative',
      employeeType: 'FULL_TIME',
      departmentId: salesDept.id,
      scheduleId: standardSchedule.id,
      wage: 42000,
      bankName: 'Bank of America',
      bankAccountNumber: 'BOA-963852741',
      bankIfscOrRouting: 'BOA0008',
      taxId: 'TX-LIAM-08',
    },
  ];

  const seededEmployees = [];

  for (const emp of employeesData) {
    const createdEmp = await prisma.employee.upsert({
      where: { email: emp.email },
      update: {
        userId: emp.userId || undefined,
        firstName: emp.firstName,
        lastName: emp.lastName,
        jobPosition: emp.jobPosition,
        departmentId: emp.departmentId,
        scheduleId: emp.scheduleId,
        bankName: emp.bankName,
        bankAccountNumber: emp.bankAccountNumber,
        bankIfscOrRouting: emp.bankIfscOrRouting,
        taxId: emp.taxId,
      },
      create: {
        email: emp.email,
        userId: emp.userId || null,
        firstName: emp.firstName,
        lastName: emp.lastName,
        phone: emp.phone,
        jobPosition: emp.jobPosition,
        employeeType: emp.employeeType,
        status: 'ACTIVE',
        departmentId: emp.departmentId,
        scheduleId: emp.scheduleId,
        bankName: emp.bankName,
        bankAccountNumber: emp.bankAccountNumber,
        bankIfscOrRouting: emp.bankIfscOrRouting,
        taxId: emp.taxId,
      },
    });

    seededEmployees.push({ ...createdEmp, wage: emp.wage });

    // Seed Active Contract for each employee
    const existingContract = await prisma.contract.findFirst({
      where: { employeeId: createdEmp.id, status: 'RUNNING' },
    });

    if (!existingContract) {
      await prisma.contract.create({
        data: {
          employeeId: createdEmp.id,
          name: `Employment Contract - ${emp.firstName} ${emp.lastName}`,
          wage: emp.wage,
          startDate: new Date('2026-01-01T00:00:00Z'),
          endDate: null,
          salaryStructureId: regularSalaryStructure.id,
          scheduleId: standardSchedule.id,
          departmentId: emp.departmentId,
          jobPosition: emp.jobPosition,
          status: 'RUNNING',
        },
      });
    }

    // Seed PTO & Sick Allocations (20 days PTO, 10 days Sick)
    const existingPtoAlloc = await prisma.leaveAllocation.findFirst({
      where: { employeeId: createdEmp.id, timeOffTypeId: ptoType.id },
    });

    if (!existingPtoAlloc) {
      await prisma.leaveAllocation.create({
        data: {
          employeeId: createdEmp.id,
          timeOffTypeId: ptoType.id,
          allocatedAmount: 20.0,
          takenAmount: 0.0,
          validFrom: new Date('2026-01-01T00:00:00Z'),
          validTo: new Date('2026-12-31T23:59:59Z'),
          status: 'APPROVED',
        },
      });
    }
  }

  // Set Department Managers
  await prisma.department.update({
    where: { id: engineeringDept.id },
    data: { managerId: seededEmployees[1].id }, // Alice Chen
  });
  await prisma.department.update({
    where: { id: hrDept.id },
    data: { managerId: seededEmployees[3].id }, // Helen Rogers
  });
  await prisma.department.update({
    where: { id: salesDept.id },
    data: { managerId: seededEmployees[5].id }, // Marcus Brooks
  });

  // 7. Seed Attendance Logs (Past 3 weeks across employees)
  console.log('  -> Seeding Attendance logs...');
  const attendanceDates = [
    { in: '2026-08-10T09:00:00Z', out: '2026-08-10T18:00:00Z', status: 'PRESENT', hours: 8.0 },
    { in: '2026-08-11T08:55:00Z', out: '2026-08-11T18:05:00Z', status: 'PRESENT', hours: 8.17 },
    { in: '2026-08-12T09:25:00Z', out: '2026-08-12T18:00:00Z', status: 'LATE', hours: 7.58 },
    { in: '2026-08-13T09:00:00Z', out: '2026-08-13T19:30:00Z', status: 'OVERTIME', hours: 9.5 },
    { in: '2026-08-14T09:00:00Z', out: '2026-08-14T18:00:00Z', status: 'PRESENT', hours: 8.0 },
    { in: '2026-08-17T09:00:00Z', out: '2026-08-17T18:00:00Z', status: 'PRESENT', hours: 8.0 },
    { in: '2026-08-18T08:50:00Z', out: '2026-08-18T18:00:00Z', status: 'PRESENT', hours: 8.17 },
    { in: '2026-08-19T09:30:00Z', out: '2026-08-19T18:00:00Z', status: 'LATE', hours: 7.5 },
    { in: '2026-08-20T09:00:00Z', out: '2026-08-20T19:45:00Z', status: 'OVERTIME', hours: 9.75 },
    { in: '2026-08-21T09:00:00Z', out: '2026-08-21T18:00:00Z', status: 'PRESENT', hours: 8.0 },
  ];

  const primaryEmployee = seededEmployees[0]; // Ethan Hunt
  const existingAttendance = await prisma.attendance.findFirst({
    where: { employeeId: primaryEmployee.id },
  });

  if (!existingAttendance) {
    for (const emp of seededEmployees) {
      for (const log of attendanceDates) {
        await prisma.attendance.create({
          data: {
            employeeId: emp.id,
            checkIn: new Date(log.in),
            checkOut: new Date(log.out),
            workedHours: log.hours,
            status: log.status,
            isManualEdit: false,
          },
        });
      }
    }
  }

  // 8. Seed Time-Off Requests (1 Approved, 1 Pending)
  console.log('  -> Seeding Time-Off Requests...');
  const ethansPtoAlloc = await prisma.leaveAllocation.findFirst({
    where: { employeeId: primaryEmployee.id, timeOffTypeId: ptoType.id },
  });

  const existingRequest = await prisma.timeOffRequest.findFirst({
    where: { employeeId: primaryEmployee.id },
  });

  if (!existingRequest && ethansPtoAlloc) {
    // 1 Approved Request (2 days)
    await prisma.timeOffRequest.create({
      data: {
        employeeId: primaryEmployee.id,
        timeOffTypeId: ptoType.id,
        allocationId: ethansPtoAlloc.id,
        startDate: new Date('2026-08-24T00:00:00Z'),
        endDate: new Date('2026-08-25T23:59:59Z'),
        duration: 2.0,
        reason: 'Family vacation',
        status: 'APPROVED',
        approvedByUserId: hrManagerUser.id,
      },
    });

    await prisma.leaveAllocation.update({
      where: { id: ethansPtoAlloc.id },
      data: { takenAmount: 2.0 },
    });

    // 1 Pending Request (1 day)
    await prisma.timeOffRequest.create({
      data: {
        employeeId: primaryEmployee.id,
        timeOffTypeId: ptoType.id,
        startDate: new Date('2026-09-18T00:00:00Z'),
        endDate: new Date('2026-09-18T23:59:59Z'),
        duration: 1.0,
        reason: 'Personal errand',
        status: 'PENDING',
      },
    });
  }

  // 9. Seed Historical PAID Payrun for August 2026
  console.log('  -> Seeding Historical PAID Payrun (August 2026)...');
  const existingPayrun = await prisma.payrun.findFirst({
    where: { name: 'Payrun - August 2026' },
  });

  if (!existingPayrun) {
    const augPayrun = await prisma.payrun.create({
      data: {
        name: 'Payrun - August 2026',
        periodStart: new Date('2026-08-01T00:00:00Z'),
        periodEnd: new Date('2026-08-31T23:59:59Z'),
        salaryStructureId: regularSalaryStructure.id,
        status: 'PAID',
      },
    });

    const structureRules = await prisma.salaryRule.findMany({
      where: { salaryStructureId: regularSalaryStructure.id },
      orderBy: { sequence: 'asc' },
    });

    for (const emp of seededEmployees) {
      await prisma.payrunEmployee.create({
        data: {
          payrunId: augPayrun.id,
          employeeId: emp.id,
        },
      });

      const contract = await prisma.contract.findFirst({
        where: { employeeId: emp.id, status: 'RUNNING' },
      });

      const wage = contract ? contract.wage : emp.wage;
      const basic = wage;
      const hra = wage * 0.4;
      const pf = wage * 0.12;
      const gross = basic + hra;
      const net = gross - pf;

      const payslip = await prisma.payslip.create({
        data: {
          payrunId: augPayrun.id,
          employeeId: emp.id,
          contractId: contract ? contract.id : null,
          salaryStructureId: regularSalaryStructure.id,
          periodStart: new Date('2026-08-01T00:00:00Z'),
          periodEnd: new Date('2026-08-31T23:59:59Z'),
          workedDays: 31,
          totalDays: 31,
          basic,
          gross,
          net,
          status: 'PAID',
          lines: {
            create: [
              {
                salaryRuleId: structureRules[0]?.id,
                name: 'Basic Salary',
                code: 'BASIC',
                category: 'BASIC',
                sequence: 1,
                amount: basic,
              },
              {
                salaryRuleId: structureRules[1]?.id,
                name: 'House Rent Allowance',
                code: 'HRA',
                category: 'ALLOWANCE',
                sequence: 2,
                amount: hra,
              },
              {
                salaryRuleId: structureRules[2]?.id,
                name: 'Provident Fund',
                code: 'PF',
                category: 'DEDUCTION',
                sequence: 3,
                amount: pf,
              },
              {
                salaryRuleId: structureRules[3]?.id,
                name: 'Gross Salary',
                code: 'GROSS',
                category: 'GROSS',
                sequence: 4,
                amount: gross,
              },
              {
                salaryRuleId: structureRules[4]?.id,
                name: 'Net Salary',
                code: 'NET',
                category: 'NET',
                sequence: 5,
                amount: net,
              },
            ],
          },
        },
      });
    }
  }

  console.log(' PeoplePay360 database seed completed successfully!');
}

seed()
  .catch((e) => {
    console.error(' Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
