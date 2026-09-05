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
import { Building, Plus, Edit2, Trash2, Users } from 'lucide-react';

const deptSchema = z.object({
    name: z.string().min(1, 'Department name is required'),
});

export default function DepartmentsPage() {
    const queryClient = useQueryClient();
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedDept, setSelectedDept] = useState(null);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deptToDelete, setDeptToDelete] = useState(null);

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
        defaultValues: { name: '' },
    });

    const createMutation = useMutation({
        mutationFn: departmentsApi.createDepartment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            setModalOpen(false);
            reset();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }) => departmentsApi.updateDepartment(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            setModalOpen(false);
            reset();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: departmentsApi.deleteDepartment,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            setDeleteConfirmOpen(false);
            setDeptToDelete(null);
        },
    });

    const handleOpenCreate = () => {
        setSelectedDept(null);
        reset({ name: '' });
        setModalOpen(true);
    };

    const handleOpenEdit = (dept, e) => {
        e.stopPropagation();
        setSelectedDept(dept);
        reset({ name: dept.name });
        setModalOpen(true);
    };

    const handleOpenDelete = (dept, e) => {
        e.stopPropagation();
        setDeptToDelete(dept);
        setDeleteConfirmOpen(true);
    };

    const onSubmit = (values) => {
        if (selectedDept) {
            updateMutation.mutate({ id: selectedDept.id, data: values });
        } else {
            createMutation.mutate(values);
        }
    };

    const columns = [
        {
            header: 'Department Name',
            accessorKey: 'name',
            render: (dept) => (
                <span className="font-semibold text-gray-900 flex items-center gap-2">
                    <Building className="w-4 h-4 text-blue-600" />
                    {dept.name}
                </span>
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
        <div>
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
                description="Specify a unique department name for organizational classification."
            >
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <FormField label="Department Name" name="name" register={register} error={errors.name} required placeholder="e.g. Human Resources" />
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
                            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
                        >
                            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : selectedDept ? 'Update Department' : 'Create Department'}
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
            />
        </div>
    );
}