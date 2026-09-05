const prisma = require('../../config/prisma');
const { processScheduleLines } = require('./schedules.hours');
const { getPaginationParams } = require('../../utils/pagination');
const { formatListResponse, AppError } = require('../../utils/responseFormatter');

async function listSchedules(query) {
  const { page, pageSize, skip, take } = getPaginationParams(query);
  const { search } = query;

  const where = {};
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  const [schedules, total] = await Promise.all([
    prisma.workingSchedule.findMany({
      where,
      skip,
      take,
      orderBy: { name: 'asc' },
      include: {
        lines: { orderBy: { dayOfWeek: 'asc' } },
        _count: { select: { employees: true, contracts: true } },
      },
    }),
    prisma.workingSchedule.count({ where }),
  ]);

  const formatted = schedules.map((s) => ({
    id: s.id,
    name: s.name,
    type: s.type,
    totalWeeklyHours: s.totalWeeklyHours,
    lines: s.lines,
    employeeCount: s._count.employees,
    contractCount: s._count.contracts,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }));

  return formatListResponse(formatted, total, page, pageSize);
}

async function getScheduleById(id) {
  const schedule = await prisma.workingSchedule.findUnique({
    where: { id },
    include: {
      lines: { orderBy: { dayOfWeek: 'asc' } },
      employees: {
        select: { id: true, firstName: true, lastName: true, email: true, jobPosition: true },
      },
      _count: { select: { employees: true, contracts: true } },
    },
  });

  if (!schedule) {
    throw new AppError('SCHEDULE_NOT_FOUND', 'Working schedule not found', 404);
  }

  return {
    ...schedule,
    employeeCount: schedule._count.employees,
    contractCount: schedule._count.contracts,
  };
}

async function createSchedule(data) {
  const { processedLines, totalWeeklyHours } = processScheduleLines(data.lines);

  return prisma.workingSchedule.create({
    data: {
      name: data.name,
      type: data.type || 'STANDARD',
      totalWeeklyHours,
      lines: {
        create: processedLines,
      },
    },
    include: {
      lines: { orderBy: { dayOfWeek: 'asc' } },
    },
  });
}

async function executeTx(fn) {
  try {
    return await prisma.$transaction(fn, { maxWait: 10000, timeout: 20000 });
  } catch (err) {
    if (err.code === 'P2028' || err.message?.includes('Transaction')) {
      return await prisma.$transaction(fn, { maxWait: 10000, timeout: 20000 });
    }
    throw err;
  }
}

async function updateSchedule(id, data) {
  const schedule = await prisma.workingSchedule.findUnique({ where: { id } });
  if (!schedule) {
    throw new AppError('SCHEDULE_NOT_FOUND', 'Working schedule not found', 404);
  }

  if (data.lines) {
    const { processedLines, totalWeeklyHours } = processScheduleLines(data.lines);

    return executeTx(async (tx) => {
      await tx.workingScheduleLine.deleteMany({ where: { scheduleId: id } });

      return tx.workingSchedule.update({
        where: { id },
        data: {
          name: data.name !== undefined ? data.name : schedule.name,
          type: data.type !== undefined ? data.type : schedule.type,
          totalWeeklyHours,
          lines: {
            create: processedLines,
          },
        },
        include: {
          lines: { orderBy: { dayOfWeek: 'asc' } },
        },
      });
    });
  }

  return prisma.workingSchedule.update({
    where: { id },
    data: {
      name: data.name,
      type: data.type,
    },
    include: {
      lines: { orderBy: { dayOfWeek: 'asc' } },
    },
  });
}

async function deleteSchedule(id) {
  const schedule = await prisma.workingSchedule.findUnique({
    where: { id },
    include: { _count: { select: { employees: true, contracts: true } } },
  });

  if (!schedule) {
    throw new AppError('SCHEDULE_NOT_FOUND', 'Working schedule not found', 404);
  }

  if (schedule._count.employees > 0 || schedule._count.contracts > 0) {
    throw new AppError(
      'SCHEDULE_IN_USE',
      'Cannot delete working schedule currently assigned to employees or contracts',
      400
    );
  }

  await prisma.workingSchedule.delete({ where: { id } });
  return { message: 'Schedule deleted successfully' };
}

module.exports = {
  listSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
};
