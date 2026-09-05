import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrunsApi } from '../../api/payruns.api';
import { usePermissions } from '../../hooks/usePermissions';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import { PayrunStatus, WarningSeverity } from '../../utils/constants';
import { formatDate, formatCurrency, formatEnumLabel } from '../../utils/formatters';
import { Play, CheckCircle2, DollarSign, Mail, AlertTriangle, ArrowLeft, Eye, ShieldAlert } from 'lucide-react';

export default function PayrunProcessingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = usePermissions();

  const [feedbackMessage, setFeedbackMessage] = useState(null);

  // Fetch payrun details
  const { data: payrun, isLoading, isError, refetch } = useQuery({
    queryKey: ['payrun', id],
    queryFn: () => payrunsApi.getPayrunById(id),
    enabled: !!id,
  });

  // Compute Mutation
  const computeMutation = useMutation({
    mutationFn: () => payrunsApi.computePayrun(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrun', id] });
      queryClient.invalidateQueries({ queryKey: ['payruns'] });
      setFeedbackMessage({ type: 'success', text: 'Payrun computed successfully! Payslip rule lines regenerated.' });
    },
    onError: (err) => {
      setFeedbackMessage({ type: 'error', text: err.response?.data?.error?.message || 'Compute failed.' });
    },
  });

  // Validate Mutation
  const validateMutation = useMutation({
    mutationFn: () => payrunsApi.validatePayrun(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrun', id] });
      queryClient.invalidateQueries({ queryKey: ['payruns'] });
      setFeedbackMessage({ type: 'success', text: 'Payrun validated successfully! Status set to VALIDATED.' });
    },
    onError: (err) => {
      setFeedbackMessage({ type: 'error', text: err.response?.data?.error?.message || 'Validation failed.' });
    },
  });

  // Mark Paid Mutation
  const markPaidMutation = useMutation({
    mutationFn: () => payrunsApi.markPaidPayrun(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payrun', id] });
      queryClient.invalidateQueries({ queryKey: ['payruns'] });
      setFeedbackMessage({ type: 'success', text: 'Payrun marked as PAID! Records locked for historical immutability.' });
    },
    onError: (err) => {
      setFeedbackMessage({ type: 'error', text: err.response?.data?.error?.message || 'Payment update failed.' });
    },
  });

  // Bulk Send Payslips Mutation
  const sendPayslipsMutation = useMutation({
    mutationFn: () => payrunsApi.sendPayslips(id),
    onSuccess: (res) => {
      setFeedbackMessage({ type: 'success', text: res?.message || 'Payslip emails sent successfully to all employees!' });
    },
    onError: (err) => {
      setFeedbackMessage({ type: 'error', text: err.response?.data?.error?.message || 'Bulk email delivery failed.' });
    },
  });

  if (isLoading) return <LoadingState message="Loading payrun processing batch..." />;
  if (isError || !payrun) return <ErrorState message="Unable to load payrun details." onRetry={refetch} />;

  const warnings = payrun.warnings || [];
  const hasCriticalWarnings = warnings.some((w) => w.severity === WarningSeverity.CRITICAL);
  const payslips = payrun.payslips || [];

  const columns = [
    {
      header: 'Employee Name',
      accessorKey: 'employee',
      render: (p) => (
        <div>
          <div className="font-semibold text-gray-900">
            {p.employee?.name || (p.employee ? `${p.employee.firstName || ''} ${p.employee.lastName || ''}`.trim() : null) || 'Unassigned'}
          </div>
          <div className="text-xs text-gray-500">{p.employee?.jobPosition}</div>
        </div>
      ),
    },
    {
      header: 'Contract Wage',
      accessorKey: 'contract',
      render: (p) => formatCurrency(p.contract?.wage),
    },
    {
      header: 'Basic Pay',
      accessorKey: 'basic',
      render: (p) => formatCurrency(p.basic),
    },
    {
      header: 'Gross Salary',
      accessorKey: 'gross',
      render: (p) => <span className="font-semibold text-gray-900">{formatCurrency(p.gross)}</span>,
    },
    {
      header: 'Net Salary',
      accessorKey: 'net',
      render: (p) => <span className="font-bold text-emerald-700">{formatCurrency(p.net)}</span>,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      render: (p) => <StatusBadge status={p.status} />,
    },
    {
      header: 'Actions',
      render: (p) => (
        <button
          onClick={() => navigate(`/payroll/payslips/${p.id}`)}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg"
        >
          <Eye className="w-3.5 h-3.5" />
          View Payslip
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={payrun.name}
        description={`Period: ${formatDate(payrun.periodStart)} to ${formatDate(payrun.periodEnd)} • Structure: ${payrun.salaryStructure?.name}`}
        actions={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/payroll/payruns')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {/* Workflow Action Buttons */}
            {payrun.status === PayrunStatus.DRAFT && can('COMPUTE_PAYRUN') && (
              <button
                onClick={() => computeMutation.mutate()}
                disabled={computeMutation.isPending}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                {computeMutation.isPending ? 'Computing Engine...' : 'Compute Salary Rules'}
              </button>
            )}

            {payrun.status === PayrunStatus.COMPUTED && can('VALIDATE_PAYRUN') && (
              <button
                onClick={() => validateMutation.mutate()}
                disabled={hasCriticalWarnings || validateMutation.isPending}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
                title={hasCriticalWarnings ? 'Resolve critical payroll warnings before validating' : 'Validate Payrun'}
              >
                <CheckCircle2 className="w-4 h-4" />
                {validateMutation.isPending ? 'Validating...' : 'Validate Payrun'}
              </button>
            )}

            {payrun.status === PayrunStatus.VALIDATED && can('MARK_PAID_PAYRUN') && (
              <button
                onClick={() => markPaidMutation.mutate()}
                disabled={markPaidMutation.isPending}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm disabled:opacity-50"
              >
                <DollarSign className="w-4 h-4" />
                {markPaidMutation.isPending ? 'Processing Payment...' : 'Mark Paid'}
              </button>
            )}

            {(payrun.status === PayrunStatus.VALIDATED || payrun.status === PayrunStatus.PAID) && can('SEND_PAYSLIPS') && (
              <button
                onClick={() => sendPayslipsMutation.mutate()}
                disabled={sendPayslipsMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg shadow-sm disabled:opacity-50"
              >
                <Mail className="w-4 h-4 text-blue-600" />
                {sendPayslipsMutation.isPending ? 'Sending Emails...' : 'Send Bulk Payslips Email'}
              </button>
            )}
          </div>
        }
      />

      {/* Feedback Banner */}
      {feedbackMessage && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
            feedbackMessage.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <span>{feedbackMessage.text}</span>
          <button onClick={() => setFeedbackMessage(null)} className="text-gray-400 hover:text-gray-600">
            Dismiss
          </button>
        </div>
      )}

      {/* Payrun Status Header Card */}
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <StatusBadge status={payrun.status} />
          <div>
            <span className="text-xs text-gray-500 font-medium">Batch ID: {payrun.id}</span>
            <p className="text-xs text-gray-700 mt-0.5">
              Includes <span className="font-bold">{payslips.length} payslips</span> for active employees.
            </p>
          </div>
        </div>

        {payrun.status === PayrunStatus.PAID && (
          <div className="bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-800 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Finalized & Paid (Read-only Historical Record)
          </div>
        )}
      </div>

      {/* Payroll Warnings Section */}
      {warnings.length > 0 && (
        <div className={`p-5 rounded-xl border space-y-3 ${hasCriticalWarnings ? 'bg-rose-50/80 border-rose-200' : 'bg-amber-50/80 border-amber-200'}`}>
          <div className="flex items-center gap-2 font-bold text-sm text-gray-900">
            <ShieldAlert className={`w-5 h-5 ${hasCriticalWarnings ? 'text-rose-600' : 'text-amber-600'}`} />
            <span>Payroll Validation Warnings ({warnings.length})</span>
          </div>

          {hasCriticalWarnings && (
            <div className="p-3 bg-white/80 rounded-lg border border-rose-300 text-xs text-rose-800 font-semibold">
              ⚠️ Validation is blocked in the UI because critical warnings exist (e.g. missing bank details or negative net salary). Please resolve issues before validating.
            </div>
          )}

          <div className="space-y-2">
            {warnings.map((w) => (
              <div key={w.id} className="p-3 bg-white rounded-lg border border-gray-200 shadow-2xs flex items-start justify-between text-xs">
                <div>
                  <span className="font-mono text-gray-500 uppercase text-[10px] mr-2">{w.type}</span>
                  <span className="font-medium text-gray-900">{w.message}</span>
                </div>
                <StatusBadge status={w.severity} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generated Payslips Table */}
      <div>
        <h3 className="text-base font-bold text-gray-900 mb-3">Payslips Summary</h3>
        <DataTable columns={columns} data={payslips} emptyMessage="No payslips generated for this payrun batch." />
      </div>
    </div>
  );
}
