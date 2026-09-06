import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payslipsApi } from '../../api/payslips.api';
import { usePermissions } from '../../hooks/usePermissions';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import Modal from '../../components/common/Modal';
import PayslipPdfButton from './PayslipPdfButton';
import { formatDate, formatCurrency, formatEnumLabel } from '../../utils/formatters';
import {
  ArrowLeft,
  Mail,
  Building,
  Briefcase,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Send,
  ExternalLink,
  Copy,
  Check,
  Download,
  Loader2,
  Settings,
  Key,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Clock,
  Palmtree,
  IndianRupee,
  ShieldAlert,
  FileText,
  Activity,
} from 'lucide-react';

export default function PayslipDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = usePermissions();

  const [emailStatus, setEmailStatus] = useState(null);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAttendanceDetails, setShowAttendanceDetails] = useState(false);

  // SMTP Configuration State
  const [showSmtpConfig, setShowSmtpConfig] = useState(false);
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');
  const [smtpStatus, setSmtpStatus] = useState(null);
  const [testingSmtp, setTestingSmtp] = useState(false);

  const { data: payslip, isLoading, isError, refetch } = useQuery({
    queryKey: ['payslip', id],
    queryFn: () => payslipsApi.getPayslipById(id),
    enabled: !!id,
  });

  // Fetch current SMTP configuration
  useEffect(() => {
    if (emailModalOpen) {
      payslipsApi.getSmtpConfig()
        .then((res) => {
          if (res?.data) {
            setSmtpUser(res.data.user || '');
          }
        })
        .catch(() => {});
    }
  }, [emailModalOpen]);

  const sendEmailMutation = useMutation({
    mutationFn: (emailToUse) => payslipsApi.sendPayslipEmail(id, emailToUse || recipientEmail),
    onSuccess: (res) => {
      setEmailModalOpen(false);
      setEmailStatus({
        type: 'success',
        text: res?.message || `Payslip email dispatched successfully to ${recipientEmail || payslip?.employee?.email || 'employee'}!`,
        previewUrl: res?.previewUrl || null,
      });
    },
    onError: (err) => {
      setEmailStatus({
        type: 'error',
        text: err.response?.data?.error?.message || err.message || 'Failed to send email. Please use Gmail Web option or check SMTP settings.',
      });
    },
  });

  const handleTestAndSaveSmtp = async () => {
    if (!smtpUser || !smtpPass) {
      setSmtpStatus({ type: 'error', text: 'Please enter both Sender Email and 16-character App Password.' });
      return;
    }
    setTestingSmtp(true);
    setSmtpStatus(null);
    try {
      const config = { user: smtpUser, pass: smtpPass, host: 'smtp.gmail.com', port: 587 };
      await payslipsApi.testSmtpConnection(config);
      await payslipsApi.updateSmtpConfig(config);
      setSmtpStatus({ type: 'success', text: '✓ Google App Password verified & connected successfully!' });
    } catch (err) {
      setSmtpStatus({
        type: 'error',
        text: err.response?.data?.error?.message || err.message || 'Verification failed. Please verify 2-Step Verification & App Password.',
      });
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleOpenEmailModal = () => {
    setRecipientEmail(payslip?.employee?.email || '');
    setEmailModalOpen(true);
    setCopied(false);
    setSmtpStatus(null);
  };

  const handleCopySummary = () => {
    const empName = payslip?.employee?.name || `${payslip?.employee?.firstName || ''} ${payslip?.employee?.lastName || ''}`.trim() || 'Employee';
    const periodText = `${formatDate(payslip?.periodStart)} - ${formatDate(payslip?.periodEnd)}`;
    const text =
      `Payslip Summary for ${empName} (${periodText})\n` +
      `Gross Salary: ${formatCurrency(payslip?.gross)}\n` +
      `Net Payable: ${formatCurrency(payslip?.net)}\n` +
      `Worked Days: ${payslip?.workedDays || 0} days\n` +
      `Status: ${payslip?.status}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (isLoading) return <LoadingState message="Loading payslip breakdown..." />;
  if (isError || !payslip) return <ErrorState message="Unable to load payslip." onRetry={refetch} />;

  const lines = (payslip.lines || []).sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  const empDisplayName =
    payslip.employee?.name ||
    `${payslip.employee?.firstName || ''} ${payslip.employee?.lastName || ''}`.trim() ||
    'Employee';

  const periodText = `${formatDate(payslip.periodStart)} - ${formatDate(payslip.periodEnd)}`;
  const targetEmail = recipientEmail || payslip?.employee?.email || '';

  // Pre-computed URLs for instant direct link opening (immune to popup blockers)
  const emailSubject = `Your Payslip for ${periodText} — PeoplePay360`;
  const emailBody =
    `Hello ${empDisplayName},\n\n` +
    `Please find your salary breakdown for the pay period ${periodText}:\n\n` +
    `• Gross Salary: ${formatCurrency(payslip.gross)}\n` +
    `• Net Payable: ${formatCurrency(payslip.net)}\n` +
    `• Worked Days: ${payslip.workedDays || 0} days\n` +
    `• Status: ${payslip.status}\n\n` +
    `The detailed PDF payslip document has been downloaded and can be attached to this email.\n\n` +
    `Best regards,\nPeoplePay360 Payroll Operations`;

  const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(targetEmail)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
  const mailtoUrl = `mailto:${targetEmail}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Payslip — ${empDisplayName}`}
        description={`Period: ${formatDate(payslip.periodStart)} to ${formatDate(payslip.periodEnd)}`}
        actions={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/payroll/payslips')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 shadow-xs transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <PayslipPdfButton payslipId={payslip.id} />

            {can('SEND_PAYSLIPS') && (
              <button
                type="button"
                onClick={handleOpenEmailModal}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white rounded-xl shadow-md transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, #714B67 0%, #017E84 100%)',
                  boxShadow: '0 4px 14px rgba(113,75,103,0.30)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(113,75,103,0.40)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(113,75,103,0.30)';
                }}
              >
                <Mail className="w-4 h-4" />
                Email Payslip
              </button>
            )}
          </div>
        }
      />

      {emailStatus && (
        <div
          className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-xs font-semibold shadow-xs animate-fadeIn ${
            emailStatus.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {emailStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{emailStatus.text}</span>
          </div>

          <div className="flex items-center gap-3">
            {emailStatus.previewUrl && (
              <a
                href={emailStatus.previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-emerald-700 underline font-bold hover:text-emerald-900"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                View Sent Email &amp; PDF Online
              </a>
            )}
            <button
              onClick={() => setEmailStatus(null)}
              className="text-gray-400 hover:text-gray-600 underline text-[11px]"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Employee & Payrun Information Card */}
      <div className="glass-card p-6 rounded-2xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: '#9CA3AF' }}>
            Employee
          </span>
          <div className="font-extrabold text-base" style={{ color: '#212121' }}>
            {empDisplayName}
          </div>
          <div className="text-xs flex items-center gap-1.5 mt-0.5" style={{ color: '#6B7280' }}>
            <Briefcase className="w-3.5 h-3.5" style={{ color: '#714B67' }} />
            {payslip.employee?.jobPosition || 'Staff Member'}
          </div>
          {payslip.employee?.email && (
            <div className="text-xs flex items-center gap-1.5 mt-0.5 font-mono" style={{ color: '#017E84' }}>
              <Mail className="w-3.5 h-3.5" />
              {payslip.employee?.email}
            </div>
          )}
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: '#9CA3AF' }}>
            Payrun Batch
          </span>
          <div className="font-bold text-sm" style={{ color: '#212121' }}>
            {payslip.payrun?.name || 'Standard Payrun'}
          </div>
          <div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
            {payslip.salaryStructure?.name || 'Regular Salary Structure'}
          </div>
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: '#9CA3AF' }}>
            Worked Days
          </span>
          <div className="font-extrabold text-base" style={{ color: '#212121' }}>
            {payslip.workedDays || 0} days
          </div>
          <div className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
            Contract Wage: {formatCurrency(payslip.contract?.wage)}
          </div>
        </div>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider block mb-1" style={{ color: '#9CA3AF' }}>
            Payslip Status
          </span>
          <div className="mt-1">
            <StatusBadge status={payslip.status} />
          </div>
        </div>
      </div>

      {/* Attendance Review Required Warning Banner */}
      {payslip.attendanceRisk?.hasRisk && (
        <div className="bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-rose-500/10 border border-rose-300/80 rounded-2xl p-4.5 shadow-2xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-rose-600 text-white rounded-xl flex-shrink-0 shadow-sm">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900">
                    ⚠️ Attendance Review Required
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-200 text-rose-900">
                    {payslip.attendanceRisk.consecutiveDaysAbsent} Days Unrecorded
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  {payslip.attendanceRisk.message || 'This employee has an unresolved attendance issue for this payroll period.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate(payslip.attendanceRisk.alertId ? `/attendance-alerts/${payslip.attendanceRisk.alertId}` : '/attendance-alerts')}
              className="px-4 py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white rounded-xl text-xs font-bold shadow-2xs flex items-center justify-center gap-1.5 transition self-start md:self-auto shrink-0 cursor-pointer"
            >
              <span>View Attendance Risk</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Payroll & Attendance Summary */}
      <div className="glass-card p-6 rounded-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200/80">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-purple-600" />
              Payroll &amp; Attendance Summary
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Consolidated working schedule, attendance logs, approved leaves, and salary totals for this pay period.
            </p>
          </div>
        </div>

        {/* 8 Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Total Working Days */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Total Working Days</span>
              <Calendar className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {payslip.attendanceSummary?.totalWorkingDays ?? payslip.totalDays ?? 0}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Scheduled shift days</div>
          </div>

          {/* 2. Days Worked */}
          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Days Worked</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-800 mt-1">
              {payslip.attendanceSummary?.daysWorked ?? payslip.workedDays ?? 0}
            </div>
            <div className="text-[11px] text-emerald-600 mt-0.5">Valid attendance punches</div>
          </div>

          {/* 3. Leave Days */}
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">Leave Days</span>
              <Palmtree className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-800 mt-1">
              {payslip.attendanceSummary?.leaveDays ?? 0}
            </div>
            <div className="text-[11px] text-amber-600 mt-0.5">Approved time off</div>
          </div>

          {/* 4. Absent Days */}
          <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700">Absent Days</span>
              <AlertCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-800 mt-1">
              {payslip.attendanceSummary?.absentDays ?? 0}
            </div>
            <div className="text-[11px] text-rose-600 mt-0.5">Unrecorded schedule days</div>
          </div>

          {/* 5. Total Hours Worked */}
          <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">Total Hours Worked</span>
              <Clock className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-indigo-800 mt-1">
              {payslip.attendanceSummary?.totalHoursWorked || (Math.round(((payslip.attendanceSummary?.daysWorked || payslip.workedDays || 0) * 8) * 100) / 100)} hrs
            </div>
            <div className="text-[11px] text-indigo-600 mt-0.5">Actual punch duration</div>
          </div>

          {/* 6. Total Earnings */}
          <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Total Earnings</span>
              <IndianRupee className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-xl font-black text-purple-900 mt-1 truncate" title={formatCurrency(payslip.payrollSummary?.totalEarnings || payslip.gross)}>
              {formatCurrency(payslip.payrollSummary?.totalEarnings || payslip.gross)}
            </div>
            <div className="text-[11px] text-purple-600 mt-0.5">Basic + Allowances</div>
          </div>

          {/* 7. Total Deductions */}
          <div className="p-4 rounded-xl bg-red-50/60 border border-red-200/80 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-700">Total Deductions</span>
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <div className="text-xl font-black text-red-900 mt-1 truncate" title={formatCurrency(payslip.payrollSummary?.totalDeductions || payslip.totalDeductions || 0)}>
              {formatCurrency(payslip.payrollSummary?.totalDeductions || payslip.totalDeductions || 0)}
            </div>
            <div className="text-[11px] text-red-600 mt-0.5">PF, Tax &amp; Statutory</div>
          </div>

          {/* 8. Net Salary */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-100">Final Net Salary</span>
              <IndianRupee className="w-4 h-4 text-emerald-200" />
            </div>
            <div className="text-xl font-black text-white mt-1 truncate" title={formatCurrency(payslip.payrollSummary?.netSalary || payslip.net)}>
              {formatCurrency(payslip.payrollSummary?.netSalary || payslip.net)}
            </div>
            <div className="text-[11px] text-emerald-100 mt-0.5">Final Net Payable</div>
          </div>
        </div>

        {/* Time Off Summary Breakdown & View Attendance Toggle */}
        <div className="p-4.5 bg-slate-50/70 border border-slate-200/70 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Palmtree className="w-3.5 h-3.5 text-amber-600" />
              Time Off Summary
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                Annual Leave: <strong className="ml-1 text-slate-900">{payslip.leaveSummary?.annualLeave ?? 0} days</strong>
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                Sick Leave: <strong className="ml-1 text-slate-900">{payslip.leaveSummary?.sickLeave ?? 0} days</strong>
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-white border border-slate-200 text-slate-700 shadow-2xs">
                Unpaid Leave: <strong className="ml-1 text-slate-900">{payslip.leaveSummary?.unpaidLeave ?? 0} days</strong>
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100/80 border border-amber-200 text-amber-900 shadow-2xs">
                Total Leave: <strong className="ml-1">{payslip.leaveSummary?.totalLeave ?? 0} days</strong>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAttendanceDetails(!showAttendanceDetails)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition shadow-2xs shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{showAttendanceDetails ? 'Hide Attendance Details' : 'View Attendance Details'}</span>
            {showAttendanceDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Expandable Attendance Details Table */}
        {showAttendanceDetails && (
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs animate-fadeIn">
            <div className="p-3.5 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Daily Attendance &amp; Shift Logs ({payslip.attendanceDetails?.length || 0} Days)
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                Period: {formatDate(payslip.periodStart)} – {formatDate(payslip.periodEnd)}
              </span>
            </div>
            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="px-4 py-2.5">Date</th>
                    <th className="px-4 py-2.5">Day</th>
                    <th className="px-4 py-2.5">Check In</th>
                    <th className="px-4 py-2.5">Check Out</th>
                    <th className="px-4 py-2.5">Total Hours</th>
                    <th className="px-4 py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {payslip.attendanceDetails?.map((d, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-2 font-medium">{formatDate(d.date)}</td>
                      <td className="px-4 py-2 text-slate-500">{d.dayName}</td>
                      <td className="px-4 py-2 font-mono text-slate-600">{d.checkIn || '--'}</td>
                      <td className="px-4 py-2 font-mono text-slate-600">{d.checkOut || '--'}</td>
                      <td className="px-4 py-2 font-bold">{d.workedHours > 0 ? `${d.workedHours} hrs` : '0 hrs'}</td>
                      <td className="px-4 py-2 text-right">
                        {d.status === 'PRESENT' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Present
                          </span>
                        )}
                        {d.status === 'LATE' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                            Late
                          </span>
                        )}
                        {d.status === 'LEAVE' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200" title={d.leaveType}>
                            Leave: {d.leaveType || 'Approved'}
                          </span>
                        )}
                        {d.status === 'ABSENT' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                            Absent
                          </span>
                        )}
                        {d.status === 'REST_DAY' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-500">
                            Rest Day
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Salary Computation Lines Table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div
          className="p-5 flex items-center justify-between border-b"
          style={{ borderColor: 'rgba(113,75,103,0.10)', background: 'rgba(113,75,103,0.02)' }}
        >
          <div>
            <h3 className="text-base font-extrabold" style={{ color: '#212121' }}>
              Salary Computation Breakdown
            </h3>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
              Calculated rule lines ordered by sequence execution.
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold block" style={{ color: '#9CA3AF' }}>
              Final Net Payable:
            </span>
            <span className="text-2xl font-black text-emerald-700">
              {formatCurrency(payslip.net)}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr
                className="text-xs font-bold uppercase tracking-wider border-b"
                style={{
                  background: 'rgba(1,126,132,0.04)',
                  borderColor: 'rgba(113,75,103,0.08)',
                  color: '#6B7280',
                }}
              >
                <th className="px-6 py-3.5">Seq</th>
                <th className="px-6 py-3.5">Rule Name</th>
                <th className="px-6 py-3.5">Code</th>
                <th className="px-6 py-3.5">Category</th>
                <th className="px-6 py-3.5 text-right">Computed Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-800">
              {lines.map((line) => (
                <tr
                  key={line.id}
                  className={`transition-colors ${
                    line.category === 'NET'
                      ? 'bg-emerald-50/60 font-black text-emerald-900'
                      : line.category === 'GROSS'
                      ? 'bg-purple-50/40 font-bold'
                      : 'hover:bg-slate-50/60'
                  }`}
                >
                  <td className="px-6 py-3.5 text-xs text-gray-400 font-bold">{line.sequence}</td>
                  <td className="px-6 py-3.5 font-semibold" style={{ color: '#212121' }}>
                    {line.name}
                  </td>
                  <td className="px-6 py-3.5 font-mono text-xs font-bold" style={{ color: '#714B67' }}>
                    {line.code}
                  </td>
                  <td className="px-6 py-3.5">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full inline-block"
                      style={{
                        background:
                          line.category === 'NET'
                            ? 'rgba(16,185,129,0.15)'
                            : line.category === 'ALLOWANCE'
                            ? 'rgba(1,126,132,0.12)'
                            : line.category === 'DEDUCTION'
                            ? 'rgba(239,68,68,0.10)'
                            : 'rgba(113,75,103,0.10)',
                        color:
                          line.category === 'NET'
                            ? '#059669'
                            : line.category === 'ALLOWANCE'
                            ? '#017E84'
                            : line.category === 'DEDUCTION'
                            ? '#DC2626'
                            : '#714B67',
                      }}
                    >
                      {formatEnumLabel(line.category)}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right font-extrabold" style={{ color: '#212121' }}>
                    {formatCurrency(line.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email Payslip Options Modal */}
      <Modal
        isOpen={emailModalOpen}
        onClose={() => setEmailModalOpen(false)}
        title="Email Payslip & PDF Statement"
        description={`Send digital payslip to ${empDisplayName} for period ${periodText}.`}
      >
        <div className="space-y-4 pt-2">
          {/* Recipient Email Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-1.5" style={{ color: '#212121' }}>
              Recipient Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="employee@company.com"
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-300 focus:border-[#714B67] focus:ring-2 focus:ring-[#714B67]/20 outline-none transition-all"
              />
            </div>
            <p className="text-[11px] mt-1 text-gray-500">
              Type or confirm the destination email address for this payslip.
            </p>
          </div>

          {/* Payslip Summary Preview */}
          <div
            className="p-4 rounded-xl space-y-1.5 text-xs"
            style={{
              background: 'linear-gradient(135deg, rgba(113,75,103,0.06) 0%, rgba(1,126,132,0.05) 100%)',
              border: '1px solid rgba(113,75,103,0.12)',
            }}
          >
            <div className="flex justify-between">
              <span className="text-gray-500">Employee:</span>
              <span className="font-bold text-gray-900">{empDisplayName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Gross Salary:</span>
              <span className="font-bold text-gray-900">{formatCurrency(payslip.gross)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Net Payable:</span>
              <span className="font-extrabold text-emerald-700 text-sm">{formatCurrency(payslip.net)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Attachment:</span>
              <span className="font-mono text-purple-800 font-semibold">payslip-{payslip.id.slice(0, 8)}.pdf</span>
            </div>
          </div>

          {/* Action Options */}
          <div className="space-y-2.5 pt-1">
            {/* Primary Option: Open Gmail Web Composer (Direct Link - Never Blocked) */}
            <a
              href={gmailWebUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                payslipsApi.downloadPayslipPdf(payslip.id);
                setEmailModalOpen(false);
                setEmailStatus({
                  type: 'success',
                  text: 'Opened Gmail Web Composer in a new tab & downloaded PDF attachment!',
                });
              }}
              className="w-full py-3 px-4 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all duration-200 cursor-pointer text-center"
              style={{
                background: 'linear-gradient(135deg, #714B67 0%, #017E84 100%)',
                boxShadow: '0 4px 14px rgba(113,75,103,0.30)',
              }}
            >
              <ExternalLink className="w-4 h-4" />
              <span>Compose in Gmail Web &amp; Download PDF</span>
            </a>

            {/* Secondary Option: Direct Server Email Dispatch */}
            <button
              type="button"
              onClick={() => sendEmailMutation.mutate(recipientEmail)}
              disabled={sendEmailMutation.isPending || !recipientEmail}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 transition-all hover:bg-slate-50 cursor-pointer disabled:opacity-50"
              style={{
                color: '#714B67',
                borderColor: 'rgba(113,75,103,0.30)',
                background: 'rgba(113,75,103,0.04)',
              }}
            >
              {sendEmailMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#714B67]" />
                  <span>Dispatching Email...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Direct Server Email</span>
                </>
              )}
            </button>

            {/* Tertiary Option: Open in Desktop Mail (mailto) */}
            <a
              href={mailtoUrl}
              onClick={() => {
                payslipsApi.downloadPayslipPdf(payslip.id);
                setEmailModalOpen(false);
                setEmailStatus({
                  type: 'success',
                  text: 'Opened Desktop Mail Client & downloaded PDF payslip!',
                });
              }}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 transition-all hover:bg-teal-50 cursor-pointer text-center"
              style={{
                color: '#017E84',
                borderColor: 'rgba(1,126,132,0.30)',
                background: 'rgba(1,126,132,0.04)',
              }}
            >
              <Mail className="w-4 h-4" />
              <span>Open in Desktop Mail (Outlook / Apple Mail)</span>
            </a>

            {/* Quaternary: Download PDF & Copy */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => payslipsApi.downloadPayslipPdf(payslip.id)}
                className="py-2 px-3 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>

              <button
                type="button"
                onClick={handleCopySummary}
                className="py-2 px-3 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
              </button>
            </div>
          </div>

          {/* SMTP Live Configuration Accordion */}
          <div className="border-t border-gray-200 pt-3">
            <button
              type="button"
              onClick={() => setShowSmtpConfig(!showSmtpConfig)}
              className="flex items-center justify-between w-full text-xs font-bold text-gray-600 hover:text-gray-900 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5 text-[#714B67]" />
                ⚙️ SMTP Server Credentials (Google App Password)
              </span>
              {showSmtpConfig ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showSmtpConfig && (
              <div className="mt-3 p-3.5 rounded-xl bg-gray-50 border border-gray-200 space-y-3 text-xs">
                <p className="text-gray-600">
                  To send emails directly from your Gmail account into real inboxes, create a 16-character{' '}
                  <a
                    href="https://myaccount.google.com/apppasswords"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#714B67] underline font-bold"
                  >
                    Google App Password
                  </a>{' '}
                  and enter it below:
                </p>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-600 mb-1">
                    Sender Gmail Account
                  </label>
                  <input
                    type="email"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    placeholder="your-email@gmail.com"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:border-[#714B67] outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-600 mb-1">
                    Google 16-character App Password
                  </label>
                  <div className="relative">
                    <Key className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={smtpPass}
                      onChange={(e) => setSmtpPass(e.target.value)}
                      placeholder="xxxx xxxx xxxx xxxx"
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-300 focus:border-[#714B67] outline-none font-mono"
                    />
                  </div>
                </div>

                {smtpStatus && (
                  <div
                    className={`p-2 rounded-lg text-[11px] font-medium ${
                      smtpStatus.type === 'success' ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'
                    }`}
                  >
                    {smtpStatus.text}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleTestAndSaveSmtp}
                  disabled={testingSmtp}
                  className="w-full py-2 px-3 rounded-lg text-white font-bold bg-[#714B67] hover:bg-[#5a3a52] flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                >
                  {testingSmtp ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Verifying Google Password...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verify &amp; Save Credentials</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
