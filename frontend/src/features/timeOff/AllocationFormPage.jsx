import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { allocationsApi } from '../../api/allocations.api';
import { timeOffTypesApi } from '../../api/timeOffTypes.api';
import { employeesApi } from '../../api/employees.api';
import Modal from '../../components/common/Modal';
import FormField from '../../components/common/FormField';
import SelectField from '../../components/common/SelectField';
import DateField from '../../components/common/DateField';
import { AllocationStatus } from '../../utils/constants';
import { formatEnumLabel } from '../../utils/formatters';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const allocationSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  timeOffTypeId: z.string().min(1, 'Time off type is required'),
  allocatedAmount: z.preprocess((v) => parseFloat(v), z.number().min(0.5, 'Amount must be at least 0.5')),
  validFrom: z.string().min(1, 'Valid from date is required'),
  validTo: z.string().min(1, 'Valid to date is required'),
  status: z.nativeEnum(AllocationStatus).default(AllocationStatus.APPROVED),
});

export default function AllocationFormPage({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { data: typesData } = useQuery({
    queryKey: ['time-off-types'],
    queryFn: () => timeOffTypesApi.getTimeOffTypes(),
    enabled: !!isOpen,
  });
  const timeOffTypes = typesData?.data || (Array.isArray(typesData) ? typesData : []);

  const { data: empData } = useQuery({
    queryKey: ['employees-all'],
    queryFn: () => employeesApi.getEmployees({ pageSize: 100 }),
    enabled: !!isOpen,
  });
  const employees = empData?.data || (Array.isArray(empData) ? empData : []);

  const currentYear = new Date().getFullYear();

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(allocationSchema),
    defaultValues: {
      employeeId: '',
      timeOffTypeId: '',
      allocatedAmount: 15,
      validFrom: `${currentYear}-01-01`,
      validTo: `${currentYear}-12-31`,
      status: AllocationStatus.APPROVED,
    },
  });

  useEffect(() => {
    if (isOpen) {
      setErrorMessage('');
      setSuccessMessage('');
      const defaultEmp = employees[0]?.id || '';
      const defaultType = timeOffTypes[0]?.id || '';

      reset({
        employeeId: defaultEmp,
        timeOffTypeId: defaultType,
        allocatedAmount: 15,
        validFrom: `${currentYear}-01-01`,
        validTo: `${currentYear}-12-31`,
        status: AllocationStatus.APPROVED,
      });
    }
  }, [isOpen, employees, timeOffTypes]);

  useEffect(() => {
    if (isOpen && employees.length > 0 && !getValues('employeeId')) {
      setValue('employeeId', employees[0].id, { shouldValidate: true });
    }
  }, [isOpen, employees, getValues, setValue]);

  useEffect(() => {
    if (isOpen && timeOffTypes.length > 0 && !getValues('timeOffTypeId')) {
      setValue('timeOffTypeId', timeOffTypes[0].id, { shouldValidate: true });
    }
  }, [isOpen, timeOffTypes, getValues, setValue]);

  const createMutation = useMutation({
    mutationFn: allocationsApi.createAllocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-timeoff-overview'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      setSuccessMessage('Leave allocation granted and activated successfully!');
      setErrorMessage('');
      setTimeout(() => {
        reset();
        onClose();
      }, 700);
    },
    onError: (err) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to create leave allocation';
      setErrorMessage(msg);
      setSuccessMessage('');
    },
  });

  const onSubmit = (values) => {
    setErrorMessage('');
    setSuccessMessage('');

    if (new Date(values.validTo) <= new Date(values.validFrom)) {
      setErrorMessage('Valid To date must be strictly after Valid From date.');
      return;
    }

    createMutation.mutate({
      ...values,
      allocatedAmount: Number(values.allocatedAmount),
      validFrom: new Date(values.validFrom).toISOString(),
      validTo: new Date(values.validTo).toISOString(),
    });
  };

  const typeOptions = timeOffTypes.map((t) => ({ value: t.id, label: `${t.name} (${t.unit || 'DAYS'})` }));
  const employeeOptions = employees.map((e) => {
    const name = e.name || `${e.firstName || ''} ${e.lastName || ''}`.trim() || e.email || 'Employee';
    const pos = e.jobPosition ? ` (${e.jobPosition})` : '';
    return { value: e.id, label: `${name}${pos}` };
  });
  const statusOptions = Object.values(AllocationStatus).map((s) => ({ value: s, label: formatEnumLabel(s) }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Grant Leave Allocation" description="Allocate leave balance quota for an employee.">
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
        <SelectField
          label="Employee"
          name="employeeId"
          options={employeeOptions}
          register={register}
          error={errors.employeeId}
          required
          placeholder="Select Employee..."
        />

        <SelectField
          label="Time Off Type"
          name="timeOffTypeId"
          options={typeOptions}
          register={register}
          error={errors.timeOffTypeId}
          required
          placeholder="Select Leave Type..."
        />

        <FormField
          label="Allocated Amount (Days or Hours)"
          name="allocatedAmount"
          type="number"
          step="0.5"
          register={register}
          error={errors.allocatedAmount}
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DateField label="Valid From" name="validFrom" register={register} error={errors.validFrom} required />
          <DateField label="Valid To" name="validTo" register={register} error={errors.validTo} required />
        </div>

        <SelectField
          label="Allocation Status"
          name="status"
          options={statusOptions}
          register={register}
          error={errors.status}
          required
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
            className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50 transition-colors shadow-sm"
          >
            {createMutation.isPending ? 'Granting Allocation...' : 'Grant Allocation'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
