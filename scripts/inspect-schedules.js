const prisma = require('../odoo-backend/src/config/prisma');

async function inspect() {
  const list = await prisma.workingSchedule.findMany({
    include: {
      _count: { select: { employees: true, lines: true } }
    },
    orderBy: { createdAt: 'asc' }
  });
  console.log(`Found ${list.length} schedules:`);
  for (const s of list) {
    console.log(`ID: ${s.id} | Name: "${s.name}" | Hours: ${s.totalWeeklyHours} | Employees: ${s._count.employees} | Lines: ${s._count.lines}`);
  }
}

inspect()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
