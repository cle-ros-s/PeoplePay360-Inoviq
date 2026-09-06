import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { payrunsApi } from '../../api/payruns.api';
import DataTable from '../../components/common/DataTable';
import EmptyState from '../../components/common/EmptyState';
import { ArrowLeft, CheckSquare, Square, Play, Users, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export default function Step2SelectEmployees({ scopeData, onBack }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const eligibleEmployees = scopeData?.eligibleEmployees || [];
  const defaultSelected = eligibleEmployees
    .filter((e) => e.hasActiveContract !== false)
    .map((e) => e.id);
  const [selectedEmpIds, setSelectedEmpIds] = useState(() =>
    defaultSelected.length > 0 ? defaultSelected : eligibleEmployees.map((e) => e.id)
  );

  const createPayrunMutation = useMutation({
    mutationFn: payrunsApi.createPayrun,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payruns'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      navigate(`/payroll/payruns/${data.id}`);
    },
  });

  const handleToggleSelectAll = () => {
    if (selectedEmpIds.length === eligibleEmployees.length) {
      setSelectedEmpIds([]);
    } else {
      setSelectedEmpIds(eligibleEmployees.map((e) => e.id));
    }
  };

  const handleToggleEmp = (id) => {
    setSelectedEmpIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const handleCreate = () => {
    const payload = {
      name: scopeData?.name || `Payrun Batch ${new Date().toLocaleDateString()}`,
      salaryStructureId: scopeData.salaryStructureId,
      periodStart: scopeData.periodStart,
      periodEnd: scopeData.periodEnd,
      employeeIds: selectedEmpIds,
    };
    createPayrunMutation.mutate(payload);
  };

  const columns = [
    {
      header: (
        <button type="button" onClick={handleToggleSelectAll} className="flex items-center gap-2 text-xs font-semibold uppercase">
          {selectedEmpIds.length === eligibleEmployees.length && eligibleEmployees.length > 0 ? (
            <CheckSquare className="w-4 h-4 text-blue-600" />
          ) : (
            <Square className="w-4 h-4 text-gray-400" />
          )}
          Select All
        </button>
      ),
      render: (emp) => (
        <input
          type="checkbox"
          checked={selectedEmpIds.includes(emp.id)}
          onChange={() => handleToggleEmp(emp.id)}
          className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
        />
      ),
    },
    {
      header: 'Employee Name',
      accessorKey: 'name',
      render: (emp) => (
        <div>
          <div className="font-semibold text-gray-900">{emp.name}</div>
          <div className="text-xs text-gray-500">{emp.email}</div>
        </div>
      ),
    },
    {
      header: 'Job Position',
      accessorKey: 'jobPosition',
    },
    {
      header: 'Department',
      render: (emp) => (typeof emp.department === 'string' ? emp.department : emp.department?.name) || 'Unassigned',
    },
    {
      header: 'Active Contract Wage',
      render: (emp) => {
        const wage =
          emp.contract?.wage ??
          emp.contracts?.find((c) => c.status === 'RUNNING' || c.status === 'ACTIVE')?.wage ??
          emp.contracts?.[0]?.wage;
        return wage ? (
          <span className="font-bold text-gray-900">{formatCurrency(wage)}</span>
        ) : (
          <span className="text-xs text-amber-600 font-medium">No Active Contract</span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-100 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-gray-900">Step 2: Select Employees for Payrun Batch</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {eligibleEmployees.length} staff members eligible with active contracts for this salary structure & period.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <Users className="w-4 h-4 text-blue-600" />
            {selectedEmpIds.length} of {eligibleEmployees.length} selected
          </span>
        </div>
      </div>

      {eligibleEmployees.length === 0 ? (
        <EmptyState
          title="No Eligible Employees Found"
          description="There are no active employees with valid contracts matching the selected salary structure and period parameters."
        />
      ) : (
        <DataTable columns={columns} data={eligibleEmployees} />
      )}

      {createPayrunMutation.isError && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{createPayrunMutation.error?.response?.data?.error?.message || 'Failed to initialize Payrun batch.'}</span>
        </div>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Scope
        </button>

        <button
          type="button"
          onClick={handleCreate}
          disabled={selectedEmpIds.length === 0 || createPayrunMutation.isPending}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Play className="w-4 h-4" />
          {createPayrunMutation.isPending ? 'Initializing Payrun...' : `Create Payrun (${selectedEmpIds.length} Staff)`}
        </button>
      </div>
    </div>
  );
}
