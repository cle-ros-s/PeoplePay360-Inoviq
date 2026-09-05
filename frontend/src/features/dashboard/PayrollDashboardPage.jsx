import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi } from '../../api/dashboard.api';
import { departmentsApi } from '../../api/departments.api';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import KpiCard from '../../components/charts/KpiCard';
import BarChartCard from '../../components/charts/BarChartCard';
import LineChartCard from '../../components/charts/LineChartCard';
import DonutStatusCard from '../../components/charts/DonutStatusCard';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import FormField from '../../components/common/FormField';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  DollarSign,
  Users,
  FileCheck,
  Palmtree,
  Clock,
  AlertTriangle,
  Filter,
  UserPlus,
  Plus,
  Building,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { formatCurrency, formatEnumLabel } from '../../utils/formatters';
import { EmployeeType } from '../../utils/constants';
import { usePermissions } from '../../hooks/usePermissions';

const deptSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  code: z.string().optional().nullable(),
});

export default function PayrollDashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = usePermissions();

  const [period, setPeriod] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [employeeType, setEmployeeType] = useState('');

  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [deptFeedback, setDeptFeedback] = useState({ type: '', message: '' });

  const params = {
    period: period || undefined,
    department: departmentId || undefined,
    employeeType: employeeType || undefined,
  };

  // Fetch departments for filter dropdown
  const { data: deptData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.getDepartments(),
  });
  const departmentsList = deptData?.data || (Array.isArray(deptData) ? deptData : []);

  // Live API Dashboard Queries
  const { data: kpis, isLoading: kpiLoading } = useQuery({
    queryKey: ['dashboard-kpis', params],
    queryFn: () => dashboardApi.getKpis(params),
  });

  const { data: salaryCost, isLoading: salaryCostLoading } = useQuery({
    queryKey: ['dashboard-salary-cost', params],
    queryFn: () => dashboardApi.getSalaryCostByDepartment(params),
  });

  const { data: netTrend, isLoading: netTrendLoading } = useQuery({
    queryKey: ['dashboard-net-trend', params],
    queryFn: () => dashboardApi.getNetSalaryTrend(params),
  });

  const { data: payslipBreakdown, isLoading: breakdownLoading } = useQuery({
    queryKey: ['dashboard-payslip-breakdown', params],
    queryFn: () => dashboardApi.getPayslipStatusBreakdown(params),
  });

  const { data: attendanceOverview } = useQuery({
    queryKey: ['dashboard-attendance-overview', params],
    queryFn: () => dashboardApi.getAttendanceOverview(params),
  });

  const { data: timeOffOverview } = useQuery({
    queryKey: ['dashboard-timeoff-overview', params],
    queryFn: () => dashboardApi.getTimeOffOverview(params),
  });

  const { data: warningsData } = useQuery({
    queryKey: ['dashboard-warnings', params],
    queryFn: () => dashboardApi.getWarnings(params),
  });

  const {
    register: registerDept,
    handleSubmit: handleDeptSubmit,
    reset: resetDept,
    formState: { errors: deptErrors },
  } = useForm({
    resolver: zodResolver(deptSchema),
    defaultValues: { name: '', code: '' },
  });

  const createDeptMutation = useMutation({
    mutationFn: departmentsApi.createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-salary-cost'] });
      setDeptModalOpen(false);
      resetDept();
      setDeptFeedback({ type: 'success', message: 'New department successfully created and saved!' });
    },
    onError: (err) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to create department';
      setDeptFeedback({ type: 'error', message: msg });
    },
  });

  const onDeptFormSubmit = (values) => {
    setDeptFeedback({ type: '', message: '' });
    createDeptMutation.mutate({
      name: values.name.trim(),
      code: values.code ? values.code.trim().toUpperCase() : undefined,
    });
  };

  const handleResetFilters = () => {
    setPeriod('');
    setDepartmentId('');
    setEmployeeType('');
  };

  const filterConfigs = [
    {
      label: 'Department Filter',
      value: departmentId,
      onChange: setDepartmentId,
      options: departmentsList.map((d) => ({ value: d.id, label: d.name })),
    },
    {
      label: 'Employee Type Filter',
      value: employeeType,
      onChange: setEmployeeType,
      options: Object.values(EmployeeType).map((t) => ({ value: t, label: formatEnumLabel(t) })),
    },
  ];

  const warningsList = warningsData?.data || (Array.isArray(warningsData) ? warningsData : []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll & Operational Dashboard"
        description="Aggregated real-time metrics across employees, working schedules, attendance, leave allocations, and payroll batches."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {can('MANAGE_EMPLOYEES') && (
              <button
                type="button"
                onClick={() => navigate('/employees/new')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                New Employee
              </button>
            )}
            {can('MANAGE_DEPARTMENTS') && (
              <button
                type="button"
                onClick={() => {
                  resetDept({ name: '', code: '' });
                  setDeptFeedback({ type: '', message: '' });
                  setDeptModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg shadow-sm transition-colors"
              >
                <Building className="w-4 h-4 text-gray-500" />
                Add Department
              </button>
            )}
            {can('CREATE_PAYRUN') && (
              <button
                type="button"
                onClick={() => navigate('/payroll/payruns/new')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Payrun
              </button>
            )}
          </div>
        }
      />

      {/* Quick feedback banner for dashboard actions */}
      {deptFeedback.message && (
        <div
          className={`p-4 rounded-xl border flex items-start justify-between gap-3 text-sm shadow-sm ${
            deptFeedback.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-start gap-3">
            {deptFeedback.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{deptFeedback.type === 'error' ? 'Department Action Failed' : 'Department Created'}</p>
              <p className="text-xs mt-0.5">{deptFeedback.message}</p>
            </div>
          </div>
          <button
            onClick={() => setDeptFeedback({ type: '', message: '' })}
            className="text-xs font-semibold underline opacity-80 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Top Filter Bar */}
      <FilterBar filters={filterConfigs} onReset={handleResetFilters}>
        <div className="w-full sm:w-48">
          <input
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg shadow-sm"
          />
        </div>
      </FilterBar>

      {/* 5 Live KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KpiCard
          title="Total Net Salary Paid"
          value={kpiLoading ? '...' : formatCurrency(kpis?.totalNetPaid || kpis?.totalNetSalaryPaid || 0)}
          subtext="Processed in selected period"
          icon={DollarSign}
          color="emerald"
        />
        <KpiCard
          title="Payslips Generated"
          value={kpiLoading ? '...' : kpis?.payslipsGenerated ?? kpis?.payslipCount ?? 0}
          subtext="Total batch payslips"
          icon={FileCheck}
          color="blue"
        />
        <KpiCard
          title="Average Net Salary"
          value={kpiLoading ? '...' : formatCurrency(kpis?.averageSalary || 0)}
          subtext="Per employee average"
          icon={Users}
          color="purple"
        />
        <KpiCard
          title="Approved Time Off"
          value={kpiLoading ? '...' : `${kpis?.approvedTimeOff || 0} days`}
          subtext="Leave taken in period"
          icon={Palmtree}
          color="amber"
        />
        <KpiCard
          title="Attendance Rate"
          value={kpiLoading ? '...' : `${kpis?.attendanceRate || kpis?.attendanceHealth || 100}%`}
          subtext="Presence health score"
          icon={Clock}
          color="indigo"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BarChartCard
            title="Salary Cost Expenditure by Department"
            data={salaryCost?.data || (Array.isArray(salaryCost) ? salaryCost : [])}
            dataKey="cost"
            nameKey="department"
            isLoading={salaryCostLoading}
          />
        </div>
        <div>
          <DonutStatusCard
            title="Payslip Status Breakdown"
            data={payslipBreakdown?.data || (Array.isArray(payslipBreakdown) ? payslipBreakdown : [])}
            dataKey="count"
            nameKey="status"
            isLoading={breakdownLoading}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <LineChartCard
            title="Monthly Net Salary Disbursement Trend"
            data={netTrend?.data || (Array.isArray(netTrend) ? netTrend : [])}
            dataKey="totalNet"
            nameKey="month"
            isLoading={netTrendLoading}
          />
        </div>

        {/* Operational Warnings Widget */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Operational Warnings
              </h3>
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                {warningsList.length}
              </span>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-60">
              {warningsList.length === 0 ? (
                <p className="text-xs text-gray-400 italic text-center py-6">No operational warnings detected.</p>
              ) : (
                warningsList.slice(0, 5).map((w, idx) => (
                  <div key={idx} className="p-2.5 bg-gray-50 rounded-lg border border-gray-100 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-[10px] text-gray-500 uppercase">{w.type}</span>
                      <StatusBadge status={w.severity} />
                    </div>
                    <p className="text-gray-800 font-medium leading-snug">{w.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance & Time Off Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attendance Summary */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            Attendance & Presence Summary
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <span className="text-xs text-emerald-700 font-medium block">Present</span>
              <span className="text-lg font-bold text-emerald-900">{attendanceOverview?.present || 0}</span>
            </div>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              <span className="text-xs text-amber-700 font-medium block">Late</span>
              <span className="text-lg font-bold text-amber-900">{attendanceOverview?.late || 0}</span>
            </div>
            <div className="p-3 bg-rose-50 rounded-lg border border-rose-100">
              <span className="text-xs text-rose-700 font-medium block">Absent</span>
              <span className="text-lg font-bold text-rose-900">{attendanceOverview?.absent || 0}</span>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
              <span className="text-xs text-purple-700 font-medium block">Missing Checkouts</span>
              <span className="text-lg font-bold text-purple-900">{attendanceOverview?.missingCheckout || 0}</span>
            </div>
          </div>
        </div>

        {/* Time Off Summary */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Palmtree className="w-4 h-4 text-amber-600" />
            Time Off & Leave Summary
          </h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
              <span className="text-xs text-blue-700 font-medium block">Pending Requests</span>
              <span className="text-lg font-bold text-blue-900">{timeOffOverview?.pendingRequests || 0}</span>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <span className="text-xs text-emerald-700 font-medium block">Approved Days</span>
              <span className="text-lg font-bold text-emerald-900">{timeOffOverview?.approvedDays || 0} days</span>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
              <span className="text-xs text-indigo-700 font-medium block">Active Allocations</span>
              <span className="text-lg font-bold text-indigo-900">{timeOffOverview?.activeAllocations || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Department Modal Directly Accessible from Dashboard */}
      <Modal
        isOpen={deptModalOpen}
        onClose={() => setDeptModalOpen(false)}
        title="Create New Department"
        description="Specify a department name and optional unique code for organizational payroll distribution."
      >
        <form onSubmit={handleDeptSubmit(onDeptFormSubmit)} className="space-y-4">
          <FormField
            label="Department Name"
            name="name"
            register={registerDept}
            error={deptErrors.name}
            required
            placeholder="e.g. Sales & Marketing, IT Support"
          />
          <FormField
            label="Department Code (Optional)"
            name="code"
            register={registerDept}
            error={deptErrors.code}
            placeholder="e.g. SALES, IT (auto-generated if omitted)"
          />
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
            <button
              type="button"
              onClick={() => setDeptModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createDeptMutation.isPending}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
            >
              {createDeptMutation.isPending ? 'Creating Department...' : 'Create Department'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
