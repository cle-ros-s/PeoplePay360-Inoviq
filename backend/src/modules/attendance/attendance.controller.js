const attendanceService = require('./attendance.service');

async function listAttendance(req, res, next) {
  try {
    const result = await attendanceService.listAttendance(req.query, req.scopedEmployeeId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getAttendanceById(req, res, next) {
  try {
    const result = await attendanceService.getAttendanceById(req.params.id, req.scopedEmployeeId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function checkIn(req, res, next) {
  try {
    const result = await attendanceService.checkIn(req.body, req.user);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
}

async function checkOut(req, res, next) {
  try {
    const result = await attendanceService.checkOut(req.params.id, req.body, req.user);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function updateAttendance(req, res, next) {
  try {
    const result = await attendanceService.updateAttendance(req.params.id, req.body, req.user);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function deleteAttendance(req, res, next) {
  try {
    const result = await attendanceService.deleteAttendance(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listAttendance,
  getAttendanceById,
  checkIn,
  checkOut,
  updateAttendance,
  deleteAttendance,
};
