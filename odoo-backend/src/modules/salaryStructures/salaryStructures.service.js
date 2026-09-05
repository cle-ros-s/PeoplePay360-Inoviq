const prisma = require('../../config/prisma');
const { getPaginationParams } = require('../../utils/pagination');
const { formatListResponse, AppError } = require('../../utils/responseFormatter');

async function listSalaryStructures(query) {
  const { page, pageSize, skip, take } = getPaginationParams(query);
  const { search, isActive } = query;

  const where = {};
  if (isActive !== undefined) {
    where.isActive = isActive === 'true' || isActive === true;
  }
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [structures, total] = await Promise.all([
    prisma.salaryStructure.findMany({
      where,
      skip,
      take,
      orderBy: { name: 'asc' },
      include: {
        rules: { orderBy: { sequence: 'asc' } },
        _count: { select: { contracts: true, payruns: true } },
      },
    }),
    prisma.salaryStructure.count({ where }),
  ]);

  const formatted = structures.map((s) => ({
    id: s.id,
    name: s.name,
    code: s.code,
    isActive: s.isActive,
    rules: s.rules,
    ruleCount: s.rules.length,
    contractCount: s._count.contracts,
    payrunCount: s._count.payruns,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  }));

  return formatListResponse(formatted, total, page, pageSize);
}

async function getSalaryStructureById(id) {
  const structure = await prisma.salaryStructure.findUnique({
    where: { id },
    include: {
      rules: { orderBy: { sequence: 'asc' } },
      _count: { select: { contracts: true, payruns: true } },
    },
  });

  if (!structure) {
    throw new AppError('SALARY_STRUCTURE_NOT_FOUND', 'Salary structure not found', 404);
  }

  return {
    ...structure,
    ruleCount: structure.rules.length,
    contractCount: structure._count.contracts,
    payrunCount: structure._count.payruns,
  };
}

async function createSalaryStructure(data) {
  const code = (data.code || data.name.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 30)).toUpperCase();

  const existing = await prisma.salaryStructure.findFirst({
    where: {
      OR: [
        { name: { equals: data.name, mode: 'insensitive' } },
        { code: { equals: code, mode: 'insensitive' } },
      ],
    },
  });

  if (existing) {
    throw new AppError('DUPLICATE_SALARY_STRUCTURE', 'Salary structure name or code already exists', 409);
  }

  return prisma.salaryStructure.create({
    data: {
      name: data.name,
      code,
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
    include: {
      rules: { orderBy: { sequence: 'asc' } },
    },
  });
}

async function updateSalaryStructure(id, data) {
  const structure = await prisma.salaryStructure.findUnique({ where: { id } });
  if (!structure) {
    throw new AppError('SALARY_STRUCTURE_NOT_FOUND', 'Salary structure not found', 404);
  }

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.code !== undefined) updateData.code = data.code.toUpperCase();
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  return prisma.salaryStructure.update({
    where: { id },
    data: updateData,
    include: {
      rules: { orderBy: { sequence: 'asc' } },
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

async function reorderRules(id, payload) {
  const structure = await prisma.salaryStructure.findUnique({
    where: { id },
    include: { rules: true },
  });

  if (!structure) {
    throw new AppError('SALARY_STRUCTURE_NOT_FOUND', 'Salary structure not found', 404);
  }

  let items = [];
  if (Array.isArray(payload)) {
    items = typeof payload[0] === 'string' ? payload.map((ruleId, idx) => ({ ruleId, sequence: idx + 1 })) : payload;
  } else if (payload && Array.isArray(payload.ruleOrders)) {
    items = payload.ruleOrders;
  } else if (payload && Array.isArray(payload.ruleIds)) {
    items = payload.ruleIds.map((ruleId, idx) => ({ ruleId, sequence: idx + 1 }));
  }

  return executeTx(async (tx) => {
    for (const item of items) {
      if (item.ruleId) {
        await tx.salaryRule.update({
          where: { id: item.ruleId },
          data: { sequence: item.sequence },
        });
      }
    }

    return tx.salaryStructure.findUnique({
      where: { id },
      include: {
        rules: { orderBy: { sequence: 'asc' } },
      },
    });
  });
}

async function deleteSalaryStructure(id) {
  const structure = await prisma.salaryStructure.findUnique({
    where: { id },
    include: { _count: { select: { contracts: true, payruns: true } } },
  });

  if (!structure) {
    throw new AppError('SALARY_STRUCTURE_NOT_FOUND', 'Salary structure not found', 404);
  }

  if (structure._count.contracts > 0 || structure._count.payruns > 0) {
    throw new AppError(
      'SALARY_STRUCTURE_IN_USE',
      'Cannot delete salary structure linked to active contracts or payruns',
      400
    );
  }

  await prisma.salaryStructure.delete({ where: { id } });
  return { message: 'Salary structure deleted successfully' };
}

module.exports = {
  listSalaryStructures,
  getSalaryStructureById,
  createSalaryStructure,
  updateSalaryStructure,
  reorderRules,
  deleteSalaryStructure,
};
