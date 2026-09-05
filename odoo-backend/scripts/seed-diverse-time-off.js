const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const SAMPLE_LEAVE_REASONS = [
  'Annual family vacation & recharge',
  'Medical specialist consultation & follow-up care',
  'Attending National Software Architecture Conference 2026',
  'Apartment relocation & residential setup',
  'Childcare responsibilities & family commitment',
  'Dental procedure and post-treatment recovery',
  'Attending sibling wedding ceremony out of state',
  'Emergency residential electrical & plumbing repair',
  'Mental health & wellness wellness day',
  'Attending Global Tech Leadership Summit',
  'Seasonal flu recovery & rest at home',
  'Parent-teacher quarterly academic conference',
  'DMV vehicle registration and legal documentation',
  'Volunteering for community outreach initiative',
  'Attending university alumni networking seminar',
  'Personal family bereavement leave',
  'Quarterly strategic planning offsite travel',
  'Physical therapy & orthopedic rehabilitation',
  'Family milestone anniversary gathering',
  'Attending AI & Cloud Architecture Masterclass',
  'Attending DevOps & Security Summit 2026',
  'Attending AWS Cloud Practitioner Workshop',
  'Attending FinTech & Payroll Innovation Forum',
  'Attending HR Talent & Culture World Congress',
  'Attending Global Enterprise Sales Summit'
];

async function seedDiverseTimeOff() {
  console.log('🌴 Fast seeding diverse Time Off Requests across different employees, roles, and reasons...');

  // 1. Ensure common TimeOffTypes exist
  const typesData = [
    { name: 'Paid Time Off', code: 'PTO', unit: 'DAYS', requiresAllocation: true },
    { name: 'Sick Leave', code: 'SICK', unit: 'DAYS', requiresAllocation: true },
    { name: 'Unpaid Leave', code: 'UNPAID', unit: 'DAYS', requiresAllocation: false },
    { name: 'Compensatory Off', code: 'COMP', unit: 'DAYS', requiresAllocation: true },
    { name: 'Remote Work / WFH', code: 'WFH', unit: 'DAYS', requiresAllocation: false }
  ];

  const timeOffTypes = [];
  for (const t of typesData) {
    let tot = await prisma.timeOffType.findUnique({ where: { code: t.code } });
    if (!tot) {
      tot = await prisma.timeOffType.create({ data: t });
    }
    timeOffTypes.push(tot);
  }

  // 2. Fetch all employees
  const employees = await prisma.employee.findMany({
    include: { user: true },
    orderBy: { createdAt: 'asc' }
  });

  console.log(`Loaded ${employees.length} employees from DB.`);

  // 3. Clear existing time off requests
  await prisma.timeOffRequest.deleteMany({});

  // 4. Fetch all allocations in one query
  const existingAllocations = await prisma.leaveAllocation.findMany();
  const allocMap = new Set(existingAllocations.map(a => `${a.employeeId}_${a.timeOffTypeId}`));

  const ptoType = timeOffTypes.find((t) => t.code === 'PTO') || timeOffTypes[0];
  const sickType = timeOffTypes.find((t) => t.code === 'SICK') || timeOffTypes[0];
  const compType = timeOffTypes.find((t) => t.code === 'COMP') || timeOffTypes[0];

  // Create missing allocations in bulk
  const newAllocations = [];
  for (const emp of employees) {
    if (!allocMap.has(`${emp.id}_${ptoType.id}`)) {
      newAllocations.push({
        employeeId: emp.id,
        timeOffTypeId: ptoType.id,
        allocatedAmount: 25.0,
        takenAmount: 0.0,
        validFrom: new Date('2026-01-01T00:00:00Z'),
        validTo: new Date('2026-12-31T23:59:59Z'),
        status: 'APPROVED'
      });
    }
    if (!allocMap.has(`${emp.id}_${sickType.id}`)) {
      newAllocations.push({
        employeeId: emp.id,
        timeOffTypeId: sickType.id,
        allocatedAmount: 12.0,
        takenAmount: 0.0,
        validFrom: new Date('2026-01-01T00:00:00Z'),
        validTo: new Date('2026-12-31T23:59:59Z'),
        status: 'APPROVED'
      });
    }
    if (!allocMap.has(`${emp.id}_${compType.id}`)) {
      newAllocations.push({
        employeeId: emp.id,
        timeOffTypeId: compType.id,
        allocatedAmount: 10.0,
        takenAmount: 0.0,
        validFrom: new Date('2026-01-01T00:00:00Z'),
        validTo: new Date('2026-12-31T23:59:59Z'),
        status: 'APPROVED'
      });
    }
  }

  if (newAllocations.length > 0) {
    await prisma.leaveAllocation.createMany({ data: newAllocations });
    console.log(`Created ${newAllocations.length} missing leave allocations.`);
  }

  // Reload allocations
  const allAllocations = await prisma.leaveAllocation.findMany({
    where: { status: 'APPROVED' }
  });
  const empAllocMap = {};
  for (const a of allAllocations) {
    empAllocMap[`${a.employeeId}_${a.timeOffTypeId}`] = a.id;
  }

  // 5. Generate 25 diverse Time Off Requests across 25 distinct employees
  const sampleEmployees = employees.slice(0, 25);
  const statuses = ['PENDING', 'APPROVED', 'APPROVED', 'APPROVED', 'REFUSED', 'PENDING'];
  const durations = [1.0, 2.0, 3.0, 4.0, 5.0, 1.0, 2.5];

  const requestsToCreate = [];
  for (let i = 0; i < sampleEmployees.length; i++) {
    const emp = sampleEmployees[i];
    const tot = timeOffTypes[i % timeOffTypes.length];
    const status = statuses[i % statuses.length];
    const duration = durations[i % durations.length];
    const reason = SAMPLE_LEAVE_REASONS[i % SAMPLE_LEAVE_REASONS.length];

    const startDay = 1 + ((i * 3) % 25);
    const startMonth = 8; // September
    const startDate = new Date(Date.UTC(2026, startMonth, startDay, 9, 0, 0));
    const endDate = new Date(Date.UTC(2026, startMonth, startDay + Math.ceil(duration) - 1, 18, 0, 0));

    const allocId = tot.requiresAllocation ? empAllocMap[`${emp.id}_${tot.id}`] : undefined;

    requestsToCreate.push({
      employeeId: emp.id,
      timeOffTypeId: tot.id,
      allocationId: allocId,
      startDate,
      endDate,
      duration,
      reason,
      status,
      refusalReason: status === 'REFUSED' ? 'High team workload during sprint freeze' : undefined
    });
  }

  await prisma.timeOffRequest.createMany({ data: requestsToCreate });
  console.log(` Created ${requestsToCreate.length} diverse Time Off Requests in bulk!`);

  // Verify
  const created = await prisma.timeOffRequest.findMany({
    include: { employee: { include: { user: true } }, timeOffType: true },
    orderBy: { createdAt: 'desc' }
  });

  console.log('\n--- Sample Live Time Off Requests ---');
  created.slice(0, 10).forEach((r) => {
    console.log(`[${r.employee.user?.role || 'EMPLOYEE'}] ${r.employee.firstName} ${r.employee.lastName} (${r.employee.jobPosition}) -> ${r.timeOffType.name} (${r.duration}d) | "${r.reason}" | Status: ${r.status}`);
  });
}

seedDiverseTimeOff()
  .catch((e) => {
    console.error('Error in seedDiverseTimeOff:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
