const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient({
  log: ['error', 'warn']
});

const ROSTER = [
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
  { email: 'paul.atreides@payflux.com', firstName: 'Paul', lastName: 'Atreides', role: 'EMPLOYEE', jobPosition: 'Security Analyst', deptCode: 'OPS', wage: 88000 },
  { email: 'david.kumar@payflux.com', firstName: 'David', lastName: 'Kumar', role: 'EMPLOYEE', jobPosition: 'Cloud Security Specialist', deptCode: 'ENG', wage: 102000 },
  { email: 'deepan.kumar@payflux.com', firstName: 'Deepan', lastName: 'Kumar', role: 'EMPLOYEE', jobPosition: 'AI/ML Engineer', deptCode: 'ENG', wage: 108000 },
  { email: 'helen.rogers@payflux.com', firstName: 'Helen', lastName: 'Rogers', role: 'HR_MANAGER', jobPosition: 'Senior Talent Lead', deptCode: 'HR', wage: 92000 },
  { email: 'liam.wilson@payflux.com', firstName: 'Liam', lastName: 'Wilson', role: 'EMPLOYEE', jobPosition: 'Customer Success Manager', deptCode: 'SALES', wage: 76000 },
  { email: 'olivia.taylor@payflux.com', firstName: 'Olivia', lastName: 'Taylor', role: 'EMPLOYEE', jobPosition: 'Enterprise Sales Lead', deptCode: 'SALES', wage: 98000 },
  { email: 'priya.sharma@payflux.com', firstName: 'Priya', lastName: 'Sharma', role: 'EMPLOYEE', jobPosition: 'Regional Sales Lead', deptCode: 'SALES', wage: 86000 },
  { email: 'arthur.dent@payflux.com', firstName: 'Arthur', lastName: 'Dent', role: 'EMPLOYEE', jobPosition: 'Logistics Coordinator', deptCode: 'OPS', wage: 66000 },
  { email: 'clara.oswald@payflux.com', firstName: 'Clara', lastName: 'Oswald', role: 'EMPLOYEE', jobPosition: 'People Operations Associate', deptCode: 'HR', wage: 64000 },
  { email: 'rory.williams@payflux.com', firstName: 'Rory', lastName: 'Williams', role: 'EMPLOYEE', jobPosition: 'Staff Accountant', deptCode: 'FIN', wage: 72000 },
  { email: 'donna.noble@payflux.com', firstName: 'Donna', lastName: 'Noble', role: 'EMPLOYEE', jobPosition: 'Inside Sales Executive', deptCode: 'SALES', wage: 70000 },
];

async function syncUniqueRoster() {
  console.log('🔄 Starting full database roster synchronization...');

  // 1. Get or create departments map
  const depts = await prisma.department.findMany();
  const deptMap = {};
  for (const d of depts) {
    deptMap[d.code] = d.id;
  }

  const deptDefs = [
    { code: 'OPS', name: 'Operations' },
    { code: 'HR', name: 'Human Resources' },
    { code: 'FIN', name: 'Finance & Payroll' },
    { code: 'ENG', name: 'Engineering' },
    { code: 'SALES', name: 'Sales & Marketing' }
  ];

  for (const dd of deptDefs) {
    if (!deptMap[dd.code]) {
      const created = await prisma.department.create({
        data: { code: dd.code, name: dd.name }
      });
      deptMap[dd.code] = created.id;
    }
  }

  const defaultSchedule = await prisma.workingSchedule.findFirst();
  const passwordHash = await bcrypt.hash('Password123!', 10);

  // Fetch all existing employees
  const existingEmployees = await prisma.employee.findMany({
    orderBy: { createdAt: 'asc' }
  });

  console.log(`Processing ${existingEmployees.length} employees with ${ROSTER.length} unique profiles...`);

  // Parallel batch processing with concurrency limit of 5 to avoid overwhelming connection pool
  const BATCH_SIZE = 5;
  for (let b = 0; b < existingEmployees.length; b += BATCH_SIZE) {
    const chunk = existingEmployees.slice(b, b + BATCH_SIZE);
    await Promise.all(
      chunk.map(async (emp, idx) => {
        const i = b + idx;
        const profile = ROSTER[i % ROSTER.length];
        const deptId = deptMap[profile.deptCode] || Object.values(deptMap)[0];
        const fullName = `${profile.firstName} ${profile.lastName}`;

        // Upsert User by email
        const user = await prisma.user.upsert({
          where: { email: profile.email },
          update: {
            name: fullName,
            role: profile.role,
            passwordHash: passwordHash
          },
          create: {
            name: fullName,
            email: profile.email,
            role: profile.role,
            passwordHash: passwordHash
          }
        });

        // Update Employee
        await prisma.employee.update({
          where: { id: emp.id },
          data: {
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
            jobPosition: profile.jobPosition,
            departmentId: deptId,
            userId: user.id,
            scheduleId: defaultSchedule ? defaultSchedule.id : undefined
          }
        });

        // Update Contract if exists
        const contract = await prisma.contract.findFirst({
          where: { employeeId: emp.id }
        });
        if (contract) {
          await prisma.contract.update({
            where: { id: contract.id },
            data: {
              wage: profile.wage,
              departmentId: deptId,
              jobPosition: profile.jobPosition,
              status: 'RUNNING'
            }
          });
        }
      })
    );
    console.log(`  Updated employees ${b + 1} to ${Math.min(b + BATCH_SIZE, existingEmployees.length)} / ${existingEmployees.length}`);
  }

  // Verification: Check for any duplicates in Employee names or emails
  const allEmployees = await prisma.employee.findMany({
    select: { id: true, firstName: true, lastName: true, email: true, jobPosition: true, user: { select: { role: true, email: true } } }
  });

  const nameCounts = {};
  const emailCounts = {};
  let duplicatesFound = false;

  for (const emp of allEmployees) {
    const fullName = `${emp.firstName} ${emp.lastName}`;
    nameCounts[fullName] = (nameCounts[fullName] || 0) + 1;
    emailCounts[emp.email] = (emailCounts[emp.email] || 0) + 1;
    if (nameCounts[fullName] > 1) {
      console.error(`❌ Duplicate name detected: "${fullName}" (count: ${nameCounts[fullName]})`);
      duplicatesFound = true;
    }
    if (emailCounts[emp.email] > 1) {
      console.error(`❌ Duplicate email detected: "${emp.email}" (count: ${emailCounts[emp.email]})`);
      duplicatesFound = true;
    }
  }

  if (!duplicatesFound) {
    console.log(`✅ SUCCESS: All ${allEmployees.length} employees have 100% UNIQUE names and emails!`);
  } else {
    console.warn(`⚠️ Warning: Duplicate names or emails found. Please review.`);
  }

  // Summary of Roles
  const roleCounts = {};
  for (const emp of allEmployees) {
    const r = emp.user?.role || 'NO_USER';
    roleCounts[r] = (roleCounts[r] || 0) + 1;
  }
  console.log('📊 Role Distribution:', roleCounts);
}

syncUniqueRoster()
  .catch((err) => {
    console.error('Error running syncUniqueRoster:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
