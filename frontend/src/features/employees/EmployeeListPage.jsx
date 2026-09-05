import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { employeesApi } from '../../api/employees.api';
import { departmentsApi } from '../../api/departments.api';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import KanbanBoard from '../../components/common/KanbanBoard';
import ViewToggle from '../../components/common/ViewToggle';
import FilterBar from '../../components/common/FilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { UserPlus, Edit2, Trash2, Eye, Building, Briefcase } from 'lucide-react';
import { formatDate, formatEnumLabel } from '../../utils/formatters';
import { EmployeeStatus, EmployeeType } from '../../utils/constants';

export default function EmployeeListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [view, setView] = useState('list');
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [page, setPage] = useState(1);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  // Fetch departments for filter dropdown
  const { data: deptData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.getDepartments(),
  });
  const departmentsList = deptData?.data || (Array.isArray(deptData) ? deptData : []);

  // Fetch employees list
  const { data: empData, isLoading } = useQuery({
    queryKey: ['employees', { search, department: departmentId, status, type, page }],
    queryFn: () =>
      employeesApi.getEmployees({
        search,
        department: departmentId || undefined,
        status: status || undefined,
        type: type || undefined,
        page,
        pageSize: 20,
      }),
  });

  const employeesList = empData?.data || (Array.isArray(empData) ? empData : []);
  const totalRecords = empData?.total || employeesList.length;

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: employeesApi.deleteEmployee,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      setDeleteConfirmOpen(false);
      setEmployeeToDelete(null);
    },
  });

  const handleResetFilters = () => {
    setSearch('');
    setDepartmentId('');
    setStatus('');
    setType('');
    setPage(1);
  };

  const columns = [
    {
      header: 'Employee',
      accessorKey: 'name',
      render: (emp) => (
        <div className="flex items-center gap-3 font-medium text-gray-900">
          {emp.avatarUrl ? (
            <img src={emp.avatarUrl} alt={emp.name} className="w-9 h-9 rounded-full object-cover border border-gray-200" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
              {emp.name?.charAt(0) || 'E'}
            </div>
          )}
          <div>
            <div className="font-semibold">{emp.name}</div>
            <div className="text-xs text-gray-500 font-normal">{emp.email}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Job Position',
      accessorKey: 'jobPosition',
      render: (emp) => (
        <span className="text-gray-700 font-medium flex items-center gap-1.5">
          <Briefcase className="w-3.5 h-3.5 text-gray-400" />
          {emp.jobPosition}
        </span>
      ),
    },
    {
      header: 'Department',
      accessorKey: 'department',
      render: (emp) => (
        <span className="text-gray-700 flex items-center gap-1.5">
          <Building className="w-3.5 h-3.5 text-gray-400" />
          {emp.department?.name || 'Unassigned'}
        </span>
      ),
    },
    {
      header: 'Type',
      accessorKey: 'employeeType',
      render: (emp) => (
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 border border-gray-200">
          {formatEnumLabel(emp.employeeType)}
        </span>
      ),
    },
    {
      header: 'Joining Date',
      accessorKey: 'joiningDate',
      render: (emp) => formatDate(emp.joiningDate),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      render: (emp) => <StatusBadge status={emp.status} />,
    },
    {
      header: 'Actions',
      render: (emp) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/employees/${emp.id}`)}
            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(`/employees/${emp.id}/edit`)}
            className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Edit Employee"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEmployeeToDelete(emp);
              setDeleteConfirmOpen(true);
            }}
            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            title="Delete Employee"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  const filterConfigs = [
    {
      label: 'Department',
      value: departmentId,
      onChange: setDepartmentId,
      options: departmentsList.map((d) => ({ value: d.id, label: d.name })),
    },
    {
      label: 'Status',
      value: status,
      onChange: setStatus,
      options: Object.values(EmployeeStatus).map((s) => ({ value: s, label: formatEnumLabel(s) })),
    },
    {
      label: 'Employee Type',
      value: type,
      onChange: setType,
      options: Object.values(EmployeeType).map((t) => ({ value: t, label: formatEnumLabel(t) })),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Employee Directory"
        description="Central operational hub for managing employee profiles, work positions, and related HR records."
        actions={
          <div className="flex items-center gap-3">
            <ViewToggle view={view} onViewChange={setView} />
            <button
              onClick={() => navigate('/employees/new')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              New Employee
            </button>
          </div>
        }
      />

      <FilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search name, job position, email..."
        filters={filterConfigs}
        onReset={handleResetFilters}
      />

      {view === 'list' ? (
        <DataTable
          columns={columns}
          data={employeesList}
          isLoading={isLoading}
          emptyMessage="No employees found matching the specified filters."
          onRowClick={(emp) => navigate(`/employees/${emp.id}`)}
          pagination={{
            page,
            pageSize: 20,
            total: totalRecords,
            onPageChange: setPage,
          }}
        />
      ) : (
        <KanbanBoard
          data={employeesList}
          groupByKey="department.name"
          onCardClick={(emp) => navigate(`/employees/${emp.id}`)}
        />
      )}

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={() => deleteMutation.mutate(employeeToDelete.id)}
        title="Delete Employee Record"
        message={`Are you sure you want to delete "${employeeToDelete?.name}"? All linked records will be affected.`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
