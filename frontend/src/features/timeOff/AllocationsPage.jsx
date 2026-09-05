import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { allocationsApi } from '../../api/allocations.api';
import { employeesApi } from '../../api/employees.api';
import { timeOffTypesApi } from '../../api/timeOffTypes.api';
import { usePermissions } from '../../hooks/usePermissions';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import FilterBar from '../../components/common/FilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import AllocationFormPage from './AllocationFormPage';
import { Plus, CheckCircle, XCircle, PieChart } from 'lucide-react';
import { formatDate, formatEnumLabel } from '../../utils/formatters';
import { AllocationStatus } from '../../utils/constants';

export default function AllocationsPage() {
  const queryClient = useQueryClient();
  const { can, isEmployee, employeeId: currentEmpId } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();

  const employeeIdFilter = searchParams.get('employeeId') || (isEmployee ? currentEmpId : '');
  const statusFilter = searchParams.get('status') || '';
  const [allocationModalOpen, setAllocationModalOpen] = useState(false);

  // Fetch employees
  const { data: empData } = useQuery({
    queryKey: ['employees-all'],
    queryFn: () => employeesApi.getEmployees({ pageSize: 100 }),
    enabled: !isEmployee,
  });
  const employeesList = empData?.data || (Array.isArray(empData) ? empData : []);

  // Fetch allocations
  const { data: allocationsData, isLoading } = useQuery({
    queryKey: ['allocations', { employeeId: employeeIdFilter, status: statusFilter }],
    queryFn: () =>
      allocationsApi.getAllocations({
        employeeId: employeeIdFilter || undefined,
        status: statusFilter || undefined,
      }),
  });

  const allocationsList = allocationsData?.data || (Array.isArray(allocationsData) ? allocationsData : []);

  // Approve / Refuse mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => allocationsApi.updateAllocation(id, { status }),
    onSuccess: () => {
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
      render: (a) => (
        <div>
          <div className="font-semibold text-gray-900">{a.employee?.name || 'Unassigned'}</div>
          <div className="text-xs text-gray-500">{a.employee?.jobPosition}</div>
        </div>
      ),
    },
    {
      header: 'Time Off Type',
      accessorKey: 'timeOffType',
      render: (a) => <span className="font-medium text-gray-900">{a.timeOffType?.name || 'Leave'}</span>,
    },
    {
      header: 'Allocated vs Taken Balance',
      render: (a) => {
        const allocated = parseFloat(a.allocatedAmount) || 0;
        const taken = parseFloat(a.takenAmount) || 0;
        const remaining = Math.max(0, allocated - taken);
        return (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <span className="text-gray-900">{allocated} allocated</span>
              <span className="text-gray-400">•</span>
              <span className="text-rose-600">{taken} taken</span>
              <span className="text-gray-400">•</span>
              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                {remaining} remaining
              </span>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Validity Period',
      render: (a) => (
        <span className="text-xs text-gray-600">
          {formatDate(a.validFrom)} — {formatDate(a.validTo)}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      render: (a) => <StatusBadge status={a.status} />,
    },
    {
      header: 'Actions',
      render: (a) => (
        can('MANAGE_ALLOCATIONS') && a.status === AllocationStatus.PENDING && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateStatusMutation.mutate({ id: a.id, status: AllocationStatus.APPROVED })}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Approve
            </button>
            <button
              onClick={() => updateStatusMutation.mutate({ id: a.id, status: AllocationStatus.REFUSED })}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg"
            >
              <XCircle className="w-3.5 h-3.5" />
              Refuse
            </button>
          </div>
        )
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
    options: Object.values(AllocationStatus).map((s) => ({ value: s, label: formatEnumLabel(s) })),
  });

  return (
    <div>
      <PageHeader
        title="Leave Allocations"
        description="Manage employee leave quotas, granted balances, and remaining entitlement validity."
        actions={
          can('MANAGE_ALLOCATIONS') && (
            <button
              onClick={() => setAllocationModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Leave Allocation
            </button>
          )
        }
      />

      <FilterBar filters={filterConfigs} onReset={() => setSearchParams({})} />

      <DataTable
        columns={columns}
        data={allocationsList}
        isLoading={isLoading}
        emptyMessage="No leave allocations found."
      />

      {allocationModalOpen && (
        <AllocationFormPage
          isOpen={allocationModalOpen}
          onClose={() => setAllocationModalOpen(false)}
        />
      )}
    </div>
  );
}
