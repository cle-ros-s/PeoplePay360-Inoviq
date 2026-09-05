import React, { useEffect, useState } from 'react';
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
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { ContractStatus } from '../../utils/constants';
import { formatEnumLabel } from '../../utils/formatters';
import { ArrowLeft, Save, CheckCircle2, AlertCircle, Ban, List, PlusCircle } from 'lucide-react';

const contractSchema = z.object({
  name: z.string().optional().nullable(),
  employeeId: z.string().min(1, 'Employee is required'),
  departmentId: z.string().optional().nullable(),
  jobPosition: z.string().min(1, 'Job position is required'),
  wage: z.preprocess((val) => parseFloat(val), z.number().min(0, 'Wage must be a positive number')),
  salaryStructureId: z.string().min(1, 'Salary structure is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional().nullable(),
  status: z.string().default('RUNNING'),
});

export default function ContractFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedEmployeeId = searchParams.get('employeeId');
  const queryClient = useQueryClient();

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

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
      name: '',
      employeeId: preselectedEmployeeId || '',
      departmentId: '',
      jobPosition: '',
      wage: 50000,
      salaryStructureId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      status: 'RUNNING',
    },
  });

  const selectedEmployeeId = watch('employeeId');
  const currentStatus = watch('status');

  // Auto-fill defaults when employee is selected
  useEffect(() => {
    if (selectedEmployeeId && isNewMode) {
      const emp = employees.find((e) => e.id === selectedEmployeeId);
      if (emp) {
        if (emp.departmentId) setValue('departmentId', emp.departmentId);
        if (emp.jobPosition) setValue('jobPosition', emp.jobPosition);
        const empName = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim();
        setValue('name', `${empName} - Employment Contract`);
      }
    }
  }, [selectedEmployeeId, employees, isNewMode, setValue]);

  useEffect(() => {
    if (contractData) {
      reset({
        name: contractData.name || '',
        employeeId: contractData.employeeId || '',
        departmentId: contractData.departmentId || '',
        jobPosition: contractData.jobPosition || '',
        wage: parseFloat(contractData.wage) || 0,
        salaryStructureId: contractData.salaryStructureId || '',
        startDate: contractData.startDate ? contractData.startDate.split('T')[0] : '',
        endDate: contractData.endDate ? contractData.endDate.split('T')[0] : '',
        status: contractData.status || 'RUNNING',
      });
    }
  }, [contractData, reset]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: contractsApi.createContract,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      setSuccessMessage('Employment contract created and stored successfully! Status is active for payroll.');
      setErrorMessage('');
    },
    onError: (err) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to create contract';
      setErrorMessage(msg);
      setSuccessMessage('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => contractsApi.updateContract(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contract', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      setSuccessMessage('Contract updated successfully in database!');
      setErrorMessage('');
    },
    onError: (err) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to update contract';
      setErrorMessage(msg);
      setSuccessMessage('');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: () => contractsApi.updateContract(id, { status: 'CANCELLED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      queryClient.invalidateQueries({ queryKey: ['contract', id] });
      setValue('status', 'CANCELLED');
      setCancelModalOpen(false);
      setSuccessMessage('Contract has been successfully cancelled.');
      setErrorMessage('');
    },
    onError: (err) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to cancel contract';
      setErrorMessage(msg);
      setCancelModalOpen(false);
    },
  });

  const onSubmit = (formData) => {
    setErrorMessage('');
    setSuccessMessage('');

    const emp = employees.find((e) => e.id === formData.employeeId);
    const empName = emp ? emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() : 'Employee';
    const finalName = formData.name?.trim() || `${empName} - Employment Contract`;

    const payload = {
      ...formData,
      name: finalName,
      departmentId: formData.departmentId || null,
      endDate: formData.endDate || null,
      status: formData.status === 'ACTIVE' ? 'RUNNING' : formData.status || 'RUNNING',
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

  const employeeOptions = employees.map((e) => ({
    value: e.id,
    label: `${e.name || `${e.firstName} ${e.lastName}`} (${e.jobPosition})`,
  }));
  const departmentOptions = departments.map((d) => ({ value: d.id, label: d.name }));
  const structureOptions = salaryStructures.map((s) => ({ value: s.id, label: `${s.name} (${s.code})` }));
  const statusOptions = [
    { value: 'RUNNING', label: 'Active / Running' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'EXPIRED', label: 'Expired' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={isNewMode ? 'Create Employment Contract' : 'Edit Contract Terms'}
        description="Configure wage rate, salary structure, and contract validity timeframe for payroll processing."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/contracts')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Contracts
            </button>
            {!isNewMode && currentStatus !== 'CANCELLED' && (
              <button
                type="button"
                onClick={() => setCancelModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
              >
                <Ban className="w-4 h-4" />
                Cancel Contract
              </button>
            )}
          </div>
        }
      />

      {/* Success Notification Banner */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start justify-between gap-4 text-sm text-emerald-900 shadow-sm animate-in fade-in duration-200">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-emerald-800">Operation Successful</p>
              <p className="text-xs mt-0.5 text-emerald-700">{successMessage}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/contracts')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors"
            >
              <List className="w-3.5 h-3.5" />
              View Contracts
            </button>
            {isNewMode && (
              <button
                type="button"
                onClick={() => {
                  setSuccessMessage('');
                  reset({
                    name: '',
                    employeeId: '',
                    departmentId: '',
                    jobPosition: '',
                    wage: 50000,
                    salaryStructureId: '',
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: '',
                    status: 'RUNNING',
                  });
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Add Another
              </button>
            )}
          </div>
        </div>
      )}

      {/* Error Notification Banner */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-sm text-red-700 shadow-sm animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to process contract</p>
            <p className="text-xs mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
        <div className="border-b border-gray-100 pb-4">
          <h3 className="text-base font-bold text-gray-900 mb-1">Contract Parameters & Assignment</h3>
          <p className="text-xs text-gray-500">Employee assignment, position, structure reference, and compensation details.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <SelectField
            label="Employee"
            name="employeeId"
            options={employeeOptions}
            register={register}
            error={errors.employeeId}
            required
            disabled={!isNewMode}
            placeholder="Select Employee..."
          />

          <FormField
            label="Contract Name / Reference"
            name="name"
            register={register}
            error={errors.name}
            placeholder="e.g. John Doe - Full Time Contract"
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
            placeholder="e.g. Senior Software Engineer"
          />

          <FormField
            label="Contract Wage (Base Monthly Pay)"
            name="wage"
            type="number"
            step="0.01"
            register={register}
            error={errors.wage}
            required
            placeholder="e.g. 75000"
          />

          <SelectField
            label="Assigned Salary Structure"
            name="salaryStructureId"
            options={structureOptions}
            register={register}
            error={errors.salaryStructureId}
            required
            placeholder="Select Salary Structure..."
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
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {createMutation.isPending || updateMutation.isPending ? 'Saving Contract...' : isNewMode ? 'Create Contract' : 'Save Changes'}
          </button>
        </div>
      </form>

      {/* Cancel Contract Confirm Dialog */}
      <ConfirmDialog
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={() => cancelMutation.mutate()}
        title="Cancel Contract"
        message={`Are you sure you want to cancel this contract? It will be marked as CANCELLED and deactivated from upcoming payroll batches.`}
        confirmText="Confirm Cancellation"
        cancelText="Keep Active"
        isLoading={cancelMutation.isPending}
        variant="danger"
      />
    </div>
  );
}
