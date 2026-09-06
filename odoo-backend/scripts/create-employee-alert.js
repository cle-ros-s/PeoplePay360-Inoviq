const prisma = require('../src/config/prisma.js');

async function createUnknownLeaveAlert() {
  console.log('--- Finding Employee ---');
  // Find employee linked to an EMPLOYEE user, or active employee
  let employee = await prisma.employee.findFirst({
    where: {
      user: {
        role: 'EMPLOYEE'
      },
      status: 'ACTIVE'
    },
    include: {
      user: true,
      department: true,
      contracts: { where: { status: 'RUNNING' }, take: 1 }
    }
  });

  if (!employee) {
    employee = await prisma.employee.findFirst({
      where: { status: 'ACTIVE' },
      include: {
        user: true,
        department: true,
        contracts: { where: { status: 'RUNNING' }, take: 1 }
      }
    });
  }

  if (!employee) {
    console.error('No active employee found.');
    process.exit(1);
  }

  console.log(`Found Employee: ${employee.firstName} ${employee.lastName} (ID: ${employee.id}, User Email: ${employee.user?.email || employee.email})`);

  // Compute absence period
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const absenceStartDate = new Date(today);
  absenceStartDate.setDate(absenceStartDate.getDate() - 10);

  const absenceEndDate = new Date(today);

  const lastAttendanceDate = new Date(today);
  lastAttendanceDate.setDate(lastAttendanceDate.getDate() - 11);
  lastAttendanceDate.setHours(17, 30, 0, 0);

  // Pre-absence 14-day history breakdown
  const history = [];
  let totalHours = 0;
  let totalDaysWorked = 0;
  for (let i = 14; i >= 1; i--) {
    const d = new Date(absenceStartDate);
    d.setDate(d.getDate() - i);
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const hours = isWeekend ? 0 : 8;
    if (hours > 0) totalDaysWorked++;
    totalHours += hours;

    history.push({
      date: d.toISOString().split('T')[0],
      dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
      isScheduledWorkDay: !isWeekend,
      checkIn: isWeekend ? null : '09:00:00',
      checkOut: isWeekend ? null : '17:00:00',
      workedHours: hours,
      status: isWeekend ? 'OFF_DAY' : 'PRESENT'
    });
  }

  // Find or create alert
  const existingAlert = await prisma.attendanceAlert.findFirst({
    where: {
      employeeId: employee.id,
      status: { in: ['OPEN', 'ACKNOWLEDGED', 'UNDER_REVIEW'] }
    }
  });

  let alert;
  if (existingAlert) {
    console.log(`Updating existing active alert for employee (Alert ID: ${existingAlert.id})...`);
    alert = await prisma.attendanceAlert.update({
      where: { id: existingAlert.id },
      data: {
        alertType: 'CONSECUTIVE_ABSENCE',
        status: 'OPEN',
        thresholdDays: 7,
        consecutiveDaysAbsent: 8,
        absenceStartDate: absenceStartDate,
        absenceEndDate: absenceEndDate,
        lastAttendanceDate: lastAttendanceDate,
        totalDaysWorked: totalDaysWorked,
        totalHoursWorked: totalHours,
        averageHoursPerDay: Number((totalHours / (totalDaysWorked || 1)).toFixed(2)),
        leaveStatus: 'NO_REQUEST',
        payrollImpact: 'REQUIRES_HR_REVIEW',
        historySummary: history,
        resolutionNote: null,
        resolvedAt: null,
        resolvedByUserId: null
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            jobPosition: true,
            department: { select: { name: true } }
          }
        }
      }
    });
  } else {
    console.log('Creating new Attendance Risk Alert for unknown leave...');
    alert = await prisma.attendanceAlert.create({
      data: {
        employeeId: employee.id,
        departmentId: employee.departmentId,
        contractId: employee.contracts?.[0]?.id || null,
        alertType: 'CONSECUTIVE_ABSENCE',
        status: 'OPEN',
        thresholdDays: 7,
        consecutiveDaysAbsent: 8,
        absenceStartDate: absenceStartDate,
        absenceEndDate: absenceEndDate,
        lastAttendanceDate: lastAttendanceDate,
        totalDaysWorked: totalDaysWorked,
        totalHoursWorked: totalHours,
        averageHoursPerDay: Number((totalHours / (totalDaysWorked || 1)).toFixed(2)),
        leaveStatus: 'NO_REQUEST',
        payrollImpact: 'REQUIRES_HR_REVIEW',
        historySummary: history
      },
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            jobPosition: true,
            department: { select: { name: true } }
          }
        }
      }
    });
  }

  console.log('🎉 Successfully created/updated unknown leave alert:');
  console.log(JSON.stringify({
    id: alert.id,
    employee: `${alert.employee.firstName} ${alert.employee.lastName}`,
    email: alert.employee.email,
    jobPosition: alert.employee.jobPosition,
    department: alert.employee.department?.name,
    consecutiveDaysAbsent: alert.consecutiveDaysAbsent,
    status: alert.status,
    leaveStatus: alert.leaveStatus,
    payrollImpact: alert.payrollImpact,
    lastAttendanceDate: alert.lastAttendanceDate,
    historySummaryEntries: alert.historySummary?.length
  }, null, 2));

  await prisma.$disconnect();
}

createUnknownLeaveAlert().catch(err => {
  console.error('Error creating alert:', err);
  process.exit(1);
});
