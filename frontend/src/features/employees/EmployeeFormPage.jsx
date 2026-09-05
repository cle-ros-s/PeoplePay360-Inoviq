import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeesApi } from '../../api/employees.api';
import { departmentsApi } from '../../api/departments.api';
import { schedulesApi } from '../../api/schedules.api';
import PageHeader from '../../components/common/PageHeader';
import FormField from '../../components/common/FormField';
import SelectField from '../../components/common/SelectField';
import DateField from '../../components/common/DateField';
import SmartButton from '../../components/common/SmartButton';
import LoadingState from '../../components/common/LoadingState';
import { EmployeeStatus, EmployeeType } from '../../utils/constants';
import { formatEnumLabel } from '../../utils/formatters';
import { FileText, Clock, Palmtree, ArrowLeft, Save, AlertCircle, UserCheck } from 'lucide-react';

const employeeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  phone: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  jobPosition: z.string().min(1, 'Job position is required'),
  status: z.nativeEnum(EmployeeStatus).default(EmployeeStatus.ACTIVE),
  employeeType: z.nativeEnum(EmployeeType).default(EmployeeType.FULL_TIME),
  bankAccountNumber: z.string().optional().nullable(),
  bankIfsc: z.string().optional().nullable(),
  joiningDate: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  managerId: z.string().optional().nullable(),
  scheduleId: z.string().optional().nullable(),
});

export default function EmployeeFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState('');

  const isEditMode = location.pathname.endsWith('/edit');
  const isNewMode = !id || id === 'new';
  const isDetailMode = !!id && !isNewMode && !isEditMode;

  // Fetch employee if id exists
  const { data: employeeData, isLoading: empLoading } = useQuery({
    queryKey: ['employee', id],
    queryFn: () => employeesApi.getEmployeeById(id),
    enabled: !!id && id !== 'new',
  });

  // Fetch departments
  const { data: deptData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.getDepartments(),
  });
  const departments = deptData?.data || (Array.isArray(deptData) ? deptData : []);

  // Fetch schedules
  const { data: scheduleData } = useQuery({
    queryKey: ['schedules'],
    queryFn: () => schedulesApi.getSchedules(),
  });
  const schedules = scheduleData?.data || (Array.isArray(scheduleData) ? scheduleData : []);

  // Fetch all employees for manager selection
  const { data: allEmpData } = useQuery({
    queryKey: ['employees-all'],
    queryFn: () => employeesApi.getEmployees({ pageSize: 100 }),
  });
  const allEmployees = allEmpData?.data || (Array.isArray(allEmpData) ? allEmpData : []);

  // Smart Button Counts
  const { data: contractsData } = useQuery({
    queryKey: ['employee-contracts', id],
    queryFn: () => employeesApi.getEmployeeContracts(id),
    enabled: !!id && id !== 'new',
  });

  const { data: attendanceData } = useQuery({
    queryKey: ['employee-attendance', id],
    queryFn: () => employeesApi.getEmployeeAttendance(id),
    enabled: !!id && id !== 'new',
  });

  const { data: timeOffData } = useQuery({
    queryKey: ['employee-time-off', id],
    queryFn: () => employeesApi.getEmployeeTimeOffRequests(id),
    enabled: !!id && id !== 'new',
  });

  const { data: allocationsData } = useQuery({
    queryKey: ['employee-allocations', id],
    queryFn: () => employeesApi.getEmployeeAllocations(id),
    enabled: !!id && id !== 'new',
  });

  const contractsCount = Array.isArray(contractsData) ? contractsData.length : contractsData?.total || 0;
  const attendanceCount = Array.isArray(attendanceData) ? attendanceData.length : attendanceData?.total || 0;
  const timeOffCount = Array.isArray(timeOffData) ? timeOffData.length : timeOffData?.total || 0;
  const allocationsCount = Array.isArray(allocationsData) ? allocationsData.length : allocationsData?.total || 0;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      avatarUrl: '',
      jobPosition: '',
      status: EmployeeStatus.ACTIVE,
      employeeType: EmployeeType.FULL_TIME,
      bankAccountNumber: '',
      bankIfsc: '',
      joiningDate: new Date().toISOString().split('T')[0],
      departmentId: '',
      managerId: '',
      scheduleId: '',
    },
  });

  useEffect(() => {
    if (employeeData) {
      reset({
        name: employeeData.name || `${employeeData.firstName || ''} ${employeeData.lastName || ''}`.trim(),
        email: employeeData.email || '',
        phone: employeeData.phone || '',
        avatarUrl: employeeData.avatarUrl || '',
        jobPosition: employeeData.jobPosition || '',
        status: employeeData.status || EmployeeStatus.ACTIVE,
        employeeType: employeeData.employeeType || EmployeeType.FULL_TIME,
        bankAccountNumber: employeeData.bankAccountNumber || '',
        bankIfsc: employeeData.bankIfscOrRouting || employeeData.bankIfsc || '',
        joiningDate: employeeData.joiningDate ? employeeData.joiningDate.split('T')[0] : '',
        departmentId: employeeData.departmentId || '',
        managerId: employeeData.managerId || '',
        scheduleId: employeeData.scheduleId || '',
      });
    }
  }, [employeeData, reset]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: employeesApi.createEmployee,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      navigate(data?.id ? `/employees/${data.id}` : '/employees');
    },
    onError: (err) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to create employee';
      setErrorMessage(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data) => employeesApi.updateEmployee(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      queryClient.invalidateQueries({ queryKey: ['employee', id] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      navigate(`/employees/${id}`);
    },
    onError: (err) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to update employee';
      setErrorMessage(msg);
    },
  });

  const onSubmit = (formData) => {
    setErrorMessage('');
    const payload = {
      ...formData,
      departmentId: formData.departmentId || null,
      managerId: formData.managerId || null,
      scheduleId: formData.scheduleId || null,
    };
    if (isNewMode) {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate(payload);
    }
  };

  if (empLoading && !isNewMode) {
    return <LoadingState message="Loading employee record..." />;
  }

  const departmentOptions = departments.map((d) => ({ value: d.id, label: d.name }));
  const managerOptions = allEmployees
    .filter((e) => e.id !== id)
    .map((e) => ({ value: e.id, label: `${e.name || `${e.firstName} ${e.lastName}`} (${e.jobPosition})` }));
  const scheduleOptions = schedules.map((s) => ({ value: s.id, label: `${s.name} (${s.totalWeeklyHours} hrs/wk)` }));

  const statusOptions = Object.values(EmployeeStatus).map((s) => ({ value: s, label: formatEnumLabel(s) }));
  const typeOptions = Object.values(EmployeeType).map((t) => ({ value: t, label: formatEnumLabel(t) }));

  return (
    <div className="space-y-6">
      <PageHeader
        title={isNewMode ? 'Create New Employee' : employeeData?.name || 'Employee Details'}
        description={isNewMode ? 'Add a new staff member to master data.' : `${employeeData?.jobPosition || ''}`}
        actions={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/employees')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            {isDetailMode && (
              <button
                type="button"
                onClick={() => navigate(`/employees/${id}/edit`)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
              >
                Edit Profile
              </button>
            )}
          </div>
        }
      />

      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to save employee record</p>
            <p className="text-xs mt-0.5">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Connected Smart Buttons Hub */}
      {!isNewMode && (
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap items-center gap-3">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mr-2">Connected HR Data:</p>
          <SmartButton
            icon={FileText}
            label="Contracts"
            count={contractsCount}
            to={`/contracts?employeeId=${id}`}
          />
          <SmartButton
            icon={Clock}
            label="Attendance"
            count={attendanceCount}
            to={`/attendance?employeeId=${id}`}
          />
          <SmartButton
            icon={Palmtree}
            label="Time Off"
            count={timeOffCount}
            to={`/time-off/requests?employeeId=${id}`}
          />
          <SmartButton
            icon={UserCheck}
            label="Allocations"
            count={allocationsCount}
            to={`/time-off/allocations?employeeId=${id}`}
          />
        </div>
      )}

      {/* Main Employee Form Card */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
        <fieldset disabled={isDetailMode} className="space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h3 className="text-base font-bold text-gray-900 mb-1">Identity & Work Position</h3>
            <p className="text-xs text-gray-500">Core master data and employment status details.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormField label="Full Name" name="name" register={register} error={errors.name} required />
            <FormField label="Work Email" name="email" type="email" register={register} error={errors.email} required />
            <FormField label="Phone Number" name="phone" register={register} error={errors.phone} />
            <FormField label="Job Position" name="jobPosition" register={register} error={errors.jobPosition} required />
            <SelectField label="Employee Status" name="status" options={statusOptions} register={register} error={errors.status} required />
            <SelectField label="Employment Type" name="employeeType" options={typeOptions} register={register} error={errors.employeeType} required />
            <DateField label="Joining Date" name="joiningDate" register={register} error={errors.joiningDate} />
            <FormField label="Profile Picture URL" name="avatarUrl" register={register} error={errors.avatarUrl} placeholder="https://..." />
          </div>

          <div className="border-b border-gray-100 pb-4 pt-4">
            <h3 className="text-base font-bold text-gray-900 mb-1">Organizational Setup</h3>
            <p className="text-xs text-gray-500">Department structure, reporting manager, and assigned working schedule.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <SelectField label="Department" name="departmentId" options={departmentOptions} register={register} error={errors.departmentId} placeholder="Select Department..." />
            <SelectField label="Reporting Manager" name="managerId" options={managerOptions} register={register} error={errors.managerId} placeholder="Select Manager..." />
            <SelectField label="Working Schedule" name="scheduleId" options={scheduleOptions} register={register} error={errors.scheduleId} placeholder="Select Working Schedule..." />
          </div>

          <div className="border-b border-gray-100 pb-4 pt-4">
            <h3 className="text-base font-bold text-gray-900 mb-1">Bank Information</h3>
            <p className="text-xs text-gray-500">Required for automated payroll salary payment distribution.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Bank Account Number" name="bankAccountNumber" register={register} error={errors.bankAccountNumber} placeholder="e.g. 123456789012" />
            <FormField label="Bank IFSC / SWIFT Code" name="bankIfsc" register={register} error={errors.bankIfsc} placeholder="e.g. SBIN0001234" />
          </div>
        </fieldset>

        {!isDetailMode && (
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate('/employees')}
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
              {createMutation.isPending || updateMutation.isPending ? 'Saving Record...' : isNewMode ? 'Create Employee' : 'Save Changes'}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
