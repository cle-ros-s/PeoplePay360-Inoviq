import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceAlertsApi } from '../../api/attendanceAlerts.api';
import { usePermissions } from '../../hooks/usePermissions';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import FormField from '../../components/common/FormField';
import {
  ArrowLeft,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Calendar,
  User,
  Building,
  Briefcase,
  DollarSign,
  Activity,
  CheckCircle2,
  AlertCircle,
  FileText,
  Info,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  Mail,
  Phone,
} from 'lucide-react';
import { formatDate, formatDateTime, formatHours, formatEnumLabel } from '../../utils/formatters';

export default function AttendanceAlertDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can, isEmployee } = usePermissions();

  const [status, setStatus] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  // Fetch Alert Detail
  const { data: alertResponse, isLoading, isError, refetch } = useQuery({
    queryKey: ['attendanceAlert', id],
    queryFn: async () => {
      const res = await attendanceAlertsApi.getAlertById(id);
      const data = res?.data || res;
      if (data) {
        setStatus(data.status);
        setResolutionNotes(data.resolutionNotes || '');
      }
      return data;
    },
    enabled: !!id,
  });

  const alert = alertResponse?.data || alertResponse;

  // Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: (updateData) => attendanceAlertsApi.updateAlertStatus(id, updateData),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['attendanceAlert', id] });
      queryClient.invalidateQueries({ queryKey: ['attendanceAlerts'] });
      queryClient.invalidateQueries({ queryKey: ['payrollDashboard'] });
      setFeedbackMessage({ type: 'success', text: 'Alert status and resolution notes updated successfully!' });
      setTimeout(() => setFeedbackMessage(null), 5000);
    },
    onError: (err) => {
      setFeedbackMessage({
        type: 'error',
        text: err.response?.data?.error?.message || 'Failed to update alert.',
      });
    },
  });

  if (isLoading) return <LoadingState message="Loading attendance alert investigation details..." />;
  if (isError || !alert) {
    return <ErrorState message="Could not load attendance risk alert details." onRetry={refetch} />;
  }

  const employee = alert.employee;
  const empName = employee?.name || (employee ? `${employee.firstName || ''} ${employee.lastName || ''}`.trim() : 'Unknown Employee');
  const historySummary = alert.preAbsenceSummary || {};
  const historyLogs = historySummary.historicalAttendance || [];
  const schedule = alert.schedule || alert.contract?.schedule;
  const activePayruns = alert.contract?.activePayruns || [];

  const handleSaveResolution = (e) => {
    e.preventDefault();
    updateStatusMutation.mutate({
      status,
      resolutionNotes,
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Navigation & Header */}
      <div>
        <button
          onClick={() => navigate('/attendance-alerts')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Attendance Alerts
        </button>

        <PageHeader
          title={`Attendance Risk Alert: ${empName}`}
          subtitle={`Triggered on ${formatDate(alert.detectedAt)} • ${alert.missingDays} scheduled working days absent`}
          badge={
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                  alert.severity === 'HIGH'
                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                    : alert.severity === 'MEDIUM'
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {alert.severity} SEVERITY
              </span>
              <StatusBadge status={alert.status} />
            </div>
          }
        />
      </div>

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span className="text-sm font-medium">{feedbackMessage.text}</span>
          </div>
          <button onClick={() => setFeedbackMessage(null)} className="text-xs font-semibold hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {/* Grid: Employee & Absence Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Employee Profile Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white text-xl font-black shadow-md">
              {empName.charAt(0) || 'E'}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{empName}</h3>
              <p className="text-xs text-slate-500">{employee?.employeeId || 'No ID'}</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                  {employee?.type || 'FULL_TIME'}
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {employee?.status || 'ACTIVE'}
                </span>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-2">
                <Building className="w-3.5 h-3.5 text-slate-400" />
                Department
              </span>
              <span className="font-semibold text-slate-900">{employee?.department?.name || 'Unassigned'}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-2">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                Position
              </span>
              <span className="font-semibold text-slate-900">{employee?.jobPosition || 'N/A'}</span>
            </div>

            <div className="flex items-center justify-between text-slate-600">
              <span className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                Schedule
              </span>
              <span className="font-semibold text-purple-700">{schedule?.name || 'Standard 40h (Mon-Fri)'}</span>
            </div>

            {employee?.workEmail && (
              <div className="flex items-center justify-between text-slate-600">
                <span className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Email
                </span>
                <span className="font-semibold text-slate-900">{employee.workEmail}</span>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              onClick={() => navigate(`/employees/${employee?.id}`)}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-50 hover:bg-purple-50 text-slate-700 hover:text-purple-700 text-xs font-bold rounded-xl border border-slate-200 hover:border-purple-200 transition"
            >
              <User className="w-3.5 h-3.5" />
              View Employee Profile
            </button>
          </div>
        </div>

        {/* Middle/Right: Absence Risk & Payroll Context */}
        <div className="lg:col-span-2 space-y-6">
          {/* Absence Diagnostic Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600" />
                Absence & Schedule Diagnostic
              </h3>
              <span className="text-xs font-medium text-slate-500">
                Detected: {formatDate(alert.detectedAt)}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-rose-50 rounded-xl border border-rose-100">
                <div className="text-[11px] font-bold text-rose-700 uppercase tracking-wider">
                  Consecutive Absent Days
                </div>
                <div className="text-2xl font-black text-rose-800 mt-1">
                  {alert.missingDays} Days
                </div>
                <div className="text-[11px] text-rose-600 mt-0.5">
                  Scheduled working days only
                </div>
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
                <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">
                  Absence Start Date
                </div>
                <div className="text-lg font-black text-amber-900 mt-1">
                  {formatDate(alert.absenceStartDate)}
                </div>
                <div className="text-[11px] text-amber-700 mt-0.5">
                  First missed scheduled shift
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                <div className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">
                  Approved Leave Status
                </div>
                <div className="text-lg font-black text-purple-900 mt-1">
                  None Detected
                </div>
                <div className="text-[11px] text-purple-700 mt-0.5">
                  No overlapping time-off request
                </div>
              </div>
            </div>

            {/* Non-punitive Policy Banner */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5 text-xs text-slate-600">
              <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
              <span>
                <strong>HR Review Notice:</strong> System policy ensures missing attendance does <em>not</em> trigger automatic salary deductions or unapproved contract changes. Review the case with the employee or supervisor and update the resolution status accordingly.
              </span>
            </div>
          </div>

          {/* Connected Payroll Impact */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-600" />
              Payroll & Payrun Connection
            </h3>

            {activePayruns.length > 0 ? (
              <div className="space-y-2">
                <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-purple-700 flex-shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-purple-900">
                        Active Payrun in Progress: {activePayruns[0].name}
                      </div>
                      <div className="text-[11px] text-purple-700">
                        Period: {formatDate(activePayruns[0].periodStart)} – {formatDate(activePayruns[0].periodEnd)} ({activePayruns[0].status})
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/payroll/payruns/${activePayruns[0].id}`)}
                    className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 transition"
                  >
                    Open Payrun
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                This employee is not currently in any unvalidated payrun batch. Next payroll cycle will evaluate this period.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 14-Day Pre-Absence Historical Breakdown */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              14-Day Pre-Absence Attendance History
            </h3>
            <p className="text-xs text-slate-500">
              Historical working pattern across the 14 days prior to {formatDate(alert.absenceStartDate)}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-purple-50/80 px-4 py-2 rounded-xl border border-purple-100">
            <div>
              <span className="text-[10px] uppercase font-bold text-purple-700 tracking-wider">Total Worked</span>
              <div className="text-sm font-black text-purple-900">
                {historySummary.totalWorkedHours?.toFixed(1) || 0} Hours
              </div>
            </div>
            <div className="w-px h-7 bg-purple-200" />
            <div>
              <span className="text-[10px] uppercase font-bold text-purple-700 tracking-wider">Daily Average</span>
              <div className="text-sm font-black text-purple-900">
                {historySummary.averageDailyHours?.toFixed(1) || 0} Hrs/Day
              </div>
            </div>
          </div>
        </div>

        {/* Table of 14 Days */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Day of Week</th>
                <th className="py-2.5 px-4">Working Day</th>
                <th className="py-2.5 px-4">Check In</th>
                <th className="py-2.5 px-4">Check Out</th>
                <th className="py-2.5 px-4">Worked Hours</th>
                <th className="py-2.5 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {historyLogs.length > 0 ? (
                historyLogs.map((log, idx) => (
                  <tr key={idx} className={log.isWorkingDay ? 'hover:bg-slate-50/50' : 'bg-slate-50/30 text-slate-400'}>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{formatDate(log.date)}</td>
                    <td className="py-2.5 px-4 font-medium">{log.dayName}</td>
                    <td className="py-2.5 px-4">
                      {log.isWorkingDay ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          Scheduled
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500">
                          Off Day
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 font-mono">{log.checkIn ? formatDateTime(log.checkIn) : '—'}</td>
                    <td className="py-2.5 px-4 font-mono">{log.checkOut ? formatDateTime(log.checkOut) : '—'}</td>
                    <td className="py-2.5 px-4 font-bold text-slate-900">{formatHours(log.workedHours)}</td>
                    <td className="py-2.5 px-4">
                      {log.workedHours > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          PRESENT
                        </span>
                      ) : log.isWorkingDay ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          NO RECORD
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600">
                          REST DAY
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-400">
                    No historical attendance records available in the 14-day pre-absence window.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* HR Action & Resolution Panel */}
      {can('MANAGE_ATTENDANCE_ALERTS') && (
        <form onSubmit={handleSaveResolution} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              HR Resolution & Case Investigation
            </h3>
            <span className="text-xs text-slate-500">
              Last updated by: {alert.resolvedBy?.name || 'System'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Alert Workflow Status" required>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
              >
                <option value="OPEN">OPEN (Pending Review)</option>
                <option value="ACKNOWLEDGED">ACKNOWLEDGED (Understood by HR)</option>
                <option value="UNDER_REVIEW">UNDER_REVIEW (Active Case Investigation)</option>
                <option value="RESOLVED">RESOLVED (Action Taken & Settled)</option>
                <option value="DISMISSED">DISMISSED (False Positive / Justified)</option>
              </select>
            </FormField>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Preset Action Templates</label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Employee contacted — on approved sick leave',
                  'Attendance punch correction submitted and approved',
                  'Employee absconded / under termination review',
                  'Work from home unrecorded — regularized',
                ].map((note) => (
                  <button
                    key={note}
                    type="button"
                    onClick={() => setResolutionNotes(note)}
                    className="text-[10px] px-2.5 py-1 bg-slate-100 hover:bg-purple-100 text-slate-700 hover:text-purple-700 rounded-lg transition"
                  >
                    {note}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <FormField label="Investigation Notes / Resolution Details">
            <textarea
              rows={3}
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Record details of conversation with employee, medical documentation, or supervisor confirmation..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate('/attendance-alerts')}
              className="btn-secondary text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateStatusMutation.isPending}
              className="btn-primary text-xs flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {updateStatusMutation.isPending ? 'Saving Resolution...' : 'Save Resolution'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
