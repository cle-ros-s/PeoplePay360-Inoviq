import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { attendanceApi } from '../../api/attendance.api';
import { employeesApi } from '../../api/employees.api';
import { usePermissions } from '../../hooks/usePermissions';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import FilterBar from '../../components/common/FilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import AttendanceWidget from './AttendanceWidget';
import AttendanceFormPage from './AttendanceFormPage';
import { Clock, Edit2, ShieldAlert } from 'lucide-react';
import { formatDateTime, formatHours, formatEnumLabel } from '../../utils/formatters';
import { AttendanceStatus } from '../../utils/constants';

export default function AttendanceListPage() {
  const queryClient = useQueryClient();
  const { can, isEmployee, employeeId: currentEmpId } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();

  const employeeIdFilter = searchParams.get('employeeId') || (isEmployee ? currentEmpId : '');
  const fromFilter = searchParams.get('from') || '';
  const toFilter = searchParams.get('to') || '';
  const statusFilter = searchParams.get('status') || '';
  const [page, setPage] = useState(1);

  const [selectedRecord, setSelectedRecord] = useState(null);
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);

  // Fetch employees for dropdown filter
  const { data: empData } = useQuery({
    queryKey: ['employees-all'],
    queryFn: () => employeesApi.getEmployees({ pageSize: 100 }),
    enabled: !isEmployee,
  });
  const employeesList = empData?.data || (Array.isArray(empData) ? empData : []);

  // Fetch attendance list
  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['attendance', { employeeId: employeeIdFilter, from: fromFilter, to: toFilter, status: statusFilter, page }],
    queryFn: () =>
      attendanceApi.getAttendance({
        employeeId: employeeIdFilter || undefined,
        from: fromFilter || undefined,
        to: toFilter || undefined,
        status: statusFilter || undefined,
        page,
        pageSize: 20,
      }),
  });

  const attendanceList = attendanceData?.data || (Array.isArray(attendanceData) ? attendanceData : []);
  const totalRecords = attendanceData?.total || attendanceList.length;

  const handleFilterChange = (key, val) => {
    const newParams = new URLSearchParams(searchParams);
    if (val) {
      newParams.set(key, val);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const handleOpenCorrection = (row) => {
    setSelectedRecord(row);
    setCorrectionModalOpen(true);
  };

  const columns = [
    {
      header: 'Employee',
      accessorKey: 'employee',
      render: (a) => (
        <div>
          <div className="font-semibold text-gray-900">
            {a.employee?.name || (a.employee ? `${a.employee.firstName || ''} ${a.employee.lastName || ''}`.trim() : null) || 'Unassigned'}
          </div>
          <div className="text-xs text-gray-500">{a.employee?.jobPosition}</div>
        </div>
      ),
    },
    {
      header: 'Check In Time',
      accessorKey: 'checkIn',
      render: (a) => <span className="font-medium text-gray-900">{formatDateTime(a.checkIn)}</span>,
    },
    {
      header: 'Check Out Time',
      accessorKey: 'checkOut',
      render: (a) => (a.checkOut ? <span className="font-medium text-gray-900">{formatDateTime(a.checkOut)}</span> : <span className="text-amber-600 font-semibold text-xs">Active Shift</span>),
    },
    {
      header: 'Worked Hours',
      accessorKey: 'workedHours',
      render: (a) => <span className="font-bold text-gray-900">{formatHours(a.workedHours)}</span>,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      render: (a) => (
        <div className="flex items-center gap-2">
          <StatusBadge status={a.status} />
          {a.isManualEdit && (
            <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
              Edited
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Actions',
      render: (a) => (
        can('MANUAL_ATTENDANCE_CORRECTION') && (
          <button
            onClick={() => handleOpenCorrection(a)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200/60 rounded-lg transition-all shadow-xs"
            title="Manual Correction"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>
        )
      ),
    },
  ];

  const filterConfigs = [];
  if (!isEmployee) {
    filterConfigs.push({
      label: 'Filter Employee',
      value: employeeIdFilter,
      onChange: (val) => handleFilterChange('employeeId', val),
      options: employeesList.map((e) => ({ value: e.id, label: e.name })),
    });
  }

  filterConfigs.push({
    label: 'Filter Status',
    value: statusFilter,
    onChange: (val) => handleFilterChange('status', val),
    options: Object.values(AttendanceStatus).map((s) => ({ value: s, label: formatEnumLabel(s) })),
  });

  return (
    <div>
      <PageHeader
        title="Attendance Tracking"
        description="Daily check-in / check-out records, exception logs, and worked hours tracking."
      />

      <AttendanceWidget employeeId={employeeIdFilter || currentEmpId} />

      <FilterBar filters={filterConfigs} onReset={() => setSearchParams({})}>
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">From Date</span>
            <input
              type="date"
              value={fromFilter}
              onChange={(e) => handleFilterChange('from', e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg shadow-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
            />
          </div>
          <span className="text-xs text-gray-400 self-end pb-2">to</span>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">To Date</span>
            <input
              type="date"
              value={toFilter}
              onChange={(e) => handleFilterChange('to', e.target.value)}
              className="px-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg shadow-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
            />
          </div>
        </div>
      </FilterBar>

      <DataTable
        columns={columns}
        data={attendanceList}
        isLoading={isLoading}
        emptyMessage="No attendance records found for the selected date range and filters."
        pagination={{
          page,
          pageSize: 20,
          total: totalRecords,
          onPageChange: setPage,
        }}
      />

      {correctionModalOpen && (
        <AttendanceFormPage
          isOpen={correctionModalOpen}
          onClose={() => setCorrectionModalOpen(false)}
          attendanceRecord={selectedRecord}
        />
      )}
    </div>
  );
}
