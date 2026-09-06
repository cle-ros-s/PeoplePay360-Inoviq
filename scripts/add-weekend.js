const prisma = require('../odoo-backend/src/config/prisma');

async function addWeekendSchedule() {
  const existing = await prisma.workingSchedule.findFirst({
    where: { name: { contains: 'Weekend' } }
  });

  if (!existing) {
    await prisma.workingSchedule.create({
      data: {
        name: 'Weekend Shift (16 Hours / Week)',
        type: 'WEEKEND',
        totalWeeklyHours: 16,
        lines: {
          create: [
            { dayOfWeek: 5, startTime: '09:00', endTime: '18:00', breakMinutes: 60, hours: 8 },
            { dayOfWeek: 6, startTime: '09:00', endTime: '18:00', breakMinutes: 60, hours: 8 },
          ]
        }
      }
    });
    console.log('Created Weekend Shift schedule.');
  }

  const list = await prisma.workingSchedule.findMany({
    include: { _count: { select: { employees: true, lines: true } } },
    orderBy: { totalWeeklyHours: 'desc' }
  });

  console.log(`Total schedules: ${list.length}`);
  for (const s of list) {
    console.log(`- ${s.name} (${s.totalWeeklyHours} hrs/wk): ${s._count.employees} employees, ${s._count.lines} lines [${s.id}]`);
  }
}

addWeekendSchedule()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
