import React, { useState } from 'react';
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

  const { data: payslip, isLoading, isError, refetch } = useQuery({
    queryKey: ['payslip', id],
    queryFn: () => payslipsApi.getPayslipById(id),
    enabled: !!id,
  });

  const sendEmailMutation = useMutation({
    mutationFn: (emailToUse) => payslipsApi.sendPayslipEmail(id, emailToUse || recipientEmail),
    onSuccess: (res) => {
      setEmailModalOpen(false);
      setEmailStatus({
        type: 'success',
        text: res?.message || `Payslip email sent successfully to ${recipientEmail || payslip?.employee?.email || 'employee'}!`,
      });
    },
    onError: (err) => {
      setEmailStatus({
        type: 'error',
        text: err.response?.data?.error?.message || err.message || 'Failed to send email. Please try downloading or using the email client link.',
      });
    },
  });

  const handleOpenEmailModal = () => {
    setRecipientEmail(payslip?.employee?.email || '');
    setEmailModalOpen(true);
    setCopied(false);
  };

  const handleOpenMailto = () => {
    const empName = payslip?.employee?.name || `${payslip?.employee?.firstName || ''} ${payslip?.employee?.lastName || ''}`.trim() || 'Employee';
    const periodText = `${formatDate(payslip?.periodStart)} - ${formatDate(payslip?.periodEnd)}`;
    const subject = encodeURIComponent(`Your Payslip for ${periodText} — PeoplePay360`);
    const body = encodeURIComponent(
      `Hello ${empName},\n\nPlease find your payslip details for the pay period ${periodText}:\n\n` +
      `• Gross Salary: ${formatCurrency(payslip?.gross)}\n` +
      `• Net Payable: ${formatCurrency(payslip?.net)}\n` +
      `• Worked Days: ${payslip?.workedDays || 0} days\n` +
      `• Status: ${payslip?.status}\n\n` +
      `The detailed PDF payslip has been downloaded and can be attached to this message.\n\n` +
      `Best regards,\nPayroll Operations Team`
    );

    // Trigger PDF download in background
    try {
      const pdfUrl = payslipsApi.getPayslipPdfUrl(payslip.id);
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `payslip-${payslip.id}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {}

    // Open user's default email composer
    const target = recipientEmail || payslip?.employee?.email || '';
    window.location.href = `mailto:${target}?subject=${subject}&body=${body}`;
    setEmailModalOpen(false);
    setEmailStatus({
      type: 'success',
      text: 'Opened email composer with prefilled summary and initiated PDF download!',
    });
  };

  const handleOpenGmailWeb = () => {
    const empName = payslip?.employee?.name || `${payslip?.employee?.firstName || ''} ${payslip?.employee?.lastName || ''}`.trim() || 'Employee';
    const periodText = `${formatDate(payslip?.periodStart)} - ${formatDate(payslip?.periodEnd)}`;
    const subject = `Your Payslip for ${periodText} — PeoplePay360`;
    const body =
      `Hello ${empName},\n\n` +
      `Please find attached your payslip breakdown for the period ${periodText}:\n\n` +
      `• Gross Salary: ${formatCurrency(payslip?.gross)}\n` +
      `• Net Payable: ${formatCurrency(payslip?.net)}\n` +
      `• Worked Days: ${payslip?.workedDays || 0} days\n` +
      `• Status: ${payslip?.status}\n\n` +
      `The detailed PDF payslip document has been downloaded and can be attached to this email.\n\n` +
      `Best regards,\nPayroll Operations Team`;

    // Trigger PDF download in background
    try {
      const pdfUrl = payslipsApi.getPayslipPdfUrl(payslip.id);
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `payslip-${payslip.id}.pdf`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {}

    // Open Gmail web composer
    const target = recipientEmail || payslip?.employee?.email || '';
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(target)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank', 'noopener,noreferrer');
    setEmailModalOpen(false);
    setEmailStatus({
      type: 'success',
      text: 'Opened Gmail Web Composer with pre-filled details & downloaded PDF payslip!',
    });
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
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold shadow-xs animate-fadeIn ${
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
          <button
            onClick={() => setEmailStatus(null)}
            className="text-gray-400 hover:text-gray-600 ml-4 underline text-[11px]"
          >
            Dismiss
          </button>
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
        description={`Send digital payslip to ${empDisplayName} for period ${formatDate(payslip.periodStart)} - ${formatDate(payslip.periodEnd)}.`}
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
              Defaults to employee's registered profile email. You can customize the address above.
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
          <div className="space-y-2.5 pt-2">
            {/* Primary Option: Compose in Gmail Web (Opens browser Gmail + Downloads PDF) */}
            <button
              type="button"
              onClick={handleOpenGmailWeb}
              className="w-full py-3 px-4 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md transition-all duration-200 cursor-pointer"
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
              <ExternalLink className="w-4 h-4" />
              <span>Compose in Gmail Web &amp; Download PDF</span>
            </button>

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

            {/* Tertiary Option: Open in Native Mail App (mailto) */}
            <button
              type="button"
              onClick={handleOpenMailto}
              className="w-full py-2.5 px-4 rounded-xl text-sm font-bold border flex items-center justify-center gap-2 transition-all hover:bg-teal-50 cursor-pointer"
              style={{
                color: '#017E84',
                borderColor: 'rgba(1,126,132,0.30)',
                background: 'rgba(1,126,132,0.04)',
              }}
            >
              <Mail className="w-4 h-4" />
              <span>Open in Desktop Mail (Outlook / Apple Mail)</span>
            </button>

            {/* Quaternary: Copy summary */}
            <button
              type="button"
              onClick={handleCopySummary}
              className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Summary Copied to Clipboard!' : 'Copy Summary Text'}</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
