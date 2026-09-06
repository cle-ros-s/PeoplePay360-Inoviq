const prisma = require('../../config/prisma');
const { getPaginationParams } = require('../../utils/pagination');
const { formatListResponse, AppError } = require('../../utils/responseFormatter');
const { globalCache } = require('../../utils/cache');
const { invalidateDashboardCache } = require('../dashboard/dashboard.service');

function invalidateSalaryRuleCache() {
  globalCache.invalidatePrefix('salaryrules:');
  globalCache.invalidatePrefix('structures:');
  invalidateDashboardCache();
}

async function listSalaryRules(query) {
  const { page, pageSize, skip, take } = getPaginationParams(query);
  const { salaryStructureId, category, search } = query;
  const cacheKey = `salaryrules:list:${salaryStructureId || ''}:${category || ''}:${search || ''}:${page}:${pageSize}`;

  return globalCache.getOrFetch(cacheKey, async () => {
    const where = {};
    if (salaryStructureId) {
      where.salaryStructureId = salaryStructureId;
    }
    if (category) {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [rules, total] = await Promise.all([
      prisma.salaryRule.findMany({
        where,
        skip,
        take,
        orderBy: [{ salaryStructureId: 'asc' }, { sequence: 'asc' }],
        include: {
          salaryStructure: {
            select: { id: true, name: true, code: true },
          },
        },
      }),
      prisma.salaryRule.count({ where }),
    ]);

    return formatListResponse(rules, total, page, pageSize);
  }, 60000);
}

async function getSalaryRuleById(id) {
  const cacheKey = `salaryrules:detail:${id}`;

  return globalCache.getOrFetch(cacheKey, async () => {
    const rule = await prisma.salaryRule.findUnique({
      where: { id },
      include: {
        salaryStructure: true,
      },
    });

    if (!rule) {
      throw new AppError('SALARY_RULE_NOT_FOUND', 'Salary rule not found', 404);
    }

    return rule;
  }, 60000);
}

async function createSalaryRule(data) {
  const structure = await prisma.salaryStructure.findUnique({
    where: { id: data.salaryStructureId },
  });
  if (!structure) {
    throw new AppError('SALARY_STRUCTURE_NOT_FOUND', 'Salary structure not found', 404);
  }

  const code = (data.code || '').toUpperCase().trim();
  const existing = await prisma.salaryRule.findUnique({
    where: {
      salaryStructureId_code: {
        salaryStructureId: data.salaryStructureId,
        code,
      },
    },
  });

  if (existing) {
    throw new AppError('DUPLICATE_RULE_CODE', 'A rule with this code already exists in the selected salary structure', 409);
  }

  const compType = data.computationType || data.computationMethod || 'FIXED';

  const result = await prisma.salaryRule.create({
    data: {
      salaryStructureId: data.salaryStructureId,
      name: data.name,
      code,
      category: data.category,
      sequence: data.sequence !== undefined ? Number(data.sequence) : 1,
      computationType: compType,
      amount: compType === 'FIXED' ? (data.amount !== null && data.amount !== undefined ? Number(data.amount) : 0) : null,
      percentage: compType === 'PERCENTAGE' ? (data.percentage !== null && data.percentage !== undefined ? Number(data.percentage) : 0) : null,
      percentageBasisCode: compType === 'PERCENTAGE' && data.percentageBasisCode ? data.percentageBasisCode.toUpperCase().trim() : null,
      formula: compType === 'FORMULA' ? (data.formula || null) : null,
    },
    include: {
      salaryStructure: { select: { id: true, name: true, code: true } },
    },
  });

  invalidateSalaryRuleCache();
  return result;
}

async function updateSalaryRule(id, data) {
  const rule = await prisma.salaryRule.findUnique({ where: { id } });
  if (!rule) {
    throw new AppError('SALARY_RULE_NOT_FOUND', 'Salary rule not found', 404);
  }

  const updateData = {};
  if (data.name !== undefined) updateData.name = data.name;
  if (data.code !== undefined) updateData.code = data.code.toUpperCase().trim();
  if (data.category !== undefined) updateData.category = data.category;
  if (data.sequence !== undefined) updateData.sequence = Number(data.sequence);

  const compType = data.computationType || data.computationMethod || (data.amount !== undefined || data.percentage !== undefined || data.formula !== undefined ? rule.computationType : undefined);
  if (compType !== undefined) {
    updateData.computationType = compType;
  }

  const effectiveType = updateData.computationType || rule.computationType;
  if (effectiveType === 'FIXED') {
    if (data.amount !== undefined) updateData.amount = data.amount !== null ? Number(data.amount) : 0;
    updateData.percentage = null;
    updateData.percentageBasisCode = null;
    updateData.formula = null;
  } else if (effectiveType === 'PERCENTAGE') {
    if (data.percentage !== undefined) updateData.percentage = data.percentage !== null ? Number(data.percentage) : 0;
    if (data.percentageBasisCode !== undefined) {
      updateData.percentageBasisCode = data.percentageBasisCode ? data.percentageBasisCode.toUpperCase().trim() : 'BASIC';
    }
    updateData.amount = null;
    updateData.formula = null;
  } else if (effectiveType === 'FORMULA') {
    if (data.formula !== undefined) updateData.formula = data.formula || '';
    updateData.amount = null;
    updateData.percentage = null;
    updateData.percentageBasisCode = null;
  }

  const result = await prisma.salaryRule.update({
    where: { id },
    data: updateData,
    include: {
      salaryStructure: { select: { id: true, name: true, code: true } },
    },
  });

  invalidateSalaryRuleCache();
  return result;
}

async function deleteSalaryRule(id) {
  const rule = await prisma.salaryRule.findUnique({
    where: { id },
    include: { payslipLines: { take: 1 } },
  });

  if (!rule) {
    throw new AppError('SALARY_RULE_NOT_FOUND', 'Salary rule not found', 404);
  }

  if (rule.payslipLines.length > 0) {
    throw new AppError('SALARY_RULE_IN_USE', 'Cannot delete salary rule referenced by existing payslips', 400);
  }

  await prisma.salaryRule.delete({ where: { id } });
  invalidateSalaryRuleCache();
  return { message: 'Salary rule deleted successfully' };
}

module.exports = {
  listSalaryRules,
  getSalaryRuleById,
  createSalaryRule,
  updateSalaryRule,
  deleteSalaryRule,
  invalidateSalaryRuleCache,
};

