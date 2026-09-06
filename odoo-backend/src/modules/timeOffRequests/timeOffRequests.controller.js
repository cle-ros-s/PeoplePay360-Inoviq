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
    const reason = req.body?.refusalReason || req.body?.reason || 'Request refused by manager';
    const result = await timeOffRequestsService.refuseTimeOffRequest(req.params.id, reason, req.user);
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

async function bulkApproveTimeOffRequests(req, res, next) {
  try {
    const result = await timeOffRequestsService.bulkApproveTimeOffRequests(req.body?.ids, req.user);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function bulkRefuseTimeOffRequests(req, res, next) {
  try {
    const reason = req.body?.refusalReason || req.body?.reason || 'Bulk refused by manager';
    const result = await timeOffRequestsService.bulkRefuseTimeOffRequests(req.body?.ids, reason, req.user);
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
  bulkApproveTimeOffRequests,
  bulkRefuseTimeOffRequests,
  updateTimeOffRequest,
  deleteTimeOffRequest,
};
