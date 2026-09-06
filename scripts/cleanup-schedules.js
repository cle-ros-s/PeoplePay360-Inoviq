const prisma = require('../odoo-backend/src/config/prisma');

async function cleanupSchedules() {
  console.log('Starting schedules cleanup...');

  // 1. Get all schedules
  const allSchedules = await prisma.workingSchedule.findMany({
    include: {
      employees: { select: { id: true, firstName: true, lastName: true } },
      lines: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Current total schedules: ${allSchedules.length}`);

  // Find or select the primary 40h schedule
  const standard40 = allSchedules.find(s => s.id === 'c1482a4d-77cb-4a6e-8792-a67d2751464f') 
    || allSchedules.find(s => s.totalWeeklyHours === 40);

  if (!standard40) {
    console.error('Standard 40h schedule not found!');
    return;
  }

  // Update standard 40h schedule name to be professional
  await prisma.workingSchedule.update({
    where: { id: standard40.id },
    data: { name: 'Standard Full-Time (40 Hours / Week)', totalWeeklyHours: 40 }
  });

  // Find one 36h schedule to keep
  const keep36 = allSchedules.find(s => s.totalWeeklyHours === 36 && s.id !== standard40.id);
  if (keep36) {
    await prisma.workingSchedule.update({
      where: { id: keep36.id },
      data: { name: 'Flexible Shift (36 Hours / Week)', totalWeeklyHours: 36 }
    });
  }

  // Find or create 20h schedule
  let keep20 = allSchedules.find(s => s.name.includes('Part-Time') || s.totalWeeklyHours === 20 || s.totalWeeklyHours === 19);
  if (keep20) {
    await prisma.workingSchedule.update({
      where: { id: keep20.id },
      data: { name: 'Part-Time Morning (20 Hours / Week)', totalWeeklyHours: 20 }
    });
  }

  const keptIds = new Set([standard40.id, keep36?.id, keep20?.id].filter(Boolean));
  console.log('Kept schedule IDs:', Array.from(keptIds));

  // 2. Reassign any employees currently assigned to duplicate schedules that will be removed
  const duplicatesToRemove = allSchedules.filter(s => !keptIds.has(s.id));
  console.log(`Duplicates to remove: ${duplicatesToRemove.length}`);

  for (const dup of duplicatesToRemove) {
    if (dup.employees && dup.employees.length > 0) {
      console.log(`Reassigning ${dup.employees.length} employees from duplicate ${dup.id} (${dup.name}) to ${keep36 ? keep36.id : standard40.id}`);
      const targetScheduleId = dup.totalWeeklyHours === 36 && keep36 ? keep36.id : standard40.id;
      for (const emp of dup.employees) {
        await prisma.employee.update({
          where: { id: emp.id },
          data: { scheduleId: targetScheduleId },
        });
      }
    }
  }

  // Also check if any contracts reference the schedules to remove
  for (const dup of duplicatesToRemove) {
    const contractsCount = await prisma.contract.count({ where: { scheduleId: dup.id } });
    if (contractsCount > 0) {
      console.log(`Reassigning ${contractsCount} contracts from ${dup.id} to ${standard40.id}`);
      await prisma.contract.updateMany({
        where: { scheduleId: dup.id },
        data: { scheduleId: standard40.id },
      });
    }
  }

  // 3. Delete lines and schedules of the duplicates
  for (const dup of duplicatesToRemove) {
    await prisma.workingScheduleLine.deleteMany({ where: { scheduleId: dup.id } });
    await prisma.workingSchedule.delete({ where: { id: dup.id } });
  }

  // 4. If we don't have a weekend/reduced shift schedule, create one
  const existingWeekend = await prisma.workingSchedule.findFirst({
    where: { name: { contains: 'Weekend' } }
  });
  if (!existingWeekend) {
    await prisma.workingSchedule.create({
      data: {
        name: 'Weekend Shift (16 Hours / Week)',
        type: 'WEEKEND',
        totalWeeklyHours: 16,
        lines: {
          create: [
            { dayOfWeek: 5, workFrom: '09:00', workTo: '17:00', dayPeriod: 'ALL_DAY' },
            { dayOfWeek: 6, workFrom: '09:00', workTo: '17:00', dayPeriod: 'ALL_DAY' },
          ]
        }
      }
    });
  }

  // 5. Query and display remaining schedules
  const remaining = await prisma.workingSchedule.findMany({
    include: {
      _count: { select: { employees: true, lines: true } }
    },
    orderBy: { totalWeeklyHours: 'desc' }
  });

  console.log(`Cleanup complete! Remaining schedules (${remaining.length}):`);
  for (const s of remaining) {
    console.log(`- ${s.name} (${s.totalWeeklyHours} hrs/wk): ${s._count.employees} employees, ${s._count.lines} lines [ID: ${s.id}]`);
  }
}

cleanupSchedules()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
