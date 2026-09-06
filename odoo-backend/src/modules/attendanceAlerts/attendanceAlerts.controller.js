const attendanceAlertsService = require('./attendanceAlerts.service');

async function listAlerts(req, res, next) {
  try {
    const result = await attendanceAlertsService.listAttendanceAlerts(req.query, req.scopedEmployeeId);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getAlertById(req, res, next) {
  try {
    const result = await attendanceAlertsService.getAttendanceAlertById(req.params.id, req.scopedEmployeeId);
    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
}

async function getMyAlert(req, res, next) {
  try {
    const employeeId = req.user?.employeeId;
    const result = await attendanceAlertsService.getMyAttendanceAlert(employeeId);
    return res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
}

async function runCheck(req, res, next) {
  try {
    const evaluationDate = req.body?.evaluationDate ? new Date(req.body.evaluationDate) : new Date();
    const result = await attendanceAlertsService.runAttendanceRiskCheck(evaluationDate);
    return res.status(200).json({
      success: true,
      data: result,
      message: `Attendance risk scan complete. ${result.alertsTriggered} active alerts generated/updated.`,
    });
  } catch (error) {
    next(error);
  }
}

async function updateAlertStatus(req, res, next) {
  try {
    const result = await attendanceAlertsService.updateAttendanceAlertStatus(
      req.params.id,
      req.body,
      req.user
    );
    return res.status(200).json({
      success: true,
      data: result,
      message: `Alert status updated to ${result.status}.`,
    });
  } catch (error) {
    next(error);
  }
}

async function getThreshold(req, res, next) {
  try {
    const thresholdDays = await attendanceAlertsService.getAlertDaysThreshold();
    return res.status(200).json({ data: { threshold: thresholdDays, thresholdDays } });
  } catch (error) {
    next(error);
  }
}

async function updateThreshold(req, res, next) {
  try {
    const val = req.body.threshold !== undefined ? req.body.threshold : req.body.thresholdDays;
    const result = await attendanceAlertsService.updateAlertDaysThreshold(val);
    return res.status(200).json({
      success: true,
      data: {
        threshold: result.thresholdDays,
        thresholdDays: result.thresholdDays,
        ...result,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listAlerts,
  getAlertById,
  getMyAlert,
  runCheck,
  updateAlertStatus,
  getThreshold,
  updateThreshold,
};
