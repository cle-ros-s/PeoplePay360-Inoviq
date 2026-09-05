const salaryStructuresService = require('./salaryStructures.service');

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
    const result = await salaryStructuresService.reorderRules(req.params.id, req.body.ruleOrders);
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

module.exports = {
  listSalaryStructures,
  getSalaryStructureById,
  createSalaryStructure,
  updateSalaryStructure,
  reorderRules,
  deleteSalaryStructure,
};
