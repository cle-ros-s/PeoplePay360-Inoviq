const salaryStructuresService = require('./salaryStructures.service');
const salaryRulesService = require('../salaryRules/salaryRules.service');

async function listSalaryStructures(req, res, next) {
  try {
    const result = await salaryStructuresService.listSalaryStructures(req.query);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getSalaryStructureById(req, res, next) {
  try {
    const result = await salaryStructuresService.getSalaryStructureById(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function createSalaryStructure(req, res, next) {
  try {
    const result = await salaryStructuresService.createSalaryStructure(req.body);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function updateSalaryStructure(req, res, next) {
  try {
    const result = await salaryStructuresService.updateSalaryStructure(req.params.id, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function reorderRules(req, res, next) {
  try {
    const payload = req.body.ruleOrders || req.body.ruleIds || req.body;
    const result = await salaryStructuresService.reorderRules(req.params.id, payload);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function deleteSalaryStructure(req, res, next) {
  try {
    const result = await salaryStructuresService.deleteSalaryStructure(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getRulesForStructure(req, res, next) {
  try {
    const result = await salaryRulesService.listSalaryRules({ ...req.query, salaryStructureId: req.params.id });
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function createRuleForStructure(req, res, next) {
  try {
    const payload = {
      ...req.body,
      salaryStructureId: req.params.id,
      computationType: req.body.computationType || req.body.computationMethod || 'FIXED',
    };
    const result = await salaryRulesService.createSalaryRule(payload);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listSalaryStructures,
  getSalaryStructureById,
  createSalaryStructure,
  updateSalaryStructure,
  reorderRules,
  deleteSalaryStructure,
  getRulesForStructure,
  createRuleForStructure,
};
