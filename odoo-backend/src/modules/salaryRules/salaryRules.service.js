const prisma = require('../../config/prisma');
const { getPaginationParams } = require('../../utils/pagination');
const { formatListResponse, AppError } = require('../../utils/responseFormatter');

async function listSalaryRules(query) {
  const { page, pageSize, skip, take } = getPaginationParams(query);
  const { salaryStructureId, category, search } = query;

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
}

async function getSalaryRuleById(id) {
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
}

async function createSalaryRule(data) {
  const structure = await prisma.salaryStructure.findUnique({
    where: { id: data.salaryStructureId },
  });
  if (!structure) {
    throw new AppError('SALARY_STRUCTURE_NOT_FOUND', 'Salary structure not found', 404);
  }

  const existing = await prisma.salaryRule.findUnique({
    where: {
      salaryStructureId_code: {
        salaryStructureId: data.salaryStructureId,
        code: data.code.toUpperCase(),
      },
    },
  });

  if (existing) {
    throw new AppError('DUPLICATE_RULE_CODE', 'A rule with this code already exists in the selected salary structure', 409);
  }

  return prisma.salaryRule.create({
    data: {
      salaryStructureId: data.salaryStructureId,
      name: data.name,
      code: data.code.toUpperCase(),
      category: data.category,
      sequence: data.sequence !== undefined ? data.sequence : 1,
      computationType: data.computationType || 'FIXED',
      amount: data.amount !== undefined ? data.amount : null,
      percentage: data.percentage !== undefined ? data.percentage : null,
      percentageBasisCode: data.percentageBasisCode ? data.percentageBasisCode.toUpperCase() : null,
      formula: data.formula || null,
    },
    include: {
      salaryStructure: { select: { id: true, name: true, code: true } },
    },
  });
}

async function updateSalaryRule(id, data) {
  const rule = await prisma.salaryRule.findUnique({ where: { id } });
  if (!rule) {
    throw new AppError('SALARY_RULE_NOT_FOUND', 'Salary rule not found', 404);
  }

  const updateData = { ...data };
  if (updateData.code) updateData.code = updateData.code.toUpperCase();
  if (updateData.percentageBasisCode) updateData.percentageBasisCode = updateData.percentageBasisCode.toUpperCase();

  return prisma.salaryRule.update({
    where: { id },
    data: updateData,
    include: {
      salaryStructure: { select: { id: true, name: true, code: true } },
    },
  });
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
  return { message: 'Salary rule deleted successfully' };
}

module.exports = {
  listSalaryRules,
  getSalaryRuleById,
  createSalaryRule,
  updateSalaryRule,
  deleteSalaryRule,
};
