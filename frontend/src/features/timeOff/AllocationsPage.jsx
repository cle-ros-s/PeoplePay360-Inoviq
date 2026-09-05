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
import { Plus, CheckCircle, XCircle, PieChart, Shield } from 'lucide-react';
import { formatDate, formatEnumLabel } from '../../utils/formatters';
import { AllocationStatus } from '../../utils/constants';

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

export default function AllocationsPage() {
  const queryClient = useQueryClient();
  const { can, isEmployee, employeeId: currentEmpId } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();

  const employeeIdFilter = searchParams.get('employeeId') || (isEmployee ? currentEmpId : '');
  const statusFilter = searchParams.get('status') || '';
  const roleFilter = searchParams.get('role') || '';
  const [page, setPage] = useState(1);
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
    queryKey: ['allocations', { employeeId: employeeIdFilter, status: statusFilter, page }],
    queryFn: () =>
      allocationsApi.getAllocations({
        employeeId: employeeIdFilter || undefined,
        status: statusFilter || undefined,
        page,
        pageSize: 20,
      }),
  });

  let allocationsList = allocationsData?.data || (Array.isArray(allocationsData) ? allocationsData : []);
  if (roleFilter) {
    allocationsList = allocationsList.filter((a) => (a.employee?.role || a.employee?.user?.role) === roleFilter);
  }
  const totalRecords = roleFilter ? allocationsList.length : (allocationsData?.total || allocationsList.length);

  // Approve / Refuse mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => allocationsApi.updateAllocation(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-timeoff-overview'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
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
      header: 'Employee & Role',
      accessorKey: 'employee',
      render: (a) => {
        const empName = a.employee?.name || (a.employee ? `${a.employee.firstName || ''} ${a.employee.lastName || ''}`.trim() : null) || 'Unassigned';
        const empRole = a.employee?.role || a.employee?.user?.role || 'EMPLOYEE';
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
              <div className="text-xs text-gray-500 mt-0.5">
                {a.employee?.jobPosition || 'Staff'}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Time Off Type',
      accessorKey: 'timeOffType',
      render: (a) => <span className="font-medium text-gray-900 text-xs">{a.timeOffType?.name || 'Leave'}</span>,
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
              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold border border-emerald-200">
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
        (can('MANAGE_ALLOCATIONS') || !isEmployee) && (
          <div className="flex items-center gap-2">
            {(a.status === AllocationStatus.PENDING || a.status === 'PENDING' || a.status === 'DRAFT') && (
              <>
                <button
                  onClick={() => updateStatusMutation.mutate({ id: a.id, status: AllocationStatus.APPROVED })}
                  disabled={updateStatusMutation.isPending}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
                  title="Approve Leave Allocation"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Approve
                </button>
                <button
                  onClick={() => updateStatusMutation.mutate({ id: a.id, status: AllocationStatus.REFUSED })}
                  disabled={updateStatusMutation.isPending}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 hover:bg-rose-100 rounded-lg transition-colors disabled:opacity-50"
                  title="Refuse Leave Allocation"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Refuse
                </button>
              </>
            )}

            {a.status === AllocationStatus.APPROVED && (
              <button
                onClick={() => updateStatusMutation.mutate({ id: a.id, status: AllocationStatus.REFUSED })}
                disabled={updateStatusMutation.isPending}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200/80 hover:bg-rose-100 rounded-lg transition-colors disabled:opacity-50"
                title="Revoke / Refuse Allocation"
              >
                <XCircle className="w-3.5 h-3.5" />
                Refuse
              </button>
            )}

            {a.status === AllocationStatus.REFUSED && (
              <button
                onClick={() => updateStatusMutation.mutate({ id: a.id, status: AllocationStatus.APPROVED })}
                disabled={updateStatusMutation.isPending}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors disabled:opacity-50"
                title="Re-Approve Allocation"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Approve
              </button>
            )}
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
              Grant Leave Allocation
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
        pagination={{
          page,
          pageSize: 20,
          total: totalRecords,
          onPageChange: setPage,
        }}
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
