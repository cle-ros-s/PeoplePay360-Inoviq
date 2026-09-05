import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi } from '../../api/dashboard.api';
import { departmentsApi } from '../../api/departments.api';
import { employeesApi } from '../../api/employees.api';
import PageHeader from '../../components/common/PageHeader';
import FilterBar from '../../components/common/FilterBar';
import KpiCard from '../../components/charts/KpiCard';
import BarChartCard from '../../components/charts/BarChartCard';
import LineChartCard from '../../components/charts/LineChartCard';
import DonutStatusCard from '../../components/charts/DonutStatusCard';
import StatusBadge from '../../components/common/StatusBadge';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import FormField from '../../components/common/FormField';
import TimeOffRequestFormPage from '../timeOff/TimeOffRequestFormPage';
import TimeOffTypeFormPage from '../timeOff/TimeOffTypeFormPage';
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
  Calendar,
  Download,
  FileSpreadsheet,
  Briefcase,
  Eye,
  Edit2,
  Search,
} from 'lucide-react';
import { formatCurrency, formatDate, formatEnumLabel } from '../../utils/formatters';
import { EmployeeStatus, EmployeeType } from '../../utils/constants';
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

  // Dashboard employee directory state
  const [empSearch, setEmpSearch] = useState('');
  const [empStatusFilter, setEmpStatusFilter] = useState('');
  const [empTypeFilter, setEmpTypeFilter] = useState('');
  const [empDeptFilter, setEmpDeptFilter] = useState('');
  const [empPage, setEmpPage] = useState(1);
  const [empPageSize, setEmpPageSize] = useState(10);
  const [isExporting, setIsExporting] = useState(false);

  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [deptFeedback, setDeptFeedback] = useState({ type: '', message: '' });
  const [timeOffModalOpen, setTimeOffModalOpen] = useState(false);
  const [timeOffTypeModalOpen, setTimeOffTypeModalOpen] = useState(false);

  const params = {
    period: period || undefined,
    department: departmentId || undefined,
    employeeType: employeeType || undefined,
  };

  // Fetch departments for filter dropdown (cached for 5 minutes)
  const { data: deptData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.getDepartments(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  const departmentsList = deptData?.data || (Array.isArray(deptData) ? deptData : []);

  // Live API Dashboard Queries - High-Speed Unified Summary with Instant Cache & Transitions
  const { data: summaryData, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard-summary', params],
    queryFn: () => dashboardApi.getSummary(params),
    staleTime: 2 * 60 * 1000, // 2 minutes fresh cache
    gcTime: 10 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    refetchOnWindowFocus: false,
  });

  // Query employees for the dashboard directory table
  const { data: empResponse, isLoading: empLoading } = useQuery({
    queryKey: ['dashboard-employees', { search: empSearch, status: empStatusFilter, type: empTypeFilter, department: empDeptFilter, page: empPage, pageSize: empPageSize }],
    queryFn: () =>
      employeesApi.getEmployees({
        search: empSearch || undefined,
        status: empStatusFilter || undefined,
        type: empTypeFilter || undefined,
        department: empDeptFilter || undefined,
        page: empPage,
        pageSize: empPageSize,
      }),
    staleTime: 60 * 1000,
    placeholderData: (previousData) => previousData,
  });

  const employeesList = empResponse?.data || (Array.isArray(empResponse) ? empResponse : []);
  const totalEmployees = empResponse?.total || employeesList.length;

  const kpis = summaryData?.kpis;
  const salaryCost = summaryData?.salaryCost;
  const netTrend = summaryData?.netTrend;
  const payslipBreakdown = summaryData?.payslipBreakdown;
  const attendanceOverview = summaryData?.attendanceOverview;
  const timeOffOverview = summaryData?.timeOffOverview;
  const warningsData = summaryData?.warnings;

  const kpiLoading = summaryLoading;
  const salaryCostLoading = summaryLoading;
  const netTrendLoading = summaryLoading;
  const breakdownLoading = summaryLoading;

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
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
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

  // CSV Extraction of all 60 employee details
  const handleExportAllEmployees = async () => {
    try {
      setIsExporting(true);
      const res = await employeesApi.getEmployees({ pageSize: 100 });
      const rawList = res?.data || (Array.isArray(res) ? res : []);

      if (!rawList.length) {
        alert('No employee records available to extract.');
        return;
      }

      const headers = [
        'Employee ID',
        'Full Name',
        'First Name',
        'Last Name',
        'Email Address',
        'Phone',
        'Job Position',
        'Department',
        'Employment Type',
        'Status',
        'Base Wage',
        'Bank Name',
        'Bank Account Number',
        'Bank IFSC / Routing',
        'Working Schedule',
        'Joining Date',
      ];

      const escapeCsv = (str) => {
        if (str === null || str === undefined) return '""';
        const stringVal = String(str).replace(/"/g, '""');
        return `"${stringVal}"`;
      };

      const rows = rawList.map((e) => {
        const wage = e.activeContract?.wage ?? e.contracts?.[0]?.wage ?? '';
        return [
          escapeCsv(e.id),
          escapeCsv(e.name || `${e.firstName || ''} ${e.lastName || ''}`.trim()),
          escapeCsv(e.firstName || ''),
          escapeCsv(e.lastName || ''),
          escapeCsv(e.email || ''),
          escapeCsv(e.phone || ''),
          escapeCsv(e.jobPosition || ''),
          escapeCsv(e.department?.name || ''),
          escapeCsv(e.employeeType || ''),
          escapeCsv(e.status || ''),
          escapeCsv(wage ? `${wage}` : ''),
          escapeCsv(e.bankName || ''),
          escapeCsv(e.bankAccountNumber || ''),
          escapeCsv(e.bankIfscOrRouting || e.bankIfsc || ''),
          escapeCsv(e.schedule?.name || ''),
          escapeCsv(e.joiningDate ? new Date(e.joiningDate).toLocaleDateString() : ''),
        ].join(',');
      });

      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `employee_roster_details_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export employee details:', err);
      alert('Failed to extract employee details. Please try again.');
    } finally {
      setIsExporting(false);
    }
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

  const employeeColumns = [
    {
      header: 'Employee',
      accessorKey: 'name',
      render: (emp) => (
        <div className="flex items-center gap-3 font-medium text-gray-900">
          {emp.avatarUrl ? (
            <img src={emp.avatarUrl} alt={emp.name} className="w-8 h-8 rounded-full object-cover border border-gray-200" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
              {emp.name?.charAt(0) || emp.firstName?.charAt(0) || 'E'}
            </div>
          )}
          <div>
            <div className="font-semibold text-sm">{emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`}</div>
            <div className="text-xs text-gray-500 font-normal">{emp.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Job Position & Department',
      render: (emp) => (
        <div>
          <div className="text-gray-800 font-medium text-xs flex items-center gap-1">
            <Briefcase className="w-3 h-3 text-gray-400" />
            {emp.jobPosition}
          </div>
          <div className="text-gray-500 text-[11px] flex items-center gap-1 mt-0.5">
            <Building className="w-3 h-3 text-gray-400" />
            {emp.department?.name || 'Unassigned'}
          </div>
        </div>
      ),
    },
    {
      header: 'Type',
      accessorKey: 'employeeType',
      render: (emp) => (
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
          {formatEnumLabel(emp.employeeType)}
        </span>
      ),
    },
    {
      header: 'Wage / Rate',
      render: (emp) => {
        const wage = emp.activeContract?.wage ?? emp.contracts?.[0]?.wage;
        return wage ? (
          <span className="font-mono text-xs font-semibold text-emerald-700">
            {formatCurrency(wage)}
          </span>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        );
      },
    },
    {
      header: 'Status',
      accessorKey: 'status',
      render: (emp) => <StatusBadge status={emp.status} />,
    },
    {
      header: 'Actions',
      render: (emp) => (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/employees/${emp.id}`);
            }}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="View Details"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/employees/${emp.id}/edit`);
            }}
            className="p-1 text-gray-600 hover:bg-gray-100 rounded transition-colors"
            title="Edit Employee"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payroll & Operational Dashboard"
        description="Aggregated real-time metrics across employees, working schedules, attendance, leave allocations, and payroll batches."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportAllEmployees}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-emerald-700 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 rounded-lg shadow-sm transition-colors disabled:opacity-50"
              title="Extract full details of all 60 employees to CSV"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              {isExporting ? 'Extracting...' : 'Extract All Employees (CSV)'}
            </button>
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
            {can('VIEW_TIME_OFF_REQUESTS') && (
              <button
                type="button"
                onClick={() => setTimeOffModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg shadow-sm transition-colors"
              >
                <Palmtree className="w-4 h-4 text-amber-500" />
                Request Time Off
              </button>
            )}
            {can('VIEW_TIME_OFF_TYPES') && (
              <button
                type="button"
                onClick={() => setTimeOffTypeModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4 text-emerald-600" />
                Add Time Off Type
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
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Palmtree className="w-4 h-4 text-amber-600" />
                Time Off & Leave Summary
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setTimeOffModalOpen(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition-colors"
                >
                  + Request Leave
                </button>
                <button
                  type="button"
                  onClick={() => setTimeOffTypeModalOpen(true)}
                  className="text-xs font-semibold text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-md transition-colors"
                >
                  + Leave Type
                </button>
              </div>
            </div>
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
      </div>

      {/* All 60 Employees Directory & Data Extraction Hub */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Employee Roster & Details Directory
              </h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                {totalEmployees} Total Records
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Live organizational directory containing all 60 employee records, contract compensation, and operational details.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportAllEmployees}
              disabled={isExporting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-300 hover:bg-emerald-100 rounded-lg shadow-sm transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              {isExporting ? 'Exporting...' : 'Extract All (CSV)'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/employees')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Full Directory Page &rarr;
            </button>
          </div>
        </div>

        {/* Search and Filters for Dashboard Employee Table */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={empSearch}
              onChange={(e) => {
                setEmpSearch(e.target.value);
                setEmpPage(1);
              }}
              placeholder="Search name, position, email..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 focus:bg-white border border-gray-300 rounded-lg transition-colors"
            />
          </div>

          <select
            value={empDeptFilter}
            onChange={(e) => {
              setEmpDeptFilter(e.target.value);
              setEmpPage(1);
            }}
            className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg text-gray-700"
          >
            <option value="">All Departments</option>
            {departmentsList.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={empStatusFilter}
            onChange={(e) => {
              setEmpStatusFilter(e.target.value);
              setEmpPage(1);
            }}
            className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg text-gray-700"
          >
            <option value="">All Statuses</option>
            {Object.values(EmployeeStatus).map((s) => (
              <option key={s} value={s}>
                {formatEnumLabel(s)}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <select
              value={empTypeFilter}
              onChange={(e) => {
                setEmpTypeFilter(e.target.value);
                setEmpPage(1);
              }}
              className="w-full px-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg text-gray-700"
            >
              <option value="">All Types</option>
              {Object.values(EmployeeType).map((t) => (
                <option key={t} value={t}>
                  {formatEnumLabel(t)}
                </option>
              ))}
            </select>
            <select
              value={empPageSize}
              onChange={(e) => {
                setEmpPageSize(Number(e.target.value));
                setEmpPage(1);
              }}
              className="px-2 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg text-gray-700 whitespace-nowrap"
              title="Rows per page"
            >
              <option value={10}>10 / pg</option>
              <option value={20}>20 / pg</option>
              <option value={60}>All 60</option>
            </select>
          </div>
        </div>

        {/* Integrated Data Table */}
        <DataTable
          columns={employeeColumns}
          data={employeesList}
          isLoading={empLoading}
          emptyMessage="No employees found matching the specified filters."
          onRowClick={(emp) => navigate(`/employees/${emp.id}`)}
          pagination={{
            page: empPage,
            pageSize: empPageSize,
            total: totalEmployees,
            onPageChange: setEmpPage,
          }}
        />
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

      {/* Request Time Off Modal Directly Accessible from Dashboard */}
      {timeOffModalOpen && (
        <TimeOffRequestFormPage
          isOpen={timeOffModalOpen}
          onClose={() => setTimeOffModalOpen(false)}
        />
      )}

      {/* Add Time Off Type Modal Directly Accessible from Dashboard */}
      {timeOffTypeModalOpen && (
        <TimeOffTypeFormPage
          isOpen={timeOffTypeModalOpen}
          onClose={() => setTimeOffTypeModalOpen(false)}
        />
      )}
    </div>
  );
}

