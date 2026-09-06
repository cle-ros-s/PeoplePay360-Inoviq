import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceAlertsApi } from '../../api/attendanceAlerts.api';
import { departmentsApi } from '../../api/departments.api';
import { usePermissions } from '../../hooks/usePermissions';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import FormField from '../../components/common/FormField';
import {
  AlertTriangle,
  ShieldAlert,
  Clock,
  Calendar,
  Search,
  Filter,
  Settings,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eye,
  CheckSquare,
  FileText,
  User,
  Building,
  Activity,
  ArrowRight,
  TrendingDown,
  Info,
} from 'lucide-react';
import { formatDate, formatDateTime, formatEnumLabel } from '../../utils/formatters';

export default function AttendanceAlertsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = usePermissions();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [departmentIdFilter, setDepartmentIdFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Settings Modal
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [thresholdValue, setThresholdValue] = useState(7);
  const [settingsFeedback, setSettingsFeedback] = useState(null);

  // Status Action Modal
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [targetStatus, setTargetStatus] = useState('UNDER_REVIEW');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [actionFeedback, setActionFeedback] = useState(null);

  // Scan feedback
  const [scanResult, setScanResult] = useState(null);

  // Fetch Threshold
  const { data: thresholdData } = useQuery({
    queryKey: ['attendanceAlertThreshold'],
    queryFn: async () => {
      const res = await attendanceAlertsApi.getThreshold();
      if (res?.data?.threshold) {
        setThresholdValue(res.data.threshold);
      }
      return res?.data;
    },
  });

  // Fetch Departments for filter
  const { data: deptData } = useQuery({
    queryKey: ['departments-all'],
    queryFn: () => departmentsApi.getDepartments(),
  });
  const departments = deptData?.data || (Array.isArray(deptData) ? deptData : []);

  // Fetch Alerts List
  const { data: alertsResponse, isLoading, isRefetching } = useQuery({
    queryKey: [
      'attendanceAlerts',
      { status: statusFilter, severity: severityFilter, departmentId: departmentIdFilter, search, page, pageSize },
    ],
    queryFn: () =>
      attendanceAlertsApi.getAlerts({
        status: statusFilter || undefined,
        severity: severityFilter || undefined,
        departmentId: departmentIdFilter || undefined,
        search: search || undefined,
        page,
        pageSize,
      }),
  });

  const alerts = alertsResponse?.data || [];
  const totalRecords = alertsResponse?.total || alerts.length;

  // Scan Mutation
  const scanMutation = useMutation({
    mutationFn: () => attendanceAlertsApi.runAttendanceCheck(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['attendanceAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['payrollDashboard'] });
      setScanResult({
        type: 'success',
        message: `Scan completed: Checked ${res.data?.scannedEmployees || 0} active employees. Found ${res.data?.newAlertsCount || 0} new risk alerts.`,
      });
      setTimeout(() => setScanResult(null), 6000);
    },
    onError: (err) => {
      setScanResult({
        type: 'error',
        message: err.response?.data?.error?.message || 'Failed to trigger attendance risk scan.',
      });
    },
  });

  // Update Threshold Mutation
  const updateThresholdMutation = useMutation({
    mutationFn: (newVal) => attendanceAlertsApi.updateThreshold(newVal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendanceAlertThreshold'] });
      setSettingsFeedback({ type: 'success', message: 'Alert threshold updated successfully!' });
      setTimeout(() => {
        setSettingsFeedback(null);
        setSettingsModalOpen(false);
      }, 1500);
    },
    onError: (err) => {
      setSettingsFeedback({
        type: 'error',
        message: err.response?.data?.error?.message || 'Failed to update threshold.',
      });
    },
  });

  // Update Alert Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, resolutionNotes }) =>
      attendanceAlertsApi.updateAlertStatus(id, { status, resolutionNotes }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendanceAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['payrollDashboard'] });
      setActionFeedback({ type: 'success', message: 'Alert updated successfully!' });
      setTimeout(() => {
        setActionFeedback(null);
        setActionModalOpen(false);
        setSelectedAlert(null);
        setResolutionNotes('');
      }, 1200);
    },
    onError: (err) => {
      setActionFeedback({
        type: 'error',
        message: err.response?.data?.error?.message || 'Failed to update alert.',
      });
    },
  });

  // Calculate quick summary metrics from current dataset
  const openCount = alerts.filter((a) => a.status === 'OPEN').length;
  const highRiskCount = alerts.filter((a) => a.severity === 'HIGH' && a.status !== 'RESOLVED' && a.status !== 'DISMISSED').length;
  const underReviewCount = alerts.filter((a) => a.status === 'UNDER_REVIEW' || a.status === 'ACKNOWLEDGED').length;
  const resolvedCount = alerts.filter((a) => a.status === 'RESOLVED').length;

  const handleOpenActionModal = (alert, defaultStatus) => {
    setSelectedAlert(alert);
    setTargetStatus(defaultStatus || alert.status);
    setResolutionNotes(alert.resolutionNotes || '');
    setActionFeedback(null);
    setActionModalOpen(true);
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            HIGH RISK
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            MEDIUM RISK
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Info className="w-3 h-3 text-blue-600" />
            LOW RISK
          </span>
        );
    }
  };

  const columns = [
    {
      header: 'Employee',
      accessorKey: 'employee',
      render: (alert) => {
        const emp = alert.employee;
        const name = emp?.name || (emp ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() : 'Unknown Employee');
        return (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              {name.charAt(0) || 'E'}
            </div>
            <div>
              <div className="font-bold text-slate-900 hover:text-purple-600 transition cursor-pointer" onClick={() => navigate(`/attendance-alerts/${alert.id}`)}>
                {name}
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span>{emp?.employeeId || 'ID N/A'}</span>
                {emp?.department?.name && (
                  <>
                    <span>•</span>
                    <span className="font-medium text-slate-600">{emp.department.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Absence Trigger',
      accessorKey: 'missingDays',
      render: (alert) => (
        <div>
          <div className="flex items-center gap-1.5 font-extrabold text-rose-600 text-sm">
            <Clock className="w-3.5 h-3.5" />
            {alert.missingDays} scheduled days absent
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            Since {formatDate(alert.absenceStartDate)}
          </div>
        </div>
      ),
    },
    {
      header: '14-Day History',
      accessorKey: 'history',
      render: (alert) => {
        const history = alert.preAbsenceSummary;
        if (!history) return <span className="text-xs text-slate-400">No prior records</span>;
        return (
          <div>
            <div className="text-xs font-semibold text-slate-800">
              {history.totalWorkedHours?.toFixed(1) || 0} hrs worked
            </div>
            <div className="text-[11px] text-slate-500">
              Avg {history.averageDailyHours?.toFixed(1) || 0} hrs / scheduled day
            </div>
          </div>
        );
      },
    },
    {
      header: 'Severity',
      accessorKey: 'severity',
      render: (alert) => getSeverityBadge(alert.severity),
    },
    {
      header: 'Payroll Status',
      accessorKey: 'payrollRisk',
      render: (alert) => {
        if (alert.contract?.activePayruns?.length > 0) {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
              <Activity className="w-3 h-3 text-purple-600" />
              In Active Payrun
            </span>
          );
        }
        return <span className="text-xs text-slate-500">No open payrun</span>;
      },
    },
    {
      header: 'Status',
      accessorKey: 'status',
      render: (alert) => <StatusBadge status={alert.status} />,
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      render: (alert) => (
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate(`/attendance-alerts/${alert.id}`)}
            className="p-1.5 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
            title="View Full Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          {alert.status === 'OPEN' && (
            <button
              onClick={() => handleOpenActionModal(alert, 'UNDER_REVIEW')}
              className="px-2.5 py-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition"
            >
              Review
            </button>
          )}
          {alert.status === 'UNDER_REVIEW' && (
            <button
              onClick={() => handleOpenActionModal(alert, 'RESOLVED')}
              className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
            >
              Resolve
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Smart Attendance-to-Payroll Risk Alerts"
        subtitle="Proactively detect active employees absent >= 7 scheduled days without attendance or approved time off."
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200 shadow-2xs">
            <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
            Non-Punitive Payroll Guard
          </span>
        }
        actions={
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSettingsModalOpen(true)}
              className="btn-secondary flex items-center gap-2 text-sm font-semibold"
            >
              <Settings className="w-4 h-4 text-slate-500" />
              Threshold ({thresholdValue} Days)
            </button>
            <button
              onClick={() => scanMutation.mutate()}
              disabled={scanMutation.isPending}
              className="btn-primary flex items-center gap-2 text-sm font-semibold shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${scanMutation.isPending ? 'animate-spin' : ''}`} />
              {scanMutation.isPending ? 'Scanning Attendance...' : 'Scan Risks Now'}
            </button>
          </div>
        }
      />

      {/* Live Scan Notification / Toast */}
      {scanResult && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border ${
            scanResult.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          } animate-fadeIn`}
        >
          <div className="flex items-center gap-3">
            {scanResult.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{scanResult.message}</span>
          </div>
          <button
            onClick={() => setScanResult(null)}
            className="text-xs font-semibold hover:underline px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Critical Policy Notice */}
      <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 border border-purple-100 rounded-2xl p-4 flex items-start gap-3.5 shadow-2xs">
        <div className="p-2 bg-purple-600 text-white rounded-xl flex-shrink-0 shadow-sm">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-slate-900">Attendance Risk Protection Architecture</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Missing attendance flags a risk alert for HR/Payroll review, but <strong>NEVER</strong> automatically deduces salary or alters payslips. Off-days and approved leaves are reconciled with working schedules before generating alerts.
          </p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Open Alerts</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{openCount}</span>
            <span className="text-xs text-rose-600 font-semibold">Requires Action</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">High Risk</span>
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-rose-700">{highRiskCount}</span>
            <span className="text-xs text-slate-500 font-medium">&ge; 10 days absent</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Under Review</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{underReviewCount}</span>
            <span className="text-xs text-amber-600 font-semibold">HR Investigating</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Threshold</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Settings className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-700">{thresholdValue} Days</span>
            <span className="text-xs text-slate-500 font-medium">Scheduled Absence</span>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search employee or code..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="ACKNOWLEDGED">Acknowledged</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="RESOLVED">Resolved</option>
              <option value="DISMISSED">Dismissed</option>
            </select>

            {/* Severity Filter */}
            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition"
            >
              <option value="">All Severities</option>
              <option value="HIGH">High Risk (&ge;10 Days)</option>
              <option value="MEDIUM">Medium Risk (7-9 Days)</option>
              <option value="LOW">Low Risk</option>
            </select>

            {/* Department Filter */}
            <select
              value={departmentIdFilter}
              onChange={(e) => {
                setDepartmentIdFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={alerts}
        isLoading={isLoading || isRefetching}
        page={page}
        pageSize={pageSize}
        total={totalRecords}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        emptyMessage="No attendance risk alerts found. All employees are adhering to their working schedules or have valid time-off requests."
      />

      {/* Threshold Settings Modal */}
      <Modal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        title="Attendance Risk Alert Settings"
        subtitle="Configure the consecutive absence threshold for automatic risk alerts"
      >
        <div className="space-y-4">
          {settingsFeedback && (
            <div
              className={`p-3 rounded-xl text-xs font-medium ${
                settingsFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {settingsFeedback.message}
            </div>
          )}

          <FormField label="Consecutive Absence Threshold (Working Days)" required>
            <input
              type="number"
              min="1"
              max="30"
              value={thresholdValue}
              onChange={(e) => setThresholdValue(parseInt(e.target.value, 10) || 7)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
            />
          </FormField>

          <p className="text-xs text-slate-500">
            When an employee has no recorded check-ins for this number of scheduled working days (excluding weekends and approved leaves), an Attendance Risk Alert will be raised for payroll review.
          </p>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setSettingsModalOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => updateThresholdMutation.mutate(thresholdValue)}
              disabled={updateThresholdMutation.isPending}
              className="btn-primary text-xs"
            >
              {updateThresholdMutation.isPending ? 'Saving...' : 'Save Threshold'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Status Resolution Modal */}
      <Modal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        title={`Update Alert Status: ${selectedAlert?.employee?.name || 'Employee'}`}
        subtitle={`Absence started: ${formatDate(selectedAlert?.absenceStartDate)} (${selectedAlert?.missingDays} days)`}
      >
        <div className="space-y-4">
          {actionFeedback && (
            <div
              className={`p-3 rounded-xl text-xs font-medium ${
                actionFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {actionFeedback.message}
            </div>
          )}

          <FormField label="Target Status" required>
            <select
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
            >
              <option value="OPEN">OPEN (Pending Review)</option>
              <option value="ACKNOWLEDGED">ACKNOWLEDGED (Seen by HR)</option>
              <option value="UNDER_REVIEW">UNDER_REVIEW (Active Investigation)</option>
              <option value="RESOLVED">RESOLVED (Action Taken)</option>
              <option value="DISMISSED">DISMISSED (False Alarm / Justified)</option>
            </select>
          </FormField>

          <FormField label="Resolution Notes / HR Comments">
            <textarea
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="e.g. Contacted employee on medical leave. Retroactive time-off request submitted."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
            />
          </FormField>

          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-400">Quick Notes:</span>
            {[
              'Employee on authorized sick leave',
              'Attendance correction approved',
              'Employee resigned / absconded',
              'Contacted employee - returning soon',
            ].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setResolutionNotes(preset)}
                className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 hover:bg-purple-100 hover:text-purple-700 transition"
              >
                {preset}
              </button>
            ))}
          </div>

          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setActionModalOpen(false)}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() =>
                updateStatusMutation.mutate({
                  id: selectedAlert?.id,
                  status: targetStatus,
                  resolutionNotes,
                })
              }
              disabled={updateStatusMutation.isPending}
              className="btn-primary text-xs"
            >
              {updateStatusMutation.isPending ? 'Updating...' : 'Confirm Status Update'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
