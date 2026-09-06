import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import AppShell from '../components/layout/AppShell';

// Pages
import LoginPage from '../features/auth/LoginPage';
import UserManagementPage from '../features/userManagement/UserManagementPage';
import EmployeeListPage from '../features/employees/EmployeeListPage';
import EmployeeFormPage from '../features/employees/EmployeeFormPage';
import DepartmentsPage from '../features/departments/DepartmentsPage';
import ContractListPage from '../features/contracts/ContractListPage';
import ContractFormPage from '../features/contracts/ContractFormPage';
import ScheduleListPage from '../features/schedules/ScheduleListPage';
import ScheduleFormPage from '../features/schedules/ScheduleFormPage';
import AttendanceListPage from '../features/attendance/AttendanceListPage';
import TimeOffRequestsPage from '../features/timeOff/TimeOffRequestsPage';
import AllocationsPage from '../features/timeOff/AllocationsPage';
import TimeOffTypesPage from '../features/timeOff/TimeOffTypesPage';
import PayrunsListPage from '../features/payroll/PayrunsListPage';
import NewPayrunWizard from '../features/payroll/NewPayrunWizard';
import PayrunProcessingPage from '../features/payroll/PayrunProcessingPage';
import PayslipsListPage from '../features/payroll/PayslipsListPage';
import PayslipDetailPage from '../features/payroll/PayslipDetailPage';
import SalaryStructuresPage from '../features/payrollConfig/SalaryStructuresPage';
import SalaryStructureFormPage from '../features/payrollConfig/SalaryStructureFormPage';
import SalaryRulesPage from '../features/payrollConfig/SalaryRulesPage';
import PayrollDashboardPage from '../features/dashboard/PayrollDashboardPage';
import AttendanceAlertsListPage from '../features/attendanceAlerts/AttendanceAlertsListPage';
import AttendanceAlertDetailPage from '../features/attendanceAlerts/AttendanceAlertDetailPage';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected Authenticated Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Dashboard */}
          <Route element={<RoleRoute permissionKey="VIEW_DASHBOARD" />}>
            <Route path="/dashboard" element={<PayrollDashboardPage />} />
          </Route>

          {/* User Management (Admin Only) */}
          <Route element={<RoleRoute permissionKey="VIEW_USERS" />}>
            <Route path="/users" element={<UserManagementPage />} />
          </Route>

          {/* Employee Module */}
          <Route element={<RoleRoute permissionKey="VIEW_ALL_EMPLOYEES" />}>
            <Route path="/employees" element={<EmployeeListPage />} />
          </Route>
          <Route element={<RoleRoute permissionKey="MANAGE_EMPLOYEES" />}>
            <Route path="/employees/new" element={<EmployeeFormPage />} />
            <Route path="/employees/:id/edit" element={<EmployeeFormPage />} />
          </Route>
          <Route path="/employees/:id" element={<EmployeeFormPage />} />

          {/* Departments */}
          <Route element={<RoleRoute permissionKey="VIEW_DEPARTMENTS" />}>
            <Route path="/departments" element={<DepartmentsPage />} />
          </Route>

          {/* Contracts */}
          <Route element={<RoleRoute permissionKey="VIEW_CONTRACTS" />}>
            <Route path="/contracts" element={<ContractListPage />} />
          </Route>
          <Route element={<RoleRoute permissionKey="MANAGE_CONTRACTS" />}>
            <Route path="/contracts/new" element={<ContractFormPage />} />
            <Route path="/contracts/:id/edit" element={<ContractFormPage />} />
          </Route>

          {/* Working Schedules */}
          <Route element={<RoleRoute permissionKey="VIEW_SCHEDULES" />}>
            <Route path="/schedules" element={<ScheduleListPage />} />
          </Route>
          <Route element={<RoleRoute permissionKey="MANAGE_SCHEDULES" />}>
            <Route path="/schedules/new" element={<ScheduleFormPage />} />
            <Route path="/schedules/:id/edit" element={<ScheduleFormPage />} />
          </Route>

          {/* Attendance */}
          <Route path="/attendance" element={<AttendanceListPage />} />

          {/* Attendance Risk Alerts */}
          <Route element={<RoleRoute permissionKey="VIEW_ATTENDANCE_ALERTS" />}>
            <Route path="/attendance-alerts" element={<AttendanceAlertsListPage />} />
            <Route path="/attendance-alerts/:id" element={<AttendanceAlertDetailPage />} />
          </Route>

          {/* Time Off */}
          <Route path="/time-off/requests" element={<TimeOffRequestsPage />} />
          <Route path="/time-off/allocations" element={<AllocationsPage />} />
          <Route element={<RoleRoute permissionKey="MANAGE_TIME_OFF_TYPES" />}>
            <Route path="/time-off/types" element={<TimeOffTypesPage />} />
          </Route>

          {/* Payroll */}
          <Route element={<RoleRoute permissionKey="VIEW_PAYRUNS" />}>
            <Route path="/payroll/payruns" element={<PayrunsListPage />} />
            <Route path="/payroll/payruns/:id" element={<PayrunProcessingPage />} />
          </Route>
          <Route element={<RoleRoute permissionKey="CREATE_PAYRUN" />}>
            <Route path="/payroll/payruns/new" element={<NewPayrunWizard />} />
          </Route>

          <Route element={<RoleRoute permissionKey="VIEW_PAYSLIPS" />}>
            <Route path="/payroll/payslips" element={<PayslipsListPage />} />
            <Route path="/payroll/payslips/:id" element={<PayslipDetailPage />} />
          </Route>

          {/* Payroll Config */}
          <Route element={<RoleRoute permissionKey="VIEW_SALARY_STRUCTURES" />}>
            <Route path="/payroll-config/structures" element={<SalaryStructuresPage />} />
            <Route path="/payroll-config/structures/:structureId/rules" element={<SalaryRulesPage />} />
          </Route>
          <Route element={<RoleRoute permissionKey="MANAGE_SALARY_STRUCTURES" />}>
            <Route path="/payroll-config/structures/new" element={<SalaryStructureFormPage />} />
            <Route path="/payroll-config/structures/:id/edit" element={<SalaryStructureFormPage />} />
          </Route>
        </Route>
      </Route>

      {/* Catch-all Fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
