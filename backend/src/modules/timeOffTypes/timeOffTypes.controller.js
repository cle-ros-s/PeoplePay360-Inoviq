const timeOffTypesService = require('./timeOffTypes.service');

async function listTimeOffTypes(req, res, next) {
  try {
    const result = await timeOffTypesService.listTimeOffTypes(req.query);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getTimeOffTypeById(req, res, next) {
  try {
    const result = await timeOffTypesService.getTimeOffTypeById(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function createTimeOffType(req, res, next) {
  try {
    const result = await timeOffTypesService.createTimeOffType(req.body);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function updateTimeOffType(req, res, next) {
  try {
    const result = await timeOffTypesService.updateTimeOffType(req.params.id, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function deleteTimeOffType(req, res, next) {
  try {
    const result = await timeOffTypesService.deleteTimeOffType(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listTimeOffTypes,
  getTimeOffTypeById,
  createTimeOffType,
  updateTimeOffType,
  deleteTimeOffType,
};
