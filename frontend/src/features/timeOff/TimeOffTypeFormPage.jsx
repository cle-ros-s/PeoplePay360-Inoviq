import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { timeOffTypesApi } from '../../api/timeOffTypes.api';
import Modal from '../../components/common/Modal';
import FormField from '../../components/common/FormField';
import SelectField from '../../components/common/SelectField';
import { TimeOffUnit } from '../../utils/constants';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const typeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().optional().nullable(),
  unit: z.nativeEnum(TimeOffUnit),
  requiresAllocation: z.boolean().default(true),
  requiresApproval: z.boolean().default(true),
  color: z.string().optional().nullable(),
});

export default function TimeOffTypeFormPage({ isOpen, onClose, timeOffType }) {
  const queryClient = useQueryClient();
  const isEditing = !!timeOffType;

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(typeSchema),
    defaultValues: {
      name: '',
      code: '',
      unit: TimeOffUnit.DAYS,
      requiresAllocation: true,
      requiresApproval: true,
      color: '#2563eb',
    },
  });

  useEffect(() => {
    setErrorMessage('');
    setSuccessMessage('');
    if (timeOffType) {
      reset({
        name: timeOffType.name || '',
        code: timeOffType.code || '',
        unit: timeOffType.unit || TimeOffUnit.DAYS,
        requiresAllocation: timeOffType.requiresAllocation ?? true,
        requiresApproval: timeOffType.requiresApproval ?? true,
        color: timeOffType.color || '#2563eb',
      });
    } else {
      reset({
        name: '',
        code: '',
        unit: TimeOffUnit.DAYS,
        requiresAllocation: true,
        requiresApproval: true,
        color: '#2563eb',
      });
    }
  }, [timeOffType, isOpen, reset]);

  const createMutation = useMutation({
    mutationFn: timeOffTypesApi.createTimeOffType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off-types'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setSuccessMessage('New Time Off Type created successfully!');
      setTimeout(() => {
        onClose();
      }, 700);
    },
    onError: (err) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to create time off type';
      setErrorMessage(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => timeOffTypesApi.updateTimeOffType(timeOffType.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off-types'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      setSuccessMessage('Time Off Type updated successfully!');
      setTimeout(() => {
        onClose();
      }, 700);
    },
    onError: (err) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to update time off type';
      setErrorMessage(msg);
    },
  });

  const onSubmit = (values) => {
    setErrorMessage('');
    setSuccessMessage('');
    const payload = {
      ...values,
      code: values.code ? values.code.trim().toUpperCase() : undefined,
    };
    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const unitOptions = Object.values(TimeOffUnit).map((u) => ({ value: u, label: u }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Time Off Type' : 'Create Time Off Type'}
      description="Configure leave policy rules, units, and allocations."
    >
      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <FormField label="Type Name" name="name" register={register} error={errors.name} required placeholder="e.g. Paid Annual Leave, Sick Leave" />
        <FormField label="Type Code (Optional)" name="code" register={register} error={errors.code} placeholder="e.g. ANNUAL, SICK (auto-generated if empty)" />
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
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors shadow-sm"
          >
            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : isEditing ? 'Update Type' : 'Create Type'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
