import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timeOffRequestsApi } from '../../api/timeOffRequests.api';
import { timeOffTypesApi } from '../../api/timeOffTypes.api';
import { employeesApi } from '../../api/employees.api';
import { usePermissions } from '../../hooks/usePermissions';
import Modal from '../../components/common/Modal';
import FormField from '../../components/common/FormField';
import SelectField from '../../components/common/SelectField';
import DateField from '../../components/common/DateField';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const requestSchema = z.object({
  employeeId: z.string().optional().nullable(),
  timeOffTypeId: z.string().min(1, 'Time off type is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  duration: z.preprocess((v) => parseFloat(v) || 1, z.number().min(0.5, 'Duration must be at least 0.5')),
  reason: z.string().optional().nullable(),
});

export default function TimeOffRequestFormPage({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const { isEmployee, employeeId: currentEmpId } = usePermissions();

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { data: typesData } = useQuery({
    queryKey: ['time-off-types'],
    queryFn: () => timeOffTypesApi.getTimeOffTypes(),
  });
  const timeOffTypes = typesData?.data || (Array.isArray(typesData) ? typesData : []);

  const { data: empData } = useQuery({
    queryKey: ['employees-all'],
    queryFn: () => employeesApi.getEmployees({ pageSize: 100 }),
    enabled: !isEmployee,
  });
  const employees = empData?.data || (Array.isArray(empData) ? empData : []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      employeeId: isEmployee ? (currentEmpId || '') : '',
      timeOffTypeId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      duration: 1,
      reason: '',
    },
  });

  const startDateVal = watch('startDate');
  const endDateVal = watch('endDate');

  // Sync employeeId and default type when modal opens or permissions load
  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setSuccessMessage('');
      if (isEmployee && currentEmpId) {
        setValue('employeeId', currentEmpId);
      } else if (!isEmployee && employees.length > 0) {
        setValue('employeeId', (prev) => prev || employees[0].id);
      }
      if (timeOffTypes.length > 0) {
        setValue('timeOffTypeId', (prev) => prev || timeOffTypes[0].id);
      }
    }
  }, [isOpen, isEmployee, currentEmpId, employees, timeOffTypes, setValue]);

  // Calculate default duration in days when dates change
  useEffect(() => {
    if (startDateVal && endDateVal) {
      const s = new Date(startDateVal);
      const e = new Date(endDateVal);
      const diffTime = e - s;
      if (diffTime >= 0) {
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setValue('duration', diffDays);
      }
    }
  }, [startDateVal, endDateVal, setValue]);

  const createMutation = useMutation({
    mutationFn: timeOffRequestsApi.createTimeOffRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-off-requests'] });
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-timeoff-overview'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      setSuccessMessage('Time off request created and submitted successfully!');
      setErrorMessage('');
      setTimeout(() => {
        reset();
        onClose();
      }, 700);
    },
    onError: (err) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to submit time off request';
      setErrorMessage(msg);
      setSuccessMessage('');
    },
  });

  const onSubmit = (values) => {
    setErrorMessage('');
    setSuccessMessage('');

    let resolvedEmployeeId = isEmployee ? currentEmpId : (values.employeeId || currentEmpId);
    if (!resolvedEmployeeId && employees.length > 0) {
      resolvedEmployeeId = employees[0].id;
    }

    const payload = {
      ...values,
      employeeId: resolvedEmployeeId || undefined,
      startDate: values.startDate,
      endDate: values.endDate,
      duration: Number(values.duration) || 1,
    };
    createMutation.mutate(payload);
  };

  const typeOptions = timeOffTypes.map((t) => ({ value: t.id, label: `${t.name} (${t.unit})` }));
  const employeeOptions = employees.map((e) => ({
    value: e.id,
    label: `${e.name || `${e.firstName} ${e.lastName}`} (${e.jobPosition})`,
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Time Off Request" description="Submit a new leave request for approval.">
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
        {!isEmployee && (
          <SelectField
            label="Employee"
            name="employeeId"
            options={employeeOptions}
            register={register}
            error={errors.employeeId}
            required
            placeholder="Select Employee..."
          />
        )}

        <SelectField
          label="Time Off Type"
          name="timeOffTypeId"
          options={typeOptions}
          register={register}
          error={errors.timeOffTypeId}
          required
          placeholder="Select Leave Type..."
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DateField label="Start Date" name="startDate" register={register} error={errors.startDate} required />
          <DateField label="End Date" name="endDate" register={register} error={errors.endDate} required />
        </div>

        <FormField
          label="Duration (in days or hours)"
          name="duration"
          type="number"
          step="0.5"
          register={register}
          error={errors.duration}
          required
        />

        <FormField
          label="Reason for Leave"
          name="reason"
          register={register}
          error={errors.reason}
          placeholder="e.g. Annual family vacation, Medical checkup"
        />

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
            disabled={createMutation.isPending}
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50 transition-colors shadow-sm"
          >
            {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
