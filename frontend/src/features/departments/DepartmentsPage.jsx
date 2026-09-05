import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentsApi } from '../../api/departments.api';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import Modal from '../../components/common/Modal';
import FormField from '../../components/common/FormField';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building, Plus, Edit2, Trash2, Users, CheckCircle2, AlertCircle } from 'lucide-react';

const deptSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  code: z.string().optional().nullable(),
});

export default function DepartmentsPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deptToDelete, setDeptToDelete] = useState(null);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const { data: deptData, isLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.getDepartments(),
  });
  const departmentsList = deptData?.data || (Array.isArray(deptData) ? deptData : []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(deptSchema),
    defaultValues: { name: '', code: '' },
  });

  const createMutation = useMutation({
    mutationFn: departmentsApi.createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-salary-cost'] });
      setModalOpen(false);
      reset();
      setFeedback({ type: 'success', message: 'Department created and stored successfully!' });
    },
    onError: (err) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to create department';
      setFeedback({ type: 'error', message: msg });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => departmentsApi.updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-salary-cost'] });
      setModalOpen(false);
      reset();
      setFeedback({ type: 'success', message: 'Department updated successfully!' });
    },
    onError: (err) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to update department';
      setFeedback({ type: 'error', message: msg });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: departmentsApi.deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-salary-cost'] });
      setDeleteConfirmOpen(false);
      setDeptToDelete(null);
      setFeedback({ type: 'success', message: 'Department removed successfully.' });
    },
    onError: (err) => {
      setDeleteConfirmOpen(false);
      const msg = err.response?.data?.error?.message || err.message || 'Failed to delete department';
      setFeedback({ type: 'error', message: msg });
    },
  });

  const handleOpenCreate = () => {
    setSelectedDept(null);
    reset({ name: '', code: '' });
    setModalOpen(true);
    setFeedback({ type: '', message: '' });
  };

  const handleOpenEdit = (dept, e) => {
    e.stopPropagation();
    setSelectedDept(dept);
    reset({ name: dept.name, code: dept.code || '' });
    setModalOpen(true);
    setFeedback({ type: '', message: '' });
  };

  const handleOpenDelete = (dept, e) => {
    e.stopPropagation();
    setDeptToDelete(dept);
    setDeleteConfirmOpen(true);
    setFeedback({ type: '', message: '' });
  };

  const onSubmit = (values) => {
    const payload = {
      name: values.name.trim(),
      code: values.code ? values.code.trim().toUpperCase() : undefined,
    };
    if (selectedDept) {
      updateMutation.mutate({ id: selectedDept.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const columns = [
    {
      header: 'Department Name',
      accessorKey: 'name',
      render: (dept) => (
        <div>
          <span className="font-semibold text-gray-900 flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-600" />
            {dept.name}
          </span>
          {dept.code && <span className="text-[11px] font-mono text-gray-500">{dept.code}</span>}
        </div>
      ),
    },
    {
      header: 'Assigned Employees',
      accessorKey: 'employees',
      render: (dept) => (
        <span className="text-gray-600 font-medium inline-flex items-center gap-1.5">
          <Users className="w-4 h-4 text-gray-400" />
          {dept._count?.employees ?? (dept.employees ? dept.employees.length : 0)} employees
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (dept) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => handleOpenEdit(dept, e)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Edit Department"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => handleOpenDelete(dept, e)}
            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Department"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Departments"
        description="Organize employee structures and analyze cost distribution across business departments."
        actions={
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Department
          </button>
        }
      />

      {feedback.message && (
        <div
          className={`p-4 rounded-xl border flex items-start justify-between gap-3 text-sm shadow-sm ${
            feedback.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-start gap-3">
            {feedback.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">
                {feedback.type === 'error' ? 'Operation Failed' : 'Success'}
              </p>
              <p className="text-xs mt-0.5">{feedback.message}</p>
            </div>
          </div>
          <button
            onClick={() => setFeedback({ type: '', message: '' })}
            className="text-xs font-semibold underline opacity-80 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      <DataTable
        columns={columns}
        data={departmentsList}
        isLoading={isLoading}
        emptyMessage="No departments found. Click 'Add Department' to create one."
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedDept ? 'Edit Department' : 'Create Department'}
        description="Specify a department name and optional unique code for organizational classification."
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            label="Department Name"
            name="name"
            register={register}
            error={errors.name}
            required
            placeholder="e.g. Engineering, Sales, Human Resources"
          />
          <FormField
            label="Department Code (Optional)"
            name="code"
            register={register}
            error={errors.code}
            placeholder="e.g. ENG, SALES, HR (auto-generated if empty)"
          />
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : selectedDept
                ? 'Update Department'
                : 'Create Department'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => deleteMutation.mutate(deptToDelete.id)}
        title="Delete Department"
        message={`Are you sure you want to delete department "${deptToDelete?.name}"?`}
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
    </div>
  );
}