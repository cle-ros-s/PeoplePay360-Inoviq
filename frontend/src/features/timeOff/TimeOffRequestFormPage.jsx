import React, { useEffect } from 'react';
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

const requestSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  timeOffTypeId: z.string().min(1, 'Time off type is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  duration: z.preprocess((v) => parseFloat(v), z.number().min(0.5, 'Duration must be at least 0.5')),
  reason: z.string().optional().nullable(),
});

export default function TimeOffRequestFormPage({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const { isEmployee, employeeId: currentEmpId } = usePermissions();

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
    formState: { errors },
  } = useForm({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      employeeId: isEmployee ? currentEmpId : '',
      timeOffTypeId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      duration: 1,
      reason: '',
    },
  });

  const startDateVal = watch('startDate');
  const endDateVal = watch('endDate');

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
      onClose();
    },
  });

  const onSubmit = (values) => {
    createMutation.mutate({
      ...values,
      startDate: new Date(values.startDate).toISOString(),
      endDate: new Date(values.endDate).toISOString(),
    });
  };

  const typeOptions = timeOffTypes.map((t) => ({ value: t.id, label: `${t.name} (${t.unit})` }));
  const employeeOptions = employees.map((e) => ({ value: e.id, label: `${e.name} (${e.jobPosition})` }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Time Off Request" description="Submit a new leave request for approval.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {!isEmployee && (
          <SelectField label="Employee" name="employeeId" options={employeeOptions} register={register} error={errors.employeeId} required />
        )}

        <SelectField label="Time Off Type" name="timeOffTypeId" options={typeOptions} register={register} error={errors.timeOffTypeId} required />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DateField label="Start Date" name="startDate" register={register} error={errors.startDate} required />
          <DateField label="End Date" name="endDate" register={register} error={errors.endDate} required />
        </div>

        <FormField label="Duration (in days or hours)" name="duration" type="number" step="0.5" register={register} error={errors.duration} required />

        <FormField label="Reason for Leave" name="reason" register={register} error={errors.reason} placeholder="e.g. Annual family vacation" />

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
            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
          >
            {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
