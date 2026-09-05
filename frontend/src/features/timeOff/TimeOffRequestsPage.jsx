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
import { Plus, CheckCircle, XCircle, Palmtree } from 'lucide-react';
import { formatDate, formatEnumLabel } from '../../utils/formatters';
import { TimeOffReqStatus } from '../../utils/constants';

export default function TimeOffRequestsPage() {
  const queryClient = useQueryClient();
  const { can, isEmployee, employeeId: currentEmpId } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();

  const employeeIdFilter = searchParams.get('employeeId') || (isEmployee ? currentEmpId : '');
  const statusFilter = searchParams.get('status') || '';
  const [page, setPage] = useState(1);
  const [requestModalOpen, setRequestModalOpen] = useState(false);

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

  const requestsList = requestsData?.data || (Array.isArray(requestsData) ? requestsData : []);
  const totalRecords = requestsData?.total || requestsList.length;

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: timeOffRequestsApi.approveTimeOffRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
    },
  });

  // Refuse mutation
  const refuseMutation = useMutation({
    mutationFn: timeOffRequestsApi.refuseTimeOffRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
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
      header: 'Employee',
      accessorKey: 'employee',
      render: (r) => (
        <div>
          <div className="font-semibold text-gray-900">{r.employee?.name || 'Unassigned'}</div>
          <div className="text-xs text-gray-500">{r.employee?.jobPosition}</div>
        </div>
      ),
    },
    {
      header: 'Leave Type',
      accessorKey: 'timeOffType',
      render: (r) => (
        <span className="font-medium text-gray-900 flex items-center gap-1.5">
          <Palmtree className="w-3.5 h-3.5 text-blue-600" />
          {r.timeOffType?.name || 'Leave'}
        </span>
      ),
    },
    {
      header: 'Duration & Period',
      render: (r) => (
        <div>
          <div className="font-bold text-gray-900">
            {r.duration} {r.timeOffType?.unit?.toLowerCase() || 'days'}
          </div>
          <div className="text-xs text-gray-500">
            {formatDate(r.startDate)} — {formatDate(r.endDate)}
          </div>
        </div>
      ),
    },
    {
      header: 'Reason',
      accessorKey: 'reason',
      render: (r) => <span className="text-xs text-gray-600 max-w-xs block truncate">{r.reason || '—'}</span>,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      header: 'Actions',
      render: (r) => (
        <div className="flex items-center gap-2">
          {can('APPROVE_TIME_OFF') && (r.status === TimeOffReqStatus.SUBMITTED || r.status === TimeOffReqStatus.DRAFT) && (
            <>
              <button
                onClick={() => approveMutation.mutate(r.id)}
                disabled={approveMutation.isPending}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors"
                title="Approve Leave Request"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Approve
              </button>
              <button
                onClick={() => refuseMutation.mutate(r.id)}
                disabled={refuseMutation.isPending}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg transition-colors"
                title="Refuse Leave Request"
              >
                <XCircle className="w-3.5 h-3.5" />
                Refuse
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  const filterConfigs = [];
  if (!isEmployee) {
    filterConfigs.push({
      label: 'Filter Employee',
      value: employeeIdFilter,
      onChange: (val) => handleFilterChange('employeeId', val),
      options: employeesList.map((e) => ({ value: e.id, label: e.name })),
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
