import React, { useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contractsApi } from '../../api/contracts.api';
import { employeesApi } from '../../api/employees.api';
import { departmentsApi } from '../../api/departments.api';
import { salaryStructuresApi } from '../../api/salaryStructures.api';
import PageHeader from '../../components/common/PageHeader';
import FormField from '../../components/common/FormField';
import SelectField from '../../components/common/SelectField';
import DateField from '../../components/common/DateField';
import LoadingState from '../../components/common/LoadingState';
import { ContractStatus } from '../../utils/constants';
import { formatEnumLabel } from '../../utils/formatters';
import { ArrowLeft, Save } from 'lucide-react';

const contractSchema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  departmentId: z.string().optional().nullable(),
  jobPosition: z.string().min(1, 'Job position is required'),
  wage: z.preprocess((val) => parseFloat(val), z.number().min(0, 'Wage must be positive')),
  salaryStructureId: z.string().min(1, 'Salary structure is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional().nullable(),
  status: z.nativeEnum(ContractStatus),
});

export default function ContractFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedEmployeeId = searchParams.get('employeeId');
  const queryClient = useQueryClient();

  const isNewMode = !id || id === 'new';

  // Fetch contract if editing
  const { data: contractData, isLoading: contractLoading } = useQuery({
    queryKey: ['contract', id],
    queryFn: () => contractsApi.getContractById(id),
    enabled: !!id && id !== 'new',
  });

  // Fetch options
  const { data: empData } = useQuery({
    queryKey: ['employees-all'],
    queryFn: () => employeesApi.getEmployees({ pageSize: 100 }),
  });
  const employees = empData?.data || (Array.isArray(empData) ? empData : []);

  const { data: deptData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.getDepartments(),
  });
  const departments = deptData?.data || (Array.isArray(deptData) ? deptData : []);

  const { data: structureData } = useQuery({
    queryKey: ['salary-structures'],
    queryFn: () => salaryStructuresApi.getSalaryStructures(),
  });
  const salaryStructures = structureData?.data || (Array.isArray(structureData) ? structureData : []);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(contractSchema),
    defaultValues: {
      employeeId: preselectedEmployeeId || '',
      departmentId: '',
      jobPosition: '',
      wage: 0,
      salaryStructureId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      status: ContractStatus.DRAFT,
    },
  });

  const selectedEmployeeId = watch('employeeId');

  // Auto-fill department and job position when employee changes
  useEffect(() => {
    if (selectedEmployeeId && isNewMode) {
      const emp = employees.find((e) => e.id === selectedEmployeeId);
      if (emp) {
        if (emp.departmentId) setValue('departmentId', emp.departmentId);
        if (emp.jobPosition) setValue('jobPosition', emp.jobPosition);
      }
    }
  }, [selectedEmployeeId, employees, isNewMode, setValue]);

  useEffect(() => {
    if (contractData) {
      reset({
        employeeId: contractData.employeeId || '',
        departmentId: contractData.departmentId || '',
        jobPosition: contractData.jobPosition || '',
        wage: parseFloat(contractData.wage) || 0,
        salaryStructureId: contractData.salaryStructureId || '',
        startDate: contractData.startDate ? contractData.startDate.split('T')[0] : '',
        endDate: contractData.endDate ? contractData.endDate.split('T')[0] : '',
        status: contractData.status || ContractStatus.DRAFT,
      });
    }
  }, [contractData, reset]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: contractsApi.createContract,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      navigate('/contracts');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => contractsApi.updateContract(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contract', id] });
      navigate('/contracts');
    },
  });

  const onSubmit = (formData) => {
    const payload = {
      ...formData,
      departmentId: formData.departmentId || null,
      endDate: formData.endDate || null,
    };
    if (isNewMode) {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate(payload);
    }
  };

  if (contractLoading && !isNewMode) {
    return <LoadingState message="Loading contract details..." />;
  }

  const employeeOptions = employees.map((e) => ({ value: e.id, label: `${e.name} (${e.jobPosition})` }));
  const departmentOptions = departments.map((d) => ({ value: d.id, label: d.name }));
  const structureOptions = salaryStructures.map((s) => ({ value: s.id, label: s.name }));
  const statusOptions = Object.values(ContractStatus).map((s) => ({ value: s, label: formatEnumLabel(s) }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={isNewMode ? 'Create Employment Contract' : 'Edit Contract Terms'}
        description="Configure wage rate, salary structure, and contract validity timeframe for payroll processing."
        actions={
          <button
            type="button"
            onClick={() => navigate('/contracts')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Contracts
          </button>
        }
      />

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SelectField
            label="Employee"
            name="employeeId"
            options={employeeOptions}
            register={register}
            error={errors.employeeId}
            required
            disabled={!isNewMode}
          />

          <SelectField
            label="Department"
            name="departmentId"
            options={departmentOptions}
            register={register}
            error={errors.departmentId}
            placeholder="Select Department..."
          />

          <FormField
            label="Job Position"
            name="jobPosition"
            register={register}
            error={errors.jobPosition}
            required
          />

          <FormField
            label="Contract Wage (Base Pay Amount)"
            name="wage"
            type="number"
            step="0.01"
            register={register}
            error={errors.wage}
            required
          />

          <SelectField
            label="Assigned Salary Structure"
            name="salaryStructureId"
            options={structureOptions}
            register={register}
            error={errors.salaryStructureId}
            required
          />

          <SelectField
            label="Contract Status"
            name="status"
            options={statusOptions}
            register={register}
            error={errors.status}
            required
          />

          <DateField
            label="Contract Start Date"
            name="startDate"
            register={register}
            error={errors.startDate}
            required
          />

          <DateField
            label="Contract End Date (Optional)"
            name="endDate"
            register={register}
            error={errors.endDate}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={() => navigate('/contracts')}
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
            {createMutation.isPending || updateMutation.isPending ? 'Saving Contract...' : isNewMode ? 'Create Contract' : 'Save Contract'}
          </button>
        </div>
      </form>
    </div>
  );
}
