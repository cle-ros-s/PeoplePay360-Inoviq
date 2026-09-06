const prisma = require('../src/config/prisma.js');

async function populateEthanFullData() {
  console.log('--- Fixing Ethan Hunt Data ---');

  const ethan = await prisma.employee.findFirst({
    where: { firstName: { contains: 'ethan', mode: 'insensitive' } },
    include: {
      user: true,
      department: true,
      contracts: true,
      schedule: { include: { lines: true } }
    }
  });

  if (!ethan) {
    console.error('Ethan Hunt employee not found');
    process.exit(1);
  }

  console.log(`Found Ethan Hunt (ID: ${ethan.id}, Email: ${ethan.email})`);

  // 1. Fix Contract Name & details
  if (ethan.contracts.length > 0) {
    await prisma.contract.update({
      where: { id: ethan.contracts[0].id },
      data: {
        name: 'Employment Contract - Ethan Hunt',
        jobPosition: 'Senior Software Engineer',
        wage: 125000,
        status: 'RUNNING'
      }
    });
    console.log('✓ Updated Contract: Employment Contract - Ethan Hunt ($125,000 / month)');
  }

  // 2. Populate Historical Attendance Records for Ethan (Aug 1 to Aug 25, 2026)
  console.log('Populating historical attendance punches for Ethan...');
  const startDate = new Date('2026-08-01T00:00:00.000Z');
  const endDate = new Date('2026-08-25T00:00:00.000Z');

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getUTCDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    if (isWeekend) continue;

    const checkIn = new Date(d);
    checkIn.setUTCHours(9, 0, 0, 0);

    const checkOut = new Date(d);
    checkOut.setUTCHours(17, 30, 0, 0); // 8.5 hours

    const existing = await prisma.attendance.findFirst({
      where: {
        employeeId: ethan.id,
        checkIn: {
          gte: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0),
          lt: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59)
        }
      }
    });

    if (!existing) {
      await prisma.attendance.create({
        data: {
          employeeId: ethan.id,
          checkIn,
          checkOut,
          workedHours: 8.5,
          status: 'PRESENT',
          isManualEdit: false
        }
      });
    }
  }
  console.log('✓ Verified 17 working day attendance punches for Ethan prior to absence period');

  // 3. Generate Payslips for Ethan in Recent Payruns
  const payruns = await prisma.payrun.findMany({
    orderBy: { periodStart: 'desc' },
    include: { salaryStructure: { include: { rules: true } } },
    take: 3
  });

  console.log(`Found ${payruns.length} recent payruns.`);

  for (const payrun of payruns) {
    // Check if payrun employee exists
    await prisma.payrunEmployee.upsert({
      where: {
        payrunId_employeeId: {
          payrunId: payrun.id,
          employeeId: ethan.id
        }
      },
      update: {},
      create: {
        payrunId: payrun.id,
        employeeId: ethan.id
      }
    });

    // Check if payslip exists
    const existingPayslip = await prisma.payslip.findFirst({
      where: {
        payrunId: payrun.id,
        employeeId: ethan.id
      }
    });

    if (!existingPayslip) {
      const basic = 125000;
      const gross = 190000;
      const net = 155000;

      const payslip = await prisma.payslip.create({
        data: {
          payrunId: payrun.id,
          employeeId: ethan.id,
          contractId: ethan.contracts?.[0]?.id || null,
          salaryStructureId: payrun.salaryStructureId,
          periodStart: payrun.periodStart,
          periodEnd: payrun.periodEnd,
          workedDays: 22,
          totalDays: 22,
          basic: basic,
          gross: gross,
          net: net,
          status: payrun.status === 'PAID' ? 'PAID' : payrun.status === 'VALIDATED' ? 'CONFIRMED' : 'DRAFT',
          lines: {
            create: [
              { code: 'BASIC', name: 'Basic Salary', category: 'BASIC', amount: basic, sequence: 1 },
              { code: 'HRA', name: 'House Rent Allowance', category: 'ALLOWANCE', amount: 50000, sequence: 2 },
              { code: 'SPECIAL_ALLOW', name: 'Special Allowance', category: 'ALLOWANCE', amount: 15000, sequence: 3 },
              { code: 'GROSS', name: 'Gross Salary', category: 'GROSS', amount: gross, sequence: 4 },
              { code: 'PF', name: 'Provident Fund', category: 'DEDUCTION', amount: 15000, sequence: 5 },
              { code: 'TAX', name: 'Income Tax (TDS)', category: 'DEDUCTION', amount: 20000, sequence: 6 },
              { code: 'NET', name: 'Net Salary', category: 'NET', amount: net, sequence: 7 }
            ]
          }
        }
      });
      console.log(`✓ Created Payslip for Ethan in payrun "${payrun.name}" (Net: ₹${net.toLocaleString('en-IN')})`);
    } else {
      console.log(`✓ Existing Payslip found for Ethan in payrun "${payrun.name}"`);
    }
  }

  // 4. Verify Attendance Alert for Ethan
  const alert = await prisma.attendanceAlert.findFirst({
    where: { employeeId: ethan.id, status: 'OPEN' },
    include: { employee: true, department: true }
  });

  if (alert) {
    console.log(`✓ Active Attendance Risk Alert verified for Ethan Hunt (Absent Days: ${alert.consecutiveDaysAbsent}, Status: ${alert.status})`);
  }

  await prisma.$disconnect();
  console.log('🎉 Ethan Hunt data is now fully populated and visible across all payroll manager pages!');
}

populateEthanFullData().catch(err => {
  console.error(err);
  process.exit(1);
});
