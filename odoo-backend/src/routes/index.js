const express = require('express');

const authRoutes = require('../modules/auth/auth.routes');
const usersRoutes = require('../modules/users/users.routes');
const departmentsRoutes = require('../modules/departments/departments.routes');
const employeesRoutes = require('../modules/employees/employees.routes');
const contractsRoutes = require('../modules/contracts/contracts.routes');
const schedulesRoutes = require('../modules/schedules/schedules.routes');
const attendanceRoutes = require('../modules/attendance/attendance.routes');
const timeOffTypesRoutes = require('../modules/timeOffTypes/timeOffTypes.routes');
const allocationsRoutes = require('../modules/allocations/allocations.routes');
const timeOffRequestsRoutes = require('../modules/timeOffRequests/timeOffRequests.routes');
const salaryStructuresRoutes = require('../modules/salaryStructures/salaryStructures.routes');
const salaryRulesRoutes = require('../modules/salaryRules/salaryRules.routes');
const payrunsRoutes = require('../modules/payroll/payruns.routes');
const payslipsRoutes = require('../modules/payroll/payslips.routes');
const dashboardRoutes = require('../modules/dashboard/dashboard.routes');

const router = express.Router();

// Health check endpoint (Requirement #39)
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'PeoplePay360 API',
  });
});

// Register API modules
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/departments', departmentsRoutes);
router.use('/employees', employeesRoutes);
router.use('/contracts', contractsRoutes);
router.use('/schedules', schedulesRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/time-off-types', timeOffTypesRoutes);
router.use('/allocations', allocationsRoutes);
router.use('/time-off-requests', timeOffRequestsRoutes);
router.use('/salary-structures', salaryStructuresRoutes);
router.use('/salary-rules', salaryRulesRoutes);
router.use('/payruns', payrunsRoutes);
router.use('/payslips', payslipsRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
