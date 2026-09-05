import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timeOffTypesApi } from '../../api/timeOffTypes.api';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import TimeOffTypeFormPage from './TimeOffTypeFormPage';
import { Plus, Edit2, Trash2, Palmtree, Check, X } from 'lucide-react';
import { formatEnumLabel } from '../../utils/formatters';

export default function TimeOffTypesPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [typeToDelete, setTypeToDelete] = useState(null);

  const { data: typesData, isLoading } = useQuery({
    queryKey: ['time-off-types'],
    queryFn: () => timeOffTypesApi.getTimeOffTypes(),
  });
  const typesList = typesData?.data || (Array.isArray(typesData) ? typesData : []);

  const deleteMutation = useMutation({
    mutationFn: timeOffTypesApi.deleteTimeOffType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off-types'] });
      setDeleteConfirmOpen(false);
      setTypeToDelete(null);
    },
  });

  const handleOpenCreate = () => {
    setSelectedType(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (type, e) => {
    e.stopPropagation();
    setSelectedType(type);
    setModalOpen(true);
  };

  const handleOpenDelete = (type, e) => {
    e.stopPropagation();
    setTypeToDelete(type);
    setDeleteConfirmOpen(true);
  };

  const columns = [
    {
      header: 'Type Name',
      accessorKey: 'name',
      render: (t) => (
        <div className="flex items-center gap-2 font-semibold text-gray-900">
          <div
            className="w-3.5 h-3.5 rounded-full"
            style={{ backgroundColor: t.color || '#2563eb' }}
          />
          {t.name}
        </div>
      ),
    },
    {
      header: 'Unit',
      accessorKey: 'unit',
      render: (t) => (
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
          {formatEnumLabel(t.unit)}
        </span>
      ),
    },
    {
      header: 'Requires Allocation',
      accessorKey: 'requiresAllocation',
      render: (t) =>
        t.requiresAllocation ? (
          <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Yes
          </span>
        ) : (
          <span className="text-gray-400 text-xs flex items-center gap-1">
            <X className="w-3.5 h-3.5" /> No
          </span>
        ),
    },
    {
      header: 'Requires Approval',
      accessorKey: 'requiresApproval',
      render: (t) =>
        t.requiresApproval ? (
          <span className="text-emerald-700 font-semibold text-xs flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> Yes
          </span>
        ) : (
          <span className="text-gray-400 text-xs flex items-center gap-1">
            <X className="w-3.5 h-3.5" /> No
          </span>
        ),
    },
    {
      header: 'Actions',
      render: (t) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => handleOpenEdit(t, e)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Type"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => handleOpenDelete(t, e)}
            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Type"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Time Off Types"
        description="Configure organizational leave policies, allocation rules, and approval workflows."
        actions={
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Time Off Type
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={typesList}
        isLoading={isLoading}
        emptyMessage="No time off types configured."
      />

      {modalOpen && (
        <TimeOffTypeFormPage
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          timeOffType={selectedType}
        />
      )}

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => deleteMutation.mutate(typeToDelete.id)}
        title="Delete Time Off Type"
        message={`Are you sure you want to delete leave type "${typeToDelete?.name}"?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
