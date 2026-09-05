import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { contractsApi } from '../../api/contracts.api';
import { employeesApi } from '../../api/employees.api';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import FilterBar from '../../components/common/FilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Plus, Edit2, Trash2, FileText, CheckCircle } from 'lucide-react';
import { formatDate, formatCurrency, formatEnumLabel } from '../../utils/formatters';
import { ContractStatus } from '../../utils/constants';

export default function ContractListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const employeeIdFilter = searchParams.get('employeeId') || '';
  const statusFilter = searchParams.get('status') || '';

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [contractToDelete, setContractToDelete] = useState(null);

  // Fetch employees for filter dropdown
  const { data: empData } = useQuery({
    queryKey: ['employees-all'],
    queryFn: () => employeesApi.getEmployees({ pageSize: 100 }),
  });
  const employeesList = empData?.data || (Array.isArray(empData) ? empData : []);

  // Fetch contracts
  const { data: contractsData, isLoading } = useQuery({
    queryKey: ['contracts', { employeeId: employeeIdFilter, status: statusFilter }],
    queryFn: () =>
      contractsApi.getContracts({
        employeeId: employeeIdFilter || undefined,
        status: statusFilter || undefined,
      }),
  });
  const contractsList = contractsData?.data || (Array.isArray(contractsData) ? contractsData : []);

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: contractsApi.deleteContract,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      setDeleteConfirmOpen(false);
      setContractToDelete(null);
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
      render: (c) => (
        <div>
          <div className="font-semibold text-gray-900">{c.employee?.name || 'Unassigned'}</div>
          <div className="text-xs text-gray-500">{c.jobPosition}</div>
        </div>
      ),
    },
    {
      header: 'Department',
      accessorKey: 'department',
      render: (c) => c.department?.name || 'No Dept',
    },
    {
      header: 'Wage (Salary)',
      accessorKey: 'wage',
      render: (c) => <span className="font-bold text-gray-900">{formatCurrency(c.wage)}</span>,
    },
    {
      header: 'Salary Structure',
      accessorKey: 'salaryStructure',
      render: (c) => c.salaryStructure?.name || '—',
    },
    {
      header: 'Period Duration',
      render: (c) => (
        <span className="text-xs text-gray-600">
          {formatDate(c.startDate)} {c.endDate ? `to ${formatDate(c.endDate)}` : '(Ongoing)'}
        </span>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      render: (c) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={c.status} />
          {c.status === ContractStatus.ACTIVE && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
              <CheckCircle className="w-3 h-3" />
              Active Payroll Contract
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      render: (c) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/contracts/${c.id}/edit`)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Contract"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setContractToDelete(c);
              setDeleteConfirmOpen(true);
            }}
            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Contract"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const filterConfigs = [
    {
      label: 'Filter Employee',
      value: employeeIdFilter,
      onChange: (val) => handleFilterChange('employeeId', val),
      options: employeesList.map((e) => ({ value: e.id, label: e.name })),
    },
    {
      label: 'Filter Status',
      value: statusFilter,
      onChange: (val) => handleFilterChange('status', val),
      options: Object.values(ContractStatus).map((s) => ({ value: s, label: formatEnumLabel(s) })),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Employment Contracts"
        description="Maintain employee contract history, wage terms, and structure assignments used during payroll execution."
        actions={
          <button
            onClick={() => navigate('/contracts/new')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Contract
          </button>
        }
      />

      <FilterBar
        filters={filterConfigs}
        onReset={() => setSearchParams({})}
      />

      <DataTable
        columns={columns}
        data={contractsList}
        isLoading={isLoading}
        emptyMessage="No contracts found for the selected filters."
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => deleteMutation.mutate(contractToDelete.id)}
        title="Delete Contract"
        message={`Are you sure you want to delete this contract for "${contractToDelete?.employee?.name}"?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
