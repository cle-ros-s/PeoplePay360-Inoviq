const schedulesService = require('./schedules.service');

async function listSchedules(req, res, next) {
  try {
    const result = await schedulesService.listSchedules(req.query);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getScheduleById(req, res, next) {
  try {
    const result = await schedulesService.getScheduleById(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function createSchedule(req, res, next) {
  try {
    const result = await schedulesService.createSchedule(req.body);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function updateSchedule(req, res, next) {
  try {
    const result = await schedulesService.updateSchedule(req.params.id, req.body);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function deleteSchedule(req, res, next) {
  try {
    const result = await schedulesService.deleteSchedule(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listSchedules,
  getScheduleById,
  createSchedule,
  updateSchedule,
  deleteSchedule,
};
