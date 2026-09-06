import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { payrunsApi } from '../../api/payruns.api';
import { salaryStructuresApi } from '../../api/salaryStructures.api';
import { departmentsApi } from '../../api/departments.api';
import FormField from '../../components/common/FormField';
import SelectField from '../../components/common/SelectField';
import DateField from '../../components/common/DateField';
import { EmployeeType } from '../../utils/constants';
import { formatEnumLabel } from '../../utils/formatters';
import { ArrowRight, Filter } from 'lucide-react';

const scopeSchema = z.object({
  name: z.string().min(1, 'Payrun batch name is required'),
  salaryStructureId: z.string().min(1, 'Salary structure is required'),
  periodStart: z.string().min(1, 'Period start date is required'),
  periodEnd: z.string().min(1, 'Period end date is required'),
  employeeTypeFilter: z.string().optional().nullable(),
  departmentFilterId: z.string().optional().nullable(),
});

export default function Step1Scope({ onScopeSubmitted, scopeData }) {
  // Fetch salary structures
  const { data: structuresData } = useQuery({
    queryKey: ['salary-structures'],
    queryFn: () => salaryStructuresApi.getSalaryStructures(),
  });
  const salaryStructures = structuresData?.data || (Array.isArray(structuresData) ? structuresData : []);

  // Fetch departments
  const { data: deptData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.getDepartments(),
  });
  const departments = deptData?.data || (Array.isArray(deptData) ? deptData : []);

  const today = new Date();
  const firstDayMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDayMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(scopeSchema),
    defaultValues: {
      name: scopeData?.name || `Payrun ${today.toLocaleString('default', { month: 'short' })} ${today.getFullYear()}`,
      salaryStructureId: scopeData?.salaryStructureId || '',
      periodStart: scopeData?.periodStart || firstDayMonth,
      periodEnd: scopeData?.periodEnd || lastDayMonth,
      employeeTypeFilter: scopeData?.employeeTypeFilter || '',
      departmentFilterId: scopeData?.departmentFilterId || '',
    },
  });

  const fetchEligibleMutation = useMutation({
    mutationFn: (params) => payrunsApi.getEligibleEmployees(params),
    onSuccess: (data, variables) => {
      const eligibleList = Array.isArray(data)
        ? data
        : data?.eligibleEmployees || data?.data || [];
      onScopeSubmitted({
        ...variables,
        name: variables.name,
        eligibleEmployees: eligibleList,
      });
    },
  });

  const onSubmit = (values) => {
    const payload = {
      name: values.name?.trim() || values.name,
      salaryStructureId: values.salaryStructureId,
      periodStart: new Date(values.periodStart).toISOString(),
      periodEnd: new Date(values.periodEnd).toISOString(),
      departmentId: values.departmentFilterId || undefined,
      employeeType: values.employeeTypeFilter || undefined,
      departmentFilterId: values.departmentFilterId || undefined,
      employeeTypeFilter: values.employeeTypeFilter || undefined,
    };
    fetchEligibleMutation.mutate(payload);
  };

  const structureOptions = salaryStructures.map((s) => ({ value: s.id, label: s.name }));
  const departmentOptions = departments.map((d) => ({ value: d.id, label: d.name }));
  const typeOptions = Object.values(EmployeeType).map((t) => ({ value: t, label: formatEnumLabel(t) }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-base font-bold text-gray-900">Step 1: Define Payrun Scope & Period</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Select salary structure and date range. The backend will evaluate active contracts and filter eligible employees.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField label="Payrun Batch Name" name="name" register={register} error={errors.name} required placeholder="e.g. October 2026 Monthly Payroll" />
        <SelectField label="Salary Structure" name="salaryStructureId" options={structureOptions} register={register} error={errors.salaryStructureId} required />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DateField label="Period Start Date" name="periodStart" register={register} error={errors.periodStart} required />
        <DateField label="Period End Date" name="periodEnd" register={register} error={errors.periodEnd} required />
      </div>

      <div className="p-4 bg-gray-50/70 rounded-xl border border-gray-200 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 uppercase tracking-wider">
          <Filter className="w-4 h-4 text-blue-600" />
          Optional Staff Scope Filters
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SelectField label="Employee Type Filter" name="employeeTypeFilter" options={typeOptions} register={register} error={errors.employeeTypeFilter} placeholder="All Employee Types" />
          <SelectField label="Department Filter" name="departmentFilterId" options={departmentOptions} register={register} error={errors.departmentFilterId} placeholder="All Departments" />
        </div>
      </div>

      {fetchEligibleMutation.isError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
          {fetchEligibleMutation.error?.response?.data?.error?.message ||
            fetchEligibleMutation.error?.message ||
            'Failed to fetch eligible employees for selected scope.'}
        </div>
      )}

      <div className="flex items-center justify-end pt-4">
        <button
          type="submit"
          disabled={fetchEligibleMutation.isPending}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm disabled:opacity-50 transition-colors"
        >
          {fetchEligibleMutation.isPending ? 'Fetching Eligible Staff...' : 'Continue to Employee Selection'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}
