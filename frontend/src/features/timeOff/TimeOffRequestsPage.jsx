import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { timeOffRequestsApi } from '../../api/timeOffRequests.api';
import { employeesApi } from '../../api/employees.api';
import { usePermissions } from '../../hooks/usePermissions';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import FilterBar from '../../components/common/FilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import TimeOffRequestFormPage from './TimeOffRequestFormPage';
import { Plus, CheckCircle, XCircle, Palmtree, MessageSquareText, Shield, User, Briefcase, CheckCheck, CheckCircle2 } from 'lucide-react';
import { formatDate, formatEnumLabel } from '../../utils/formatters';
import { TimeOffReqStatus } from '../../utils/constants';

const ROLE_BADGE_STYLES = {
  ADMIN: 'bg-purple-50 text-purple-700 border-purple-200/80',
  HR_MANAGER: 'bg-blue-50 text-blue-700 border-blue-200/80',
  HR_PAYROLL_MANAGER: 'bg-amber-50 text-amber-700 border-amber-200/80',
  HR_PAYROLL_USER: 'bg-cyan-50 text-cyan-700 border-cyan-200/80',
  EMPLOYEE: 'bg-slate-50 text-slate-700 border-slate-200/80',
};

const getAvatarBg = (name = '') => {
  const colors = [
    'bg-blue-100 text-blue-700',
    'bg-indigo-100 text-indigo-700',
    'bg-purple-100 text-purple-700',
    'bg-rose-100 text-rose-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-cyan-100 text-cyan-700',
  ];
  let sum = 0;
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i);
  return colors[sum % colors.length];
};

export default function TimeOffRequestsPage() {
  const queryClient = useQueryClient();
  const { can, isEmployee, employeeId: currentEmpId } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();

  const employeeIdFilter = searchParams.get('employeeId') || (isEmployee ? currentEmpId : '');
  const statusFilter = searchParams.get('status') || '';
  const roleFilter = searchParams.get('role') || '';
  const [page, setPage] = useState(1);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [feedback, setFeedback] = useState(null);

  // Fetch employees for filter dropdown
  const { data: empData } = useQuery({
    queryKey: ['employees-all'],
    queryFn: () => employeesApi.getEmployees({ pageSize: 100 }),
    enabled: !isEmployee,
  });
  const employeesList = empData?.data || (Array.isArray(empData) ? empData : []);

  // Fetch leave requests
  const { data: requestsData, isLoading } = useQuery({
    queryKey: ['time-off-requests', { employeeId: employeeIdFilter, status: statusFilter, page }],
    queryFn: () =>
      timeOffRequestsApi.getTimeOffRequests({
        employeeId: employeeIdFilter || undefined,
        status: statusFilter || undefined,
        page,
        pageSize: 20,
      }),
  });

  let requestsList = requestsData?.data || (Array.isArray(requestsData) ? requestsData : []);
  if (roleFilter) {
    requestsList = requestsList.filter((r) => (r.employee?.role || r.employee?.user?.role) === roleFilter);
  }
  const totalRecords = roleFilter ? requestsList.length : (requestsData?.total || requestsList.length);

  const pendingRequests = requestsList.filter(
    (r) => r.status === 'PENDING' || r.status === 'SUBMITTED' || r.status === 'DRAFT'
  );

  // Individual Approve mutation (isolated to specific row)
  const approveMutation = useMutation({
    mutationFn: (id) => {
      setActionLoadingId(id);
      return timeOffRequestsApi.approveTimeOffRequest(id);
    },
    onSuccess: (res, id) => {
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      setActionLoadingId(null);
      setFeedback({ type: 'success', text: 'Leave request approved successfully!' });
    },
    onError: (err) => {
      setActionLoadingId(null);
      setFeedback({ type: 'error', text: err.response?.data?.error?.message || 'Failed to approve request' });
    },
  });

  // Individual Refuse mutation (isolated to specific row)
  const refuseMutation = useMutation({
    mutationFn: (id) => {
      setActionLoadingId(id);
      return timeOffRequestsApi.refuseTimeOffRequest(id, { refusalReason: 'Refused by manager' });
    },
    onSuccess: (res, id) => {
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      setSelectedIds((prev) => prev.filter((item) => item !== id));
      setActionLoadingId(null);
      setFeedback({ type: 'success', text: 'Leave request refused.' });
    },
    onError: (err) => {
      setActionLoadingId(null);
      setFeedback({ type: 'error', text: err.response?.data?.error?.message || 'Failed to refuse request' });
    },
  });

  // Bulk Approve mutation (Approve All or Selected in one click)
  const bulkApproveMutation = useMutation({
    mutationFn: (ids) => timeOffRequestsApi.bulkApprove(ids),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      setSelectedIds([]);
      setFeedback({
        type: 'success',
        text: `Approved ${res?.approved ?? 'all'} pending leave request(s) in one click!`,
      });
    },
    onError: (err) => {
      setFeedback({ type: 'error', text: err.response?.data?.error?.message || 'Bulk approval failed' });
    },
  });

  // Bulk Refuse mutation (Refuse All or Selected in one click)
  const bulkRefuseMutation = useMutation({
    mutationFn: (ids) => timeOffRequestsApi.bulkRefuse(ids),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      setSelectedIds([]);
      setFeedback({
        type: 'success',
        text: `Refused ${res?.refused ?? 'all'} pending leave request(s) in one click!`,
      });
    },
    onError: (err) => {
      setFeedback({ type: 'error', text: err.response?.data?.error?.message || 'Bulk refusal failed' });
    },
  });

  const handleFilterChange = (key, val) => {
    const newParams = new URLSearchParams(searchParams);
    if (val) {
      newParams.set(key, val);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const columns = [
    {
      header: (
        <input
          type="checkbox"
          aria-label="Select all pending"
          checked={selectedIds.length > 0 && selectedIds.length === pendingRequests.length}
          onChange={(e) => {
            if (e.target.checked) {
              setSelectedIds(pendingRequests.map((r) => r.id));
            } else {
              setSelectedIds([]);
            }
          }}
          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
        />
      ),
      accessorKey: 'selection',
      render: (r) => {
        const isPending = r.status === 'PENDING' || r.status === 'SUBMITTED' || r.status === 'DRAFT';
        if (!isPending) return null;
        return (
          <input
            type="checkbox"
            checked={selectedIds.includes(r.id)}
            onChange={(e) => {
              e.stopPropagation();
              setSelectedIds((prev) =>
                prev.includes(r.id) ? prev.filter((id) => id !== r.id) : [...prev, r.id]
              );
            }}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
          />
        );
      },
    },
    {
      header: 'Employee & Role',
      accessorKey: 'employee',
      render: (r) => {
        const empName = r.employee?.name || (r.employee ? `${r.employee.firstName || ''} ${r.employee.lastName || ''}`.trim() : null) || 'Unassigned';
        const empRole = r.employee?.role || r.employee?.user?.role || 'EMPLOYEE';
        const badgeStyle = ROLE_BADGE_STYLES[empRole] || ROLE_BADGE_STYLES.EMPLOYEE;
        const initial = empName.charAt(0).toUpperCase();

        return (
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-xs ${getAvatarBg(empName)}`}>
              {initial}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 text-sm">{empName}</span>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badgeStyle}`}>
                  {formatEnumLabel(empRole)}
                </span>
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                <span>{r.employee?.jobPosition || 'Staff'}</span>
                {r.employee?.department?.name && (
                  <>
                    <span>•</span>
                    <span className="text-gray-400">{r.employee.department.name}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Leave Type',
      accessorKey: 'timeOffType',
      render: (r) => (
        <span className="font-medium text-gray-900 flex items-center gap-1.5 text-xs">
          <Palmtree className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          {r.timeOffType?.name || 'Leave'}
        </span>
      ),
    },
    {
      header: 'Duration & Period',
      render: (r) => (
        <div>
          <div className="font-bold text-gray-900 text-xs">
            {r.duration} {r.timeOffType?.unit?.toLowerCase() || 'days'}
          </div>
          <div className="text-[11px] text-gray-500 mt-0.5">
            {formatDate(r.startDate)} — {formatDate(r.endDate)}
          </div>
        </div>
      ),
    },
    {
      header: 'Reason',
      accessorKey: 'reason',
      render: (r) => (
        <div className="flex items-start gap-1.5 max-w-sm">
          <MessageSquareText className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
          <span className="text-xs text-gray-700 font-medium leading-tight line-clamp-2">
            {r.reason || '—'}
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      header: 'Actions',
      render: (r) => {
        const isPending = r.status === 'PENDING' || r.status === 'SUBMITTED' || r.status === 'DRAFT';
        const isApproved = r.status === 'APPROVED';
        const isRefused = r.status === 'REFUSED';
        const hasApprovalRights = can('APPROVE_TIME_OFF') || !isEmployee;
        const isThisRowLoading = actionLoadingId === r.id;

        return (
          <div className="flex items-center gap-2">
            {hasApprovalRights && isPending && (
              <>
                <button
                  type="button"
                  onClick={() => approveMutation.mutate(r.id)}
                  disabled={isThisRowLoading || bulkApproveMutation.isPending || bulkRefuseMutation.isPending}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
                  title="Approve Leave Request"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  {isThisRowLoading && approveMutation.isPending ? 'Approving...' : 'Approve'}
                </button>
                <button
                  type="button"
                  onClick={() => refuseMutation.mutate(r.id)}
                  disabled={isThisRowLoading || bulkApproveMutation.isPending || bulkRefuseMutation.isPending}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 hover:bg-rose-100 rounded-lg transition-colors disabled:opacity-50"
                  title="Refuse Leave Request"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  {isThisRowLoading && refuseMutation.isPending ? 'Refusing...' : 'Refuse'}
                </button>
              </>
            )}

            {hasApprovalRights && isApproved && (
              <button
                type="button"
                onClick={() => refuseMutation.mutate(r.id)}
                disabled={isThisRowLoading || bulkApproveMutation.isPending || bulkRefuseMutation.isPending}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 hover:bg-rose-100 rounded-lg transition-colors disabled:opacity-50"
                title="Revoke / Refuse Leave Request"
              >
                <XCircle className="w-3.5 h-3.5" />
                {isThisRowLoading && refuseMutation.isPending ? 'Refusing...' : 'Refuse'}
              </button>
            )}

            {hasApprovalRights && isRefused && (
              <button
                type="button"
                onClick={() => approveMutation.mutate(r.id)}
                disabled={isThisRowLoading || bulkApproveMutation.isPending || bulkRefuseMutation.isPending}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
                title="Re-Approve Leave Request"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                {isThisRowLoading && approveMutation.isPending ? 'Approving...' : 'Approve'}
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const filterConfigs = [];
  if (!isEmployee) {
    filterConfigs.push({
      label: 'Filter Employee',
      value: employeeIdFilter,
      onChange: (val) => handleFilterChange('employeeId', val),
      options: employeesList.map((e) => ({
        value: e.id,
        label: e.name || `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.email || 'Unknown',
      })),
    });
    filterConfigs.push({
      label: 'Filter Role',
      value: roleFilter,
      onChange: (val) => handleFilterChange('role', val),
      options: [
        { value: 'ADMIN', label: 'Admin' },
        { value: 'HR_MANAGER', label: 'HR Manager' },
        { value: 'HR_PAYROLL_MANAGER', label: 'Payroll Manager' },
        { value: 'HR_PAYROLL_USER', label: 'Payroll Specialist' },
        { value: 'EMPLOYEE', label: 'Standard Employee' },
      ],
    });
  }
  filterConfigs.push({
    label: 'Filter Status',
    value: statusFilter,
    onChange: (val) => handleFilterChange('status', val),
    options: Object.values(TimeOffReqStatus).map((s) => ({ value: s, label: formatEnumLabel(s) })),
  });

  return (
    <div>
      <PageHeader
        title="Time Off Requests"
        description="Submit leave requests and process approvals. Approving leave automatically deducts from employee leave balances on the server."
        actions={
          <button
            onClick={() => setRequestModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Time Off Request
          </button>
        }
      />

      <FilterBar filters={filterConfigs} onReset={() => setSearchParams({})} />

      {feedback && (
        <div
          className={`mb-4 p-3 rounded-lg flex items-center justify-between text-sm ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <span>{feedback.text}</span>
          <button
            onClick={() => setFeedback(null)}
            className="font-semibold text-xs hover:underline ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {(can('APPROVE_TIME_OFF') || !isEmployee) && pendingRequests.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-sm font-semibold text-gray-800">
              {selectedIds.length > 0 ? (
                <span>
                  {selectedIds.length} request(s) selected out of {pendingRequests.length} pending
                </span>
              ) : (
                <span>{pendingRequests.length} pending leave request(s) awaiting action</span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const idsToApprove = selectedIds.length > 0 ? selectedIds : pendingRequests.map((r) => r.id);
                bulkApproveMutation.mutate(idsToApprove);
              }}
              disabled={bulkApproveMutation.isPending || bulkRefuseMutation.isPending || !!actionLoadingId}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
              {bulkApproveMutation.isPending
                ? 'Approving...'
                : selectedIds.length > 0
                ? `Approve Selected (${selectedIds.length})`
                : `Approve All Pending (${pendingRequests.length})`}
            </button>
            <button
              type="button"
              onClick={() => {
                const idsToRefuse = selectedIds.length > 0 ? selectedIds : pendingRequests.map((r) => r.id);
                bulkRefuseMutation.mutate(idsToRefuse);
              }}
              disabled={bulkApproveMutation.isPending || bulkRefuseMutation.isPending || !!actionLoadingId}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-100 hover:bg-rose-200 active:bg-rose-300 border border-rose-300 rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              {bulkRefuseMutation.isPending
                ? 'Refusing...'
                : selectedIds.length > 0
                ? `Refuse Selected (${selectedIds.length})`
                : `Refuse All Pending (${pendingRequests.length})`}
            </button>
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedIds([])}
                className="text-xs text-gray-500 hover:text-gray-700 underline px-1 cursor-pointer"
              >
                Clear Selection
              </button>
            )}
          </div>
        </div>
      )}

      <DataTable
        columns={columns}
        data={requestsList}
        isLoading={isLoading}
        emptyMessage="No time off requests found."
        pagination={{
          page,
          pageSize: 20,
          total: totalRecords,
          onPageChange: setPage,
        }}
      />

      {requestModalOpen && (
        <TimeOffRequestFormPage
          isOpen={requestModalOpen}
          onClose={() => setRequestModalOpen(false)}
        />
      )}
    </div>
  );
}
