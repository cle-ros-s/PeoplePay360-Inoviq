const allocationsService = require('./allocations.service');

async function listAllocations(req, res, next) {
  try {
    const result = await allocationsService.listAllocations(req.query, req.scopedEmployeeId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getAllocationById(req, res, next) {
  try {
    const result = await allocationsService.getAllocationById(req.params.id, req.scopedEmployeeId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function createAllocation(req, res, next) {
  try {
    const result = await allocationsService.createAllocation(req.body);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function updateAllocation(req, res, next) {
  try {
    const result = await allocationsService.updateAllocation(req.params.id, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function deleteAllocation(req, res, next) {
  try {
    const result = await allocationsService.deleteAllocation(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listAllocations,
  getAllocationById,
  createAllocation,
  updateAllocation,
  deleteAllocation,
};
