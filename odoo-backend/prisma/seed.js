const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const SIXTY_PROFILES = [
  { email: 'admin@payflux.com', firstName: 'Tony', lastName: 'Stark', role: 'ADMIN', jobPosition: 'Chief Executive Officer', deptCode: 'OPS', wage: 150000 },
  { email: 'admin2@payflux.com', firstName: 'Bruce', lastName: 'Wayne', role: 'ADMIN', jobPosition: 'Chief People Officer', deptCode: 'HR', wage: 140000 },
  { email: 'hr.manager@payflux.com', firstName: 'Sarah', lastName: 'Connor', role: 'HR_MANAGER', jobPosition: 'Director of HR', deptCode: 'HR', wage: 95000 },
  { email: 'payroll.manager@payflux.com', firstName: 'Dwight', lastName: 'Schrute', role: 'HR_PAYROLL_MANAGER', jobPosition: 'Payroll Manager', deptCode: 'FIN', wage: 98000 },
  { email: 'payroll.user@payflux.com', firstName: 'Michael', lastName: 'Scott', role: 'HR_PAYROLL_USER', jobPosition: 'Payroll Specialist', deptCode: 'FIN', wage: 75000 },
  { email: 'employee@payflux.com', firstName: 'Jim', lastName: 'Halpert', role: 'EMPLOYEE', jobPosition: 'Sales Lead', deptCode: 'SALES', wage: 72000 },
  { email: 'pam.beesly@payflux.com', firstName: 'Pam', lastName: 'Beesly', role: 'EMPLOYEE', jobPosition: 'Office Administrator', deptCode: 'HR', wage: 52000 },
  { email: 'alice.chen@payflux.com', firstName: 'Alice', lastName: 'Chen', role: 'HR_MANAGER', jobPosition: 'VP of Engineering', deptCode: 'ENG', wage: 135000 },
  { email: 'ethan.hunt@payflux.com', firstName: 'Ethan', lastName: 'Hunt', role: 'EMPLOYEE', jobPosition: 'Senior Software Engineer', deptCode: 'ENG', wage: 110000 },
  { email: 'bob.smith@payflux.com', firstName: 'Bob', lastName: 'Smith', role: 'EMPLOYEE', jobPosition: 'Frontend Engineer', deptCode: 'ENG', wage: 85000 },
  { email: 'carlos.mendoza@payflux.com', firstName: 'Carlos', lastName: 'Mendoza', role: 'EMPLOYEE', jobPosition: 'Backend Architect', deptCode: 'ENG', wage: 125000 },
  { email: 'diana.prince@payflux.com', firstName: 'Diana', lastName: 'Prince', role: 'EMPLOYEE', jobPosition: 'DevOps Lead', deptCode: 'ENG', wage: 118000 },
  { email: 'edward.nygma@payflux.com', firstName: 'Edward', lastName: 'Nygma', role: 'EMPLOYEE', jobPosition: 'Data Engineer', deptCode: 'ENG', wage: 92000 },
  { email: 'fiona.gallagher@payflux.com', firstName: 'Fiona', lastName: 'Gallagher', role: 'EMPLOYEE', jobPosition: 'QA Lead', deptCode: 'ENG', wage: 80000 },
  { email: 'george.clark@payflux.com', firstName: 'George', lastName: 'Clark', role: 'EMPLOYEE', jobPosition: 'Full Stack Developer', deptCode: 'ENG', wage: 90000 },
  { email: 'hannah.abbott@payflux.com', firstName: 'Hannah', lastName: 'Abbott', role: 'EMPLOYEE', jobPosition: 'UI/UX Designer', deptCode: 'ENG', wage: 82000 },
  { email: 'ian.malcolm@payflux.com', firstName: 'Ian', lastName: 'Malcolm', role: 'EMPLOYEE', jobPosition: 'SRE Lead', deptCode: 'ENG', wage: 105000 },
  { email: 'jessica.jones@payflux.com', firstName: 'Jessica', lastName: 'Jones', role: 'EMPLOYEE', jobPosition: 'Security Engineer', deptCode: 'ENG', wage: 112000 },
  { email: 'kevin.flynn@payflux.com', firstName: 'Kevin', lastName: 'Flynn', role: 'EMPLOYEE', jobPosition: 'Systems Engineer', deptCode: 'ENG', wage: 94000 },
  { email: 'marcus.brooks@payflux.com', firstName: 'Marcus', lastName: 'Brooks', role: 'HR_MANAGER', jobPosition: 'VP of Global Sales', deptCode: 'SALES', wage: 130000 },
  { email: 'sophia.patel@payflux.com', firstName: 'Sophia', lastName: 'Patel', role: 'EMPLOYEE', jobPosition: 'Senior Account Executive', deptCode: 'SALES', wage: 88000 },
  { email: 'julia.roberts@payflux.com', firstName: 'Julia', lastName: 'Roberts', role: 'EMPLOYEE', jobPosition: 'Marketing Director', deptCode: 'SALES', wage: 96000 },
  { email: 'kevin.bacon@payflux.com', firstName: 'Kevin', lastName: 'Bacon', role: 'EMPLOYEE', jobPosition: 'Account Manager', deptCode: 'SALES', wage: 75000 },
  { email: 'laura.croft@payflux.com', firstName: 'Laura', lastName: 'Croft', role: 'EMPLOYEE', jobPosition: 'Content Strategist', deptCode: 'SALES', wage: 68000 },
  { email: 'martin.freeman@payflux.com', firstName: 'Martin', lastName: 'Freeman', role: 'EMPLOYEE', jobPosition: 'SEO Specialist', deptCode: 'SALES', wage: 85000 },
  { email: 'nina.patel@payflux.com', firstName: 'Nina', lastName: 'Patel', role: 'EMPLOYEE', jobPosition: 'Sales Representative', deptCode: 'SALES', wage: 62000 },
  { email: 'oscar.martinez@payflux.com', firstName: 'Oscar', lastName: 'Martinez', role: 'HR_PAYROLL_USER', jobPosition: 'Sales Operations Analyst', deptCode: 'SALES', wage: 78000 },
  { email: 'peter.parker@payflux.com', firstName: 'Peter', lastName: 'Parker', role: 'EMPLOYEE', jobPosition: 'Digital Media Specialist', deptCode: 'SALES', wage: 58000 },
  { email: 'quinn.fabray@payflux.com', firstName: 'Quinn', lastName: 'Fabray', role: 'EMPLOYEE', jobPosition: 'Brand Manager', deptCode: 'SALES', wage: 84000 },
  { email: 'rachel.amber@payflux.com', firstName: 'Rachel', lastName: 'Amber', role: 'EMPLOYEE', jobPosition: 'Event Coordinator', deptCode: 'SALES', wage: 64000 },
  { email: 'sam.winchester@payflux.com', firstName: 'Sam', lastName: 'Winchester', role: 'EMPLOYEE', jobPosition: 'Partner Manager', deptCode: 'SALES', wage: 89000 },
  { email: 'liam.wright@payflux.com', firstName: 'Liam', lastName: 'Wright', role: 'HR_PAYROLL_MANAGER', jobPosition: 'Financial Controller', deptCode: 'FIN', wage: 115000 },
  { email: 'rachel.green@payflux.com', firstName: 'Rachel', lastName: 'Green', role: 'HR_PAYROLL_USER', jobPosition: 'Senior Accountant', deptCode: 'FIN', wage: 82000 },
  { email: 'steven.strange@payflux.com', firstName: 'Steven', lastName: 'Strange', role: 'HR_PAYROLL_USER', jobPosition: 'Financial Analyst', deptCode: 'FIN', wage: 88000 },
  { email: 'tina.fey@payflux.com', firstName: 'Tina', lastName: 'Fey', role: 'HR_PAYROLL_USER', jobPosition: 'Tax Specialist', deptCode: 'FIN', wage: 86000 },
  { email: 'ulysses.grant@payflux.com', firstName: 'Ulysses', lastName: 'Grant', role: 'EMPLOYEE', jobPosition: 'Accounts Payable Clerk', deptCode: 'FIN', wage: 54000 },
  { email: 'victor.von@payflux.com', firstName: 'Victor', lastName: 'Von', role: 'HR_PAYROLL_MANAGER', jobPosition: 'Internal Auditor', deptCode: 'FIN', wage: 94000 },
  { email: 'wanda.maximoff@payflux.com', firstName: 'Wanda', lastName: 'Maximoff', role: 'EMPLOYEE', jobPosition: 'Treasury Analyst', deptCode: 'FIN', wage: 89000 },
  { email: 'xavier.charles@payflux.com', firstName: 'Xavier', lastName: 'Charles', role: 'HR_PAYROLL_MANAGER', jobPosition: 'Risk Officer', deptCode: 'FIN', wage: 108000 },
  { email: 'yara.shahidi@payflux.com', firstName: 'Yara', lastName: 'Shahidi', role: 'EMPLOYEE', jobPosition: 'Billing Specialist', deptCode: 'FIN', wage: 58000 },
  { email: 'zack.snyder@payflux.com', firstName: 'Zack', lastName: 'Snyder', role: 'EMPLOYEE', jobPosition: 'Budget Analyst', deptCode: 'FIN', wage: 76000 },
  { email: 'amy.poehler@payflux.com', firstName: 'Amy', lastName: 'Poehler', role: 'HR_PAYROLL_USER', jobPosition: 'Payroll Auditor', deptCode: 'FIN', wage: 81000 },
  { email: 'ben.wyatt@payflux.com', firstName: 'Ben', lastName: 'Wyatt', role: 'HR_PAYROLL_MANAGER', jobPosition: 'Senior Accountant', deptCode: 'FIN', wage: 97000 },
  { email: 'david.kim@payflux.com', firstName: 'David', lastName: 'Kim', role: 'HR_MANAGER', jobPosition: 'Talent Acquisition Partner', deptCode: 'HR', wage: 85000 },
  { email: 'angela.martin@payflux.com', firstName: 'Angela', lastName: 'Martin', role: 'HR_MANAGER', jobPosition: 'HR Business Partner', deptCode: 'HR', wage: 88000 },
  { email: 'carol.danvers@payflux.com', firstName: 'Carol', lastName: 'Danvers', role: 'EMPLOYEE', jobPosition: 'Technical Recruiter', deptCode: 'HR', wage: 75000 },
  { email: 'daniel.craig@payflux.com', firstName: 'Daniel', lastName: 'Craig', role: 'EMPLOYEE', jobPosition: 'HR Operations Lead', deptCode: 'HR', wage: 78000 },
  { email: 'elena.gilbert@payflux.com', firstName: 'Elena', lastName: 'Gilbert', role: 'EMPLOYEE', jobPosition: 'Benefits Specialist', deptCode: 'HR', wage: 70000 },
  { email: 'frank.castle@payflux.com', firstName: 'Frank', lastName: 'Castle', role: 'EMPLOYEE', jobPosition: 'Safety & Compliance Lead', deptCode: 'HR', wage: 82000 },
  { email: 'grace.hopper@payflux.com', firstName: 'Grace', lastName: 'Hopper', role: 'EMPLOYEE', jobPosition: 'L&D Director', deptCode: 'HR', wage: 92000 },
  { email: 'harry.potter@payflux.com', firstName: 'Harry', lastName: 'Potter', role: 'EMPLOYEE', jobPosition: 'HR Assistant', deptCode: 'HR', wage: 48000 },
  { email: 'iris.west@payflux.com', firstName: 'Iris', lastName: 'West', role: 'EMPLOYEE', jobPosition: 'Employee Experience Manager', deptCode: 'HR', wage: 83000 },
  { email: 'emma.clark@payflux.com', firstName: 'Emma', lastName: 'Clark', role: 'EMPLOYEE', jobPosition: 'IT Operations Specialist', deptCode: 'OPS', wage: 65000 },
  { email: 'jack.sparrow@payflux.com', firstName: 'Jack', lastName: 'Sparrow', role: 'HR_MANAGER', jobPosition: 'VP of Infrastructure', deptCode: 'OPS', wage: 128000 },
  { email: 'karen.filippelli@payflux.com', firstName: 'Karen', lastName: 'Filippelli', role: 'EMPLOYEE', jobPosition: 'System Administrator', deptCode: 'OPS', wage: 82000 },
  { email: 'luke.skywalker@payflux.com', firstName: 'Luke', lastName: 'Skywalker', role: 'EMPLOYEE', jobPosition: 'Cloud Architect', deptCode: 'OPS', wage: 115000 },
  { email: 'mia.thermapolis@payflux.com', firstName: 'Mia', lastName: 'Thermapolis', role: 'EMPLOYEE', jobPosition: 'Operations Manager', deptCode: 'OPS', wage: 95000 },
  { email: 'nathan.drake@payflux.com', firstName: 'Nathan', lastName: 'Drake', role: 'EMPLOYEE', jobPosition: 'IT Support Engineer', deptCode: 'OPS', wage: 62000 },
  { email: 'olivia.pope@payflux.com', firstName: 'Olivia', lastName: 'Pope', role: 'EMPLOYEE', jobPosition: 'Procurement Specialist', deptCode: 'OPS', wage: 78000 },
  { email: 'paul.atreides@payflux.com', firstName: 'Paul', lastName: 'Atreides', role: 'EMPLOYEE', jobPosition: 'Security Analyst', deptCode: 'OPS', wage: 88000 }
];

async function seed() {
  console.log('🌱 Seeding PayFlux database with 60 full records...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  // 1. Working Schedules
  const standardLines = [
    { dayOfWeek: 1, startTime: '09:00', endTime: '18:00', breakMinutes: 60, hours: 8.0 },
    { dayOfWeek: 2, startTime: '09:00', endTime: '18:00', breakMinutes: 60, hours: 8.0 },
    { dayOfWeek: 3, startTime: '09:00', endTime: '18:00', breakMinutes: 60, hours: 8.0 },
    { dayOfWeek: 4, startTime: '09:00', endTime: '18:00', breakMinutes: 60, hours: 8.0 },
    { dayOfWeek: 5, startTime: '09:00', endTime: '18:00', breakMinutes: 60, hours: 8.0 },
  ];

  let standardSchedule = await prisma.workingSchedule.findFirst({ where: { name: '40 Hours / Week' } });
  if (!standardSchedule) {
    standardSchedule = await prisma.workingSchedule.create({
      data: { name: '40 Hours / Week', type: 'STANDARD', totalWeeklyHours: 40.0, lines: { create: standardLines } },
    });
  }

  // 2. Salary Structures
  let regularSalaryStructure = await prisma.salaryStructure.findUnique({ where: { code: 'REGULAR_SALARY' } });
  if (!regularSalaryStructure) {
    regularSalaryStructure = await prisma.salaryStructure.create({
      data: {
        name: 'Regular Salary',
        code: 'REGULAR_SALARY',
        isActive: true,
        rules: {
          create: [
            { name: 'Basic Salary', code: 'BASIC', category: 'BASIC', sequence: 1, computationType: 'FIXED' },
            { name: 'House Rent Allowance', code: 'HRA', category: 'ALLOWANCE', sequence: 2, computationType: 'PERCENTAGE', percentage: 40, percentageBasisCode: 'BASIC' },
            { name: 'Provident Fund', code: 'PF', category: 'DEDUCTION', sequence: 3, computationType: 'PERCENTAGE', percentage: 12, percentageBasisCode: 'BASIC' },
            { name: 'Gross Salary', code: 'GROSS', category: 'GROSS', sequence: 4, computationType: 'FORMULA', formula: 'BASIC + HRA' },
            { name: 'Net Salary', code: 'NET', category: 'NET', sequence: 5, computationType: 'FORMULA', formula: 'GROSS - PF' },
          ],
        },
      },
    });
  }

  // 3. Departments
  const deptMap = {};
  const depts = [
    { name: 'Engineering', code: 'ENG' },
    { name: 'Human Resources', code: 'HR' },
    { name: 'Sales & Marketing', code: 'SALES' },
    { name: 'Payroll & Finance', code: 'FIN' },
    { name: 'Operations & IT', code: 'OPS' },
  ];
  for (const d of depts) {
    const created = await prisma.department.upsert({
      where: { code: d.code },
      update: {},
      create: d,
    });
    deptMap[d.code] = created.id;
  }

  // 4. Time Off Types
  const ptoType = await prisma.timeOffType.upsert({
    where: { code: 'PTO' },
    update: {},
    create: { name: 'Paid Time Off', code: 'PTO', requiresAllocation: true, unit: 'DAYS' },
  });

  const sickType = await prisma.timeOffType.upsert({
    where: { code: 'SICK' },
    update: {},
    create: { name: 'Sick Leave', code: 'SICK', requiresAllocation: true, unit: 'DAYS' },
  });

  // 5 & 6. Seed 60 Users and 60 Employees
  console.log('  -> Creating 60 User and Employee records...');
  const seededEmployees = [];

  for (let i = 0; i < SIXTY_PROFILES.length; i++) {
    const prof = SIXTY_PROFILES[i];
    const num = String(i + 1).padStart(3, '0');

    // Create User Account
    const user = await prisma.user.upsert({
      where: { email: prof.email },
      update: { role: prof.role, passwordHash },
      create: {
        email: prof.email,
        passwordHash,
        name: `${prof.firstName} ${prof.lastName}`,
        role: prof.role,
      },
    });

    // Create Employee Profile linked to User
    const emp = await prisma.employee.upsert({
      where: { email: prof.email },
      update: {
        firstName: prof.firstName,
        lastName: prof.lastName,
        phone: `+1-555-01${num}`,
        jobPosition: prof.jobPosition,
        employeeType: i % 10 === 0 ? 'PART_TIME' : 'FULL_TIME',
        status: i === 56 ? 'ON_LEAVE' : 'ACTIVE',
        departmentId: deptMap[prof.deptCode],
        scheduleId: standardSchedule.id,
        bankName: 'PayFlux Partner Bank',
        bankAccountNumber: `ACC-98765432${num}`,
        bankIfscOrRouting: 'PAYF0001',
        taxId: `TX-PF-${num}`,
        userId: user.id,
      },
      create: {
        email: prof.email,
        userId: user.id,
        firstName: prof.firstName,
        lastName: prof.lastName,
        phone: `+1-555-01${num}`,
        jobPosition: prof.jobPosition,
        employeeType: i % 10 === 0 ? 'PART_TIME' : 'FULL_TIME',
        status: i === 56 ? 'ON_LEAVE' : 'ACTIVE',
        departmentId: deptMap[prof.deptCode],
        scheduleId: standardSchedule.id,
        bankName: 'PayFlux Partner Bank',
        bankAccountNumber: `ACC-98765432${num}`,
        bankIfscOrRouting: 'PAYF0001',
        taxId: `TX-PF-${num}`,
      },
    });

    seededEmployees.push({ ...emp, wage: prof.wage, structureId: regularSalaryStructure.id });

    // Seed Active Contract
    const existingContract = await prisma.contract.findFirst({
      where: { employeeId: emp.id, status: 'RUNNING' },
    });
    if (!existingContract) {
      await prisma.contract.create({
        data: {
          employeeId: emp.id,
          name: `Employment Contract - ${prof.firstName} ${prof.lastName}`,
          wage: prof.wage,
          startDate: new Date('2026-01-01T00:00:00Z'),
          salaryStructureId: regularSalaryStructure.id,
          scheduleId: standardSchedule.id,
          departmentId: deptMap[prof.deptCode],
          jobPosition: prof.jobPosition,
          status: 'RUNNING',
        },
      });
    }

    // Seed PTO Allocations
    const existingPtoAlloc = await prisma.leaveAllocation.findFirst({
      where: { employeeId: emp.id, timeOffTypeId: ptoType.id },
    });
    if (!existingPtoAlloc) {
      await prisma.leaveAllocation.create({
        data: {
          employeeId: emp.id,
          timeOffTypeId: ptoType.id,
          allocatedAmount: 20.0,
          takenAmount: i % 5 === 0 ? 2.0 : 0.0,
          validFrom: new Date('2026-01-01T00:00:00Z'),
          validTo: new Date('2026-12-31T23:59:59Z'),
          status: 'APPROVED',
        },
      });
    }

    // Seed Attendance
    const existingAtt = await prisma.attendance.findFirst({ where: { employeeId: emp.id } });
    if (!existingAtt) {
      await prisma.attendance.create({
        data: {
          employeeId: emp.id,
          checkIn: new Date('2026-09-05T09:00:00Z'),
          checkOut: new Date('2026-09-05T18:00:00Z'),
          workedHours: 8.0,
          status: i % 7 === 0 ? 'LATE' : i % 5 === 0 ? 'OVERTIME' : 'PRESENT',
          isManualEdit: false,
        },
      });
    }
  }

  // 7. Seed August Historical Payrun for all 60 employees
  console.log('  -> Seeding August 2026 Payrun with 60 payslips...');
  let augPayrun = await prisma.payrun.findFirst({ where: { name: 'Payrun - August 2026' } });
  if (!augPayrun) {
    augPayrun = await prisma.payrun.create({
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
        data: { payrunId: augPayrun.id, employeeId: emp.id },
      });

      const basic = emp.wage;
      const hra = basic * 0.4;
      const pf = basic * 0.12;
      const gross = basic + hra;
      const net = gross - pf;

      await prisma.payslip.create({
        data: {
          payrunId: augPayrun.id,
          employeeId: emp.id,
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
              { salaryRuleId: structureRules[0]?.id, name: 'Basic Salary', code: 'BASIC', category: 'BASIC', sequence: 1, amount: basic },
              { salaryRuleId: structureRules[1]?.id, name: 'House Rent Allowance', code: 'HRA', category: 'ALLOWANCE', sequence: 2, amount: hra },
              { salaryRuleId: structureRules[2]?.id, name: 'Provident Fund', code: 'PF', category: 'DEDUCTION', sequence: 3, amount: pf },
              { salaryRuleId: structureRules[3]?.id, name: 'Gross Salary', code: 'GROSS', category: 'GROSS', sequence: 4, amount: gross },
              { salaryRuleId: structureRules[4]?.id, name: 'Net Salary', code: 'NET', category: 'NET', sequence: 5, amount: net },
            ],
          },
        },
      });
    }
  }

  console.log('✅ PayFlux 60-record database seed completed successfully!');
}

seed()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
