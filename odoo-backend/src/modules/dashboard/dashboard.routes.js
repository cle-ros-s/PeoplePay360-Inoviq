const express = require('express');
const dashboardController = require('./dashboard.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/rbac.middleware');

const router = express.Router();

router.use(authenticate);
router.use(requireRole('ADMIN', 'HR_MANAGER', 'HR_PAYROLL_USER', 'HR_PAYROLL_MANAGER'));

router.get('/summary', dashboardController.getDashboardSummary);
router.get('/kpis', dashboardController.getKpis);
router.get('/salary-cost-by-department', dashboardController.getSalaryCostByDepartment);
router.get('/net-salary-trend', dashboardController.getNetSalaryTrend);
router.get('/payslip-status-breakdown', dashboardController.getPayslipStatusBreakdown);
router.get('/attendance-overview', dashboardController.getAttendanceOverview);
router.get('/time-off-overview', dashboardController.getTimeOffOverview);
router.get('/warnings', dashboardController.getDashboardWarnings);

module.exports = router;
