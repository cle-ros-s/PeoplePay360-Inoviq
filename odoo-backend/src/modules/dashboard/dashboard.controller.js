const dashboardService = require('./dashboard.service');

async function getKpis(req, res, next) {
  try {
    const result = await dashboardService.getKpis(req.query);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getSalaryCostByDepartment(req, res, next) {
  try {
    const result = await dashboardService.getSalaryCostByDepartment(req.query);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getNetSalaryTrend(req, res, next) {
  try {
    const result = await dashboardService.getNetSalaryTrend(req.query);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getPayslipStatusBreakdown(req, res, next) {
  try {
    const result = await dashboardService.getPayslipStatusBreakdown(req.query);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getAttendanceOverview(req, res, next) {
  try {
    const result = await dashboardService.getAttendanceOverview(req.query);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getTimeOffOverview(req, res, next) {
  try {
    const result = await dashboardService.getTimeOffOverview(req.query);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getDashboardWarnings(req, res, next) {
  try {
    const result = await dashboardService.getDashboardWarnings(req.query);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

async function getDashboardSummary(req, res, next) {
  try {
    const result = await dashboardService.getDashboardSummary(req.query);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getKpis,
  getSalaryCostByDepartment,
  getNetSalaryTrend,
  getPayslipStatusBreakdown,
  getAttendanceOverview,
  getTimeOffOverview,
  getDashboardWarnings,
  getDashboardSummary,
};
