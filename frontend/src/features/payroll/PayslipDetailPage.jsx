import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payslipsApi } from '../../api/payslips.api';
import { usePermissions } from '../../hooks/usePermissions';
import PageHeader from '../../components/common/PageHeader';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingState from '../../components/common/LoadingState';
import ErrorState from '../../components/common/ErrorState';
import PayslipPdfButton from './PayslipPdfButton';
import { formatDate, formatCurrency, formatEnumLabel } from '../../utils/formatters';
import { ArrowLeft, Mail, Building, Briefcase, Calendar, CheckCircle2, User } from 'lucide-react';

export default function PayslipDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = usePermissions();

  const [emailStatus, setEmailStatus] = useState(null);

  const { data: payslip, isLoading, isError, refetch } = useQuery({
    queryKey: ['payslip', id],
    queryFn: () => payslipsApi.getPayslipById(id),
    enabled: !!id,
  });

  const sendEmailMutation = useMutation({
    mutationFn: () => payslipsApi.sendPayslipEmail(id),
    onSuccess: (res) => {
      setEmailStatus({ type: 'success', text: res?.message || 'Payslip email sent to employee!' });
    },
    onError: (err) => {
      setEmailStatus({ type: 'error', text: err.response?.data?.error?.message || 'Failed to send email.' });
    },
  });

  if (isLoading) return <LoadingState message="Loading payslip breakdown..." />;
  if (isError || !payslip) return <ErrorState message="Unable to load payslip." onRetry={refetch} />;

  const lines = (payslip.lines || []).sort((a, b) => (a.sequence || 0) - (b.sequence || 0));

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Payslip — ${payslip.employee?.name || 'Employee'}`}
        description={`Period: ${formatDate(payslip.periodStart)} to ${formatDate(payslip.periodEnd)}`}
        actions={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/payroll/payslips')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            <PayslipPdfButton payslipId={payslip.id} />

            {can('SEND_PAYSLIPS') && (
              <button
                type="button"
                onClick={() => sendEmailMutation.mutate()}
                disabled={sendEmailMutation.isPending}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50"
              >
                <Mail className="w-4 h-4" />
                {sendEmailMutation.isPending ? 'Sending...' : 'Email Payslip'}
              </button>
            )}
          </div>
        }
      />

      {emailStatus && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
            emailStatus.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          <span>{emailStatus.text}</span>
          <button onClick={() => setEmailStatus(null)} className="text-gray-400 hover:text-gray-600">
            Dismiss
          </button>
        </div>
      )}

      {/* Employee & Payrun Information Card */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Employee</span>
          <div className="font-bold text-gray-900 text-base">{payslip.employee?.name}</div>
          <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
            <Briefcase className="w-3 h-3 text-gray-400" />
            {payslip.employee?.jobPosition}
          </div>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Payrun Batch</span>
          <div className="font-semibold text-gray-900 text-sm">{payslip.payrun?.name}</div>
          <div className="text-xs text-gray-500 mt-0.5">{payslip.salaryStructure?.name}</div>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Worked Days</span>
          <div className="font-extrabold text-gray-900 text-base">{payslip.workedDays || 0} days</div>
          <div className="text-xs text-gray-500 mt-0.5">Contract Base Wage: {formatCurrency(payslip.contract?.wage)}</div>
        </div>

        <div>
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">Payslip Status</span>
          <div className="mt-1">
            <StatusBadge status={payslip.status} />
          </div>
        </div>
      </div>

      {/* Salary Computation Lines Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h3 className="text-base font-bold text-gray-900">Salary Computation Breakdown</h3>
            <p className="text-xs text-gray-500">Calculated rule lines ordered by sequence execution.</p>
          </div>
          <div className="text-right">
            <span className="text-xs font-medium text-gray-500 block">Final Net Payable:</span>
            <span className="text-xl font-extrabold text-emerald-700">{formatCurrency(payslip.net)}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="px-6 py-3">Seq</th>
                <th className="px-6 py-3">Rule Name</th>
                <th className="px-6 py-3">Code</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3 text-right">Computed Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-800">
              {lines.map((line) => (
                <tr
                  key={line.id}
                  className={`hover:bg-gray-50/50 ${
                    line.category === 'NET'
                      ? 'bg-emerald-50/50 font-bold text-emerald-900'
                      : line.category === 'GROSS'
                      ? 'bg-blue-50/40 font-semibold'
                      : ''
                  }`}
                >
                  <td className="px-6 py-3.5 text-xs text-gray-400 font-bold">{line.sequence}</td>
                  <td className="px-6 py-3.5 font-medium">{line.name}</td>
                  <td className="px-6 py-3.5 font-mono text-xs text-blue-600">{line.code}</td>
                  <td className="px-6 py-3.5">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                      {formatEnumLabel(line.category)}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right font-bold">{formatCurrency(line.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
