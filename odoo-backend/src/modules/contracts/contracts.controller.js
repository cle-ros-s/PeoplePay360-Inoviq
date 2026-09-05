const contractsService = require('./contracts.service');

async function listContracts(req, res, next) {
  try {
    const result = await contractsService.listContracts(req.query, req.scopedEmployeeId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getContractById(req, res, next) {
  try {
    const result = await contractsService.getContractById(req.params.id, req.scopedEmployeeId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function createContract(req, res, next) {
  try {
    const result = await contractsService.createContract(req.body);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function updateContract(req, res, next) {
  try {
    const result = await contractsService.updateContract(req.params.id, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function deleteContract(req, res, next) {
  try {
    const result = await contractsService.deleteContract(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listContracts,
  getContractById,
  createContract,
  updateContract,
  deleteContract,
};
