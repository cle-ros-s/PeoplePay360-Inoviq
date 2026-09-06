const prisma = require('../src/config/prisma.js');

async function ensureAllEmployeeAlerts() {
  const users = await prisma.user.findMany({
    where: { role: 'EMPLOYEE' },
    include: { employee: true }
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const absenceStartDate = new Date(today);
  absenceStartDate.setDate(absenceStartDate.getDate() - 10);
  const absenceEndDate = new Date(today);
  const lastAttendanceDate = new Date(today);
  lastAttendanceDate.setDate(lastAttendanceDate.getDate() - 11);

  for (const user of users) {
    if (!user.employee) continue;

    await prisma.attendanceAlert.upsert({
      where: {
        employeeId_absenceStartDate_alertType: {
          employeeId: user.employee.id,
          absenceStartDate: absenceStartDate,
          alertType: 'CONSECUTIVE_ABSENCE'
        }
      },
      update: {
        status: 'OPEN',
        consecutiveDaysAbsent: 8,
        leaveStatus: 'NO_REQUEST',
        payrollImpact: 'REQUIRES_HR_REVIEW',
        lastAttendanceDate: lastAttendanceDate
      },
      create: {
        employeeId: user.employee.id,
        departmentId: user.employee.departmentId,
        alertType: 'CONSECUTIVE_ABSENCE',
        status: 'OPEN',
        thresholdDays: 7,
        consecutiveDaysAbsent: 8,
        absenceStartDate: absenceStartDate,
        absenceEndDate: absenceEndDate,
        lastAttendanceDate: lastAttendanceDate,
        totalDaysWorked: 10,
        totalHoursWorked: 80,
        averageHoursPerDay: 8,
        leaveStatus: 'NO_REQUEST',
        payrollImpact: 'REQUIRES_HR_REVIEW'
      }
    });
    console.log(`Alert active for employee user: ${user.email} (${user.employee.firstName} ${user.employee.lastName})`);
  }

  await prisma.$disconnect();
}

ensureAllEmployeeAlerts().catch(console.error);
