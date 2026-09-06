import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { payrunsApi } from '../../api/payruns.api';
import { usePermissions } from '../../hooks/usePermissions';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import FilterBar from '../../components/common/FilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Plus, Eye, Trash2, DollarSign, Calendar, Users } from 'lucide-react';
import { formatDate, formatEnumLabel } from '../../utils/formatters';
import { PayrunStatus } from '../../utils/constants';

export default function PayrunsListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();

  const statusFilter = searchParams.get('status') || '';
  const periodFilter = searchParams.get('period') || '';

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [payrunToDelete, setPayrunToDelete] = useState(null);

  const { data: payrunsData, isLoading } = useQuery({
    queryKey: ['payruns', { status: statusFilter, period: periodFilter }],
    queryFn: () =>
      payrunsApi.getPayruns({
        status: statusFilter || undefined,
        period: periodFilter || undefined,
      }),
  });

  const payrunsList = payrunsData?.data || (Array.isArray(payrunsData) ? payrunsData : []);

  const deleteMutation = useMutation({
    mutationFn: payrunsApi.deletePayrun,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payruns'] });
      setDeleteConfirmOpen(false);
      setPayrunToDelete(null);
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
      header: 'Payrun Name',
      accessorKey: 'name',
      render: (p) => (
        <div>
          <div className="font-semibold text-gray-900">{p.name}</div>
          <div className="text-xs text-gray-500">{p.salaryStructure?.name}</div>
        </div>
      ),
    },
    {
      header: 'Period Range',
      render: (p) => (
        <span className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          {formatDate(p.periodStart)} — {formatDate(p.periodEnd)}
        </span>
      ),
    },
    {
      header: 'Staff Count',
      accessorKey: 'employees',
      render: (p) => {
        const count =
          p.employeeCount ??
          p.payslipCount ??
          (p.employees ? p.employees.length : null) ??
          p._count?.payrunEmployees ??
          p._count?.payslips ??
          p._count?.employees ??
          0;
        return (
          <span className="text-xs font-bold px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg inline-flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            {count} staff
          </span>
        );
      },
    },
    {
      header: 'Status',
      accessorKey: 'status',
      render: (p) => <StatusBadge status={p.status} />,
    },
    {
      header: 'Created Date',
      accessorKey: 'createdAt',
      render: (p) => formatDate(p.createdAt),
    },
    {
      header: 'Actions',
      render: (p) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/payroll/payruns/${p.id}`)}
            className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg"
          >
            <Eye className="w-3.5 h-3.5" />
            Process / View
          </button>
          {can('DELETE_PAYRUN') && p.status !== PayrunStatus.PAID && p.status !== 'PAID' && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPayrunToDelete(p);
                setDeleteConfirmOpen(true);
              }}
              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Delete Payrun Batch"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  const filterConfigs = [
    {
      label: 'Filter Status',
      value: statusFilter,
      onChange: (val) => handleFilterChange('status', val),
      options: Object.values(PayrunStatus).map((s) => ({ value: s, label: formatEnumLabel(s) })),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Payroll Payrun Batches"
        description="Initiate payruns, compute salary rule breakdowns, resolve operational warnings, and authorize payments."
        actions={
          can('CREATE_PAYRUN') && (
            <button
              onClick={() => navigate('/payroll/payruns/new')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              NEW Payrun Batch
            </button>
          )
        }
      />

      <FilterBar filters={filterConfigs} onReset={() => setSearchParams({})}>
        <div className="w-full sm:w-48">
          <input
            type="month"
            value={periodFilter}
            onChange={(e) => handleFilterChange('period', e.target.value)}
            className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg shadow-sm"
          />
        </div>
      </FilterBar>

      <DataTable
        columns={columns}
        data={payrunsList}
        isLoading={isLoading}
        emptyMessage="No payrun batches found. Click 'NEW Payrun Batch' to launch the setup wizard."
        onRowClick={(p) => navigate(`/payroll/payruns/${p.id}`)}
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => deleteMutation.mutate(payrunToDelete.id)}
        title="Delete Draft Payrun"
        message={`Are you sure you want to delete draft payrun "${payrunToDelete?.name}"?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
