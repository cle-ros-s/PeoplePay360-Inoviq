import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { salaryStructuresApi } from '../../api/salaryStructures.api';
import { usePermissions } from '../../hooks/usePermissions';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { Plus, Edit2, Trash2, Sliders, CheckCircle, XCircle } from 'lucide-react';

export default function SalaryStructuresPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { can } = usePermissions();

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [structureToDelete, setStructureToDelete] = useState(null);

  const { data: structuresData, isLoading } = useQuery({
    queryKey: ['salary-structures'],
    queryFn: () => salaryStructuresApi.getSalaryStructures(),
  });

  const structuresList = structuresData?.data || (Array.isArray(structuresData) ? structuresData : []);

  const deleteMutation = useMutation({
    mutationFn: salaryStructuresApi.deleteSalaryStructure,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-structures'] });
      setDeleteConfirmOpen(false);
      setStructureToDelete(null);
    },
  });

  const columns = [
    {
      header: 'Structure Name',
      accessorKey: 'name',
      render: (s) => (
        <div>
          <div className="font-semibold text-gray-900">{s.name}</div>
          {s.description && <div className="text-xs text-gray-500">{s.description}</div>}
        </div>
      ),
    },
    {
      header: 'Rules Count',
      accessorKey: 'rules',
      render: (s) => (
        <span className="font-bold text-gray-800 text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded">
          {s.rules ? s.rules.length : s._count?.rules || 0} salary rules
        </span>
      ),
    },
    {
      header: 'Active Status',
      accessorKey: 'isActive',
      render: (s) =>
        s.isActive ? (
          <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Active
          </span>
        ) : (
          <span className="text-gray-400 font-medium text-xs flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Inactive
          </span>
        ),
    },
    {
      header: 'Actions',
      render: (s) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/payroll-config/structures/${s.id}/rules`)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 hover:bg-purple-100 rounded-lg"
            title="Manage Salary Rules"
          >
            <Sliders className="w-3.5 h-3.5" />
            Manage Rules
          </button>

          {can('MANAGE_SALARY_STRUCTURES') && (
            <>
              <button
                onClick={() => navigate(`/payroll-config/structures/${s.id}/edit`)}
                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit Structure"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setStructureToDelete(s);
                  setDeleteConfirmOpen(true);
                }}
                className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Delete Structure"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Salary Structures"
        description="Containers for organizing collections of salary rules (Basic, Allowances, Deductions, Gross, Net) that calculate payslip lines."
        actions={
          can('MANAGE_SALARY_STRUCTURES') && (
            <button
              onClick={() => navigate('/payroll-config/structures/new')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Salary Structure
            </button>
          )
        }
      />

      <DataTable
        columns={columns}
        data={structuresList}
        isLoading={isLoading}
        emptyMessage="No salary structures found. Click 'Create Salary Structure' to define one."
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => deleteMutation.mutate(structureToDelete.id)}
        title="Delete Salary Structure"
        message={`Are you sure you want to delete structure "${structureToDelete?.name}"?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
