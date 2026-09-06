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
