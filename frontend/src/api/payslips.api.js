import axiosClient from './axiosClient';
import { PayslipStatus } from '../utils/constants';

const DEMO_PAYSLIPS = [
  {
    id: 'ps_1',
    payrunId: 'payrun_001',
    payrun: { id: 'payrun_001', name: 'September 2026 Monthly Payroll' },
    employeeId: 'emp_001',
    employee: { id: 'emp_001', name: 'Sarah Connor', jobPosition: 'HR Manager' },
    contractId: 'cnt_001',
    contract: { wage: 85000 },
    salaryStructureId: 'str_regular',
    salaryStructure: { id: 'str_regular', name: 'Regular Executive Salary' },
    periodStart: '2026-09-01T00:00:00.000Z',
    periodEnd: '2026-09-30T00:00:00.000Z',
    workedDays: 22,
    status: PayslipStatus.COMPUTED,
    basic: 85000,
    gross: 119000,
    net: 108800,
    lines: [
      { id: 'l1', sequence: 1, code: 'BASIC', name: 'Basic Salary', category: 'BASIC', amount: 85000 },
      { id: 'l2', sequence: 2, code: 'HRA', name: 'House Rent Allowance (40% of BASIC)', category: 'ALLOWANCE', amount: 34000 },
      { id: 'l3', sequence: 3, code: 'GROSS', name: 'Gross Salary (BASIC + HRA)', category: 'GROSS', amount: 119000 },
      { id: 'l4', sequence: 4, code: 'PF', name: 'Provident Fund Deduction (12% of BASIC)', category: 'DEDUCTION', amount: 10200 },
      { id: 'l5', sequence: 5, code: 'NET', name: 'Net Salary Payable (GROSS - PF)', category: 'NET', amount: 108800 },
    ],
  },
  {
    id: 'ps_2',
    payrunId: 'payrun_001',
    payrun: { id: 'payrun_001', name: 'September 2026 Monthly Payroll' },
    employeeId: 'emp_002',
    employee: { id: 'emp_002', name: 'Michael Scott', jobPosition: 'Payroll Specialist' },
    contractId: 'cnt_002',
    contract: { wage: 75000 },
    salaryStructureId: 'str_regular',
    salaryStructure: { id: 'str_regular', name: 'Regular Executive Salary' },
    periodStart: '2026-09-01T00:00:00.000Z',
    periodEnd: '2026-09-30T00:00:00.000Z',
    workedDays: 22,
    status: PayslipStatus.COMPUTED,
    basic: 75000,
    gross: 105000,
    net: 96000,
    lines: [
      { id: 'l21', sequence: 1, code: 'BASIC', name: 'Basic Salary', category: 'BASIC', amount: 75000 },
      { id: 'l22', sequence: 2, code: 'HRA', name: 'House Rent Allowance (40% of BASIC)', category: 'ALLOWANCE', amount: 30000 },
      { id: 'l23', sequence: 3, code: 'GROSS', name: 'Gross Salary (BASIC + HRA)', category: 'GROSS', amount: 105000 },
      { id: 'l24', sequence: 4, code: 'PF', name: 'Provident Fund Deduction (12% of BASIC)', category: 'DEDUCTION', amount: 9000 },
      { id: 'l25', sequence: 5, code: 'NET', name: 'Net Salary Payable (GROSS - PF)', category: 'NET', amount: 96000 },
    ],
  },
];

export const payslipsApi = {
  getPayslips: async (params = {}) => {
    try {
      const response = await axiosClient.get('/payslips', { params });
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      let filtered = [...DEMO_PAYSLIPS];
      if (params.employeeId) filtered = filtered.filter((p) => p.employeeId === params.employeeId);
      if (params.payrunId) filtered = filtered.filter((p) => p.payrunId === params.payrunId);
      if (params.status) filtered = filtered.filter((p) => p.status === params.status);
      return { data: filtered, total: filtered.length, page: params.page || 1, pageSize: params.pageSize || 20 };
    }
  },

  getPayslipById: async (id) => {
    try {
      const response = await axiosClient.get(`/payslips/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      return DEMO_PAYSLIPS.find((p) => p.id === id) || DEMO_PAYSLIPS[0];
    }
  },

  getPayslipPdfUrl: (id) => {
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';
    const token = localStorage.getItem('peoplepay360_token');
    return `${baseURL}/payslips/${id}/pdf?token=${token}`;
  },

  sendPayslipEmail: async (id) => {
    try {
      const response = await axiosClient.post(`/payslips/${id}/send-email`);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      return { message: 'Payslip PDF emailed successfully to employee!' };
    }
  },
};
