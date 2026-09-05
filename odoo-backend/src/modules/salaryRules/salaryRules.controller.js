const salaryRulesService = require('./salaryRules.service');

async function listSalaryRules(req, res, next) {
  try {
    const result = await salaryRulesService.listSalaryRules(req.query);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getSalaryRuleById(req, res, next) {
  try {
    const result = await salaryRulesService.getSalaryRuleById(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function createSalaryRule(req, res, next) {
  try {
    const result = await salaryRulesService.createSalaryRule(req.body);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function updateSalaryRule(req, res, next) {
  try {
    const result = await salaryRulesService.updateSalaryRule(req.params.id, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function deleteSalaryRule(req, res, next) {
  try {
    const result = await salaryRulesService.deleteSalaryRule(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listSalaryRules,
  getSalaryRuleById,
  createSalaryRule,
  updateSalaryRule,
  deleteSalaryRule,
};
