const timeOffRequestsService = require('./timeOffRequests.service');

async function listTimeOffRequests(req, res, next) {
  try {
    const result = await timeOffRequestsService.listTimeOffRequests(req.query, req.scopedEmployeeId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getTimeOffRequestById(req, res, next) {
  try {
    const result = await timeOffRequestsService.getTimeOffRequestById(req.params.id, req.scopedEmployeeId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function createTimeOffRequest(req, res, next) {
  try {
    const result = await timeOffRequestsService.createTimeOffRequest(req.body, req.user);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function approveTimeOffRequest(req, res, next) {
  try {
    const result = await timeOffRequestsService.approveTimeOffRequest(req.params.id, req.user);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function refuseTimeOffRequest(req, res, next) {
  try {
    const result = await timeOffRequestsService.refuseTimeOffRequest(req.params.id, req.body.reason, req.user);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function updateTimeOffRequest(req, res, next) {
  try {
    const result = await timeOffRequestsService.updateTimeOffRequest(req.params.id, req.body, req.scopedEmployeeId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function deleteTimeOffRequest(req, res, next) {
  try {
    const result = await timeOffRequestsService.deleteTimeOffRequest(req.params.id, req.scopedEmployeeId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listTimeOffRequests,
  getTimeOffRequestById,
  createTimeOffRequest,
  approveTimeOffRequest,
  refuseTimeOffRequest,
  updateTimeOffRequest,
  deleteTimeOffRequest,
};
