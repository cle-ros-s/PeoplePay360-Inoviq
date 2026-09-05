import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salaryStructuresApi } from '../../api/salaryStructures.api';
import PageHeader from '../../components/common/PageHeader';
import FormField from '../../components/common/FormField';
import LoadingState from '../../components/common/LoadingState';
import { ArrowLeft, Save } from 'lucide-react';

const structureSchema = z.object({
  name: z.string().min(1, 'Structure name is required'),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
});

export default function SalaryStructureFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNewMode = !id || id === 'new';

  const { data: structureData, isLoading } = useQuery({
    queryKey: ['salary-structure', id],
    queryFn: () => salaryStructuresApi.getSalaryStructureById(id),
    enabled: !!id && id !== 'new',
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(structureSchema),
    defaultValues: {
      name: '',
      description: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (structureData) {
      reset({
        name: structureData.name || '',
        description: structureData.description || '',
        isActive: structureData.isActive ?? true,
      });
    }
  }, [structureData, reset]);

  const createMutation = useMutation({
    mutationFn: salaryStructuresApi.createSalaryStructure,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['salary-structures'] });
      navigate(`/payroll-config/structures/${data.id}/rules`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => salaryStructuresApi.updateSalaryStructure(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-structures'] });
      queryClient.invalidateQueries({ queryKey: ['salary-structure', id] });
      navigate('/payroll-config/structures');
    },
  });

  const onSubmit = (values) => {
    const payload = {
      ...values,
      code: values.code || values.name.toUpperCase().replace(/[^A-Z0-9]/g, '_').slice(0, 30),
    };
    if (isNewMode) {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate(payload);
    }
  };

  if (isLoading && !isNewMode) {
    return <LoadingState message="Loading structure details..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={isNewMode ? 'Create Salary Structure' : `Edit ${structureData?.name || 'Structure'}`}
        description="Define a salary structure container. Rules assigned to this structure dictate calculation of payslips."
        actions={
          <button
            type="button"
            onClick={() => navigate('/payroll-config/structures')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Structures
          </button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6 max-w-2xl">
        <FormField label="Structure Name" name="name" register={register} error={errors.name} required placeholder="e.g. Regular Executive Salary" />
        <FormField label="Description" name="description" register={register} error={errors.description} placeholder="e.g. Standard salary structure with BASIC, HRA, PF, GROSS, and NET" />

        <label className="flex items-center gap-2.5 cursor-pointer pt-2">
          <input type="checkbox" {...register('isActive')} className="w-4 h-4 text-blue-600 rounded border-gray-300" />
          <span className="text-sm font-medium text-gray-900">Active Structure</span>
        </label>

        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate('/payroll-config/structures')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : isNewMode ? 'Create Structure & Add Rules' : 'Save Structure'}
          </button>
        </div>
      </form>
    </div>
  );
}
