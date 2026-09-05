import React from 'react';
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

const allocationSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  timeOffTypeId: z.string().min(1, 'Time off type is required'),
  allocatedAmount: z.preprocess((v) => parseFloat(v), z.number().min(0.5, 'Amount must be positive')),
  validFrom: z.string().min(1, 'Valid from date is required'),
  validTo: z.string().min(1, 'Valid to date is required'),
  status: z.nativeEnum(AllocationStatus),
});

export default function AllocationFormPage({ isOpen, onClose }) {
  const queryClient = useQueryClient();

  const { data: typesData } = useQuery({
    queryKey: ['time-off-types'],
    queryFn: () => timeOffTypesApi.getTimeOffTypes(),
  });
  const timeOffTypes = typesData?.data || (Array.isArray(typesData) ? typesData : []);

  const { data: empData } = useQuery({
    queryKey: ['employees-all'],
    queryFn: () => employeesApi.getEmployees({ pageSize: 100 }),
  });
  const employees = empData?.data || (Array.isArray(empData) ? empData : []);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(allocationSchema),
    defaultValues: {
      employeeId: '',
      timeOffTypeId: '',
      allocatedAmount: 12,
      validFrom: `${new Date().getFullYear()}-01-01`,
      validTo: `${new Date().getFullYear()}-12-31`,
      status: AllocationStatus.APPROVED,
    },
  });

  const createMutation = useMutation({
    mutationFn: allocationsApi.createAllocation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allocations'] });
      onClose();
    },
  });

  const onSubmit = (values) => {
    createMutation.mutate({
      ...values,
      validFrom: new Date(values.validFrom).toISOString(),
      validTo: new Date(values.validTo).toISOString(),
    });
  };

  const typeOptions = timeOffTypes.map((t) => ({ value: t.id, label: `${t.name} (${t.unit})` }));
  const employeeOptions = employees.map((e) => ({ value: e.id, label: `${e.name} (${e.jobPosition})` }));
  const statusOptions = Object.values(AllocationStatus).map((s) => ({ value: s, label: formatEnumLabel(s) }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Grant Leave Allocation" description="Allocate leave quota for an employee.">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <SelectField label="Employee" name="employeeId" options={employeeOptions} register={register} error={errors.employeeId} required />
        <SelectField label="Time Off Type" name="timeOffTypeId" options={typeOptions} register={register} error={errors.timeOffTypeId} required />
        <FormField label="Allocated Amount (Days or Hours)" name="allocatedAmount" type="number" step="0.5" register={register} error={errors.allocatedAmount} required />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DateField label="Valid From" name="validFrom" register={register} error={errors.validFrom} required />
          <DateField label="Valid To" name="validTo" register={register} error={errors.validTo} required />
        </div>

        <SelectField label="Allocation Status" name="status" options={statusOptions} register={register} error={errors.status} required />

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
            {createMutation.isPending ? 'Granting...' : 'Grant Allocation'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
