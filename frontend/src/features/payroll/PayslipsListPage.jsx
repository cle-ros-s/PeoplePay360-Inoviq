import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { payslipsApi } from '../../api/payslips.api';
import { employeesApi } from '../../api/employees.api';
import { usePermissions } from '../../hooks/usePermissions';
import PageHeader from '../../components/common/PageHeader';
import DataTable from '../../components/common/DataTable';
import FilterBar from '../../components/common/FilterBar';
import StatusBadge from '../../components/common/StatusBadge';
import PayslipPdfButton from './PayslipPdfButton';
import { Eye, FileText, Calendar } from 'lucide-react';
import { formatDate, formatCurrency, formatEnumLabel } from '../../utils/formatters';
import { PayslipStatus } from '../../utils/constants';

export default function PayslipsListPage() {
  const navigate = useNavigate();
  const { isEmployee, employeeId: currentEmpId } = usePermissions();
  const [searchParams, setSearchParams] = useSearchParams();

  const payrunIdFilter = searchParams.get('payrunId') || '';
  const employeeIdFilter = searchParams.get('employeeId') || (isEmployee ? currentEmpId : '');
  const statusFilter = searchParams.get('status') || '';
  const periodFilter = searchParams.get('period') || '';
  const [page, setPage] = useState(1);

  // Fetch employees for dropdown filter
  const { data: empData } = useQuery({
    queryKey: ['employees-all'],
    queryFn: () => employeesApi.getEmployees({ pageSize: 100 }),
    enabled: !isEmployee,
  });
  const employeesList = empData?.data || (Array.isArray(empData) ? empData : []);

  // Fetch payslips list
  const { data: payslipsData, isLoading } = useQuery({
    queryKey: ['payslips', { payrunId: payrunIdFilter, employeeId: employeeIdFilter, status: statusFilter, period: periodFilter, page }],
    queryFn: () =>
      payslipsApi.getPayslips({
        payrunId: payrunIdFilter || undefined,
        employeeId: employeeIdFilter || undefined,
        status: statusFilter || undefined,
        period: periodFilter || undefined,
        page,
        pageSize: 20,
      }),
  });

  const payslipsList = payslipsData?.data || (Array.isArray(payslipsData) ? payslipsData : []);
  const totalRecords = payslipsData?.total || payslipsList.length;

  const handleFilterChange = (key, val) => {
    const newParams = new URLSearchParams(searchParams);
    if (val) {
      newParams.set(key, val);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  const columns = [
    {
      header: 'Employee Name',
      accessorKey: 'employee',
      render: (p) => (
        <div>
          <div className="font-semibold text-gray-900">
            {p.employee?.name || (p.employee ? `${p.employee.firstName || ''} ${p.employee.lastName || ''}`.trim() : null) || 'Unassigned'}
          </div>
          <div className="text-xs text-gray-500">{p.employee?.jobPosition}</div>
        </div>
      ),
    },
    {
      header: 'Payrun / Structure',
      accessorKey: 'payrun',
      render: (p) => (
        <div>
          <div className="font-medium text-gray-900">{p.payrun?.name || '—'}</div>
          <div className="text-xs text-gray-500">{p.salaryStructure?.name}</div>
        </div>
      ),
    },
    {
      header: 'Period Range',
      render: (p) => (
        <span className="text-xs text-gray-700 flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          {formatDate(p.periodStart)} — {formatDate(p.periodEnd)}
        </span>
      ),
    },
    {
      header: 'Gross Salary',
      accessorKey: 'gross',
      render: (p) => <span className="font-semibold text-gray-900">{formatCurrency(p.gross)}</span>,
    },
    {
      header: 'Net Salary',
      accessorKey: 'net',
      render: (p) => <span className="font-bold text-emerald-700">{formatCurrency(p.net)}</span>,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      render: (p) => <StatusBadge status={p.status} />,
    },
    {
      header: 'Actions',
      render: (p) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/payroll/payslips/${p.id}`)}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-lg"
          >
            <Eye className="w-3.5 h-3.5" />
            View Detail
          </button>
          <PayslipPdfButton payslipId={p.id} className="px-2 py-1 text-xs" />
        </div>
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
    options: Object.values(PayslipStatus).map((s) => ({ value: s, label: formatEnumLabel(s) })),
  });

  return (
    <div>
      <PageHeader
        title="Employee Payslips"
        description="View calculated payslip breakdowns, category lines (Basic, Allowances, Deductions, Gross, Net), and PDF copies."
      />

      <FilterBar filters={filterConfigs} onReset={() => setSearchParams({})} />

      <DataTable
        columns={columns}
        data={payslipsList}
        isLoading={isLoading}
        emptyMessage="No payslips found for the specified filters."
        onRowClick={(p) => navigate(`/payroll/payslips/${p.id}`)}
        pagination={{
          page,
          pageSize: 20,
          total: totalRecords,
          onPageChange: setPage,
        }}
      />
    </div>
  );
}
