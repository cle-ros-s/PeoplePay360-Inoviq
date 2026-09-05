import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { timeOffTypesApi } from '../../api/timeOffTypes.api';
import Modal from '../../components/common/Modal';
import FormField from '../../components/common/FormField';
import SelectField from '../../components/common/SelectField';
import { TimeOffUnit } from '../../utils/constants';

const typeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  unit: z.nativeEnum(TimeOffUnit),
  requiresAllocation: z.boolean().default(true),
  requiresApproval: z.boolean().default(true),
  color: z.string().optional().nullable(),
});

export default function TimeOffTypeFormPage({ isOpen, onClose, timeOffType }) {
  const queryClient = useQueryClient();
  const isEditing = !!timeOffType;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(typeSchema),
    defaultValues: {
      name: '',
      unit: TimeOffUnit.DAYS,
      requiresAllocation: true,
      requiresApproval: true,
      color: '#2563eb',
    },
  });

  useEffect(() => {
    if (timeOffType) {
      reset({
        name: timeOffType.name || '',
        unit: timeOffType.unit || TimeOffUnit.DAYS,
        requiresAllocation: timeOffType.requiresAllocation ?? true,
        requiresApproval: timeOffType.requiresApproval ?? true,
        color: timeOffType.color || '#2563eb',
      });
    } else {
      reset({
        name: '',
        unit: TimeOffUnit.DAYS,
        requiresAllocation: true,
        requiresApproval: true,
        color: '#2563eb',
      });
    }
  }, [timeOffType, reset]);

  const createMutation = useMutation({
    mutationFn: timeOffTypesApi.createTimeOffType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off-types'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => timeOffTypesApi.updateTimeOffType(timeOffType.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off-types'] });
      onClose();
    },
  });

  const onSubmit = (values) => {
    if (isEditing) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  const unitOptions = Object.values(TimeOffUnit).map((u) => ({ value: u, label: u }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Time Off Type' : 'Create Time Off Type'}
      description="Configure leave policy rules and units."
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Type Name" name="name" register={register} error={errors.name} required placeholder="e.g. Paid Annual Leave" />
        <SelectField label="Time Unit" name="unit" options={unitOptions} register={register} error={errors.unit} required />
        <FormField label="Display Color (Hex)" name="color" type="color" register={register} error={errors.color} />

        <div className="space-y-3 pt-2">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" {...register('requiresAllocation')} className="w-4 h-4 text-blue-600 rounded border-gray-300" />
            <span className="text-sm font-medium text-gray-900">Requires Approved Allocation</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input type="checkbox" {...register('requiresApproval')} className="w-4 h-4 text-blue-600 rounded border-gray-300" />
            <span className="text-sm font-medium text-gray-900">Requires Manager Approval</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
          >
            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : isEditing ? 'Update Type' : 'Create Type'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
