import axiosClient from './axiosClient';
import { ContractStatus } from '../utils/constants';

const DEMO_CONTRACTS = [
  {
    id: 'cnt_001',
    employeeId: 'emp_001',
    employee: { id: 'emp_001', name: 'Sarah Connor', jobPosition: 'HR Manager' },
    departmentId: 'dept_hr',
    department: { id: 'dept_hr', name: 'Human Resources' },
    jobPosition: 'HR Manager',
    wage: 85000,
    salaryStructureId: 'str_regular',
    salaryStructure: { id: 'str_regular', name: 'Regular Executive Salary' },
    startDate: '2023-01-15T00:00:00.000Z',
    endDate: null,
    status: ContractStatus.ACTIVE,
  },
  {
    id: 'cnt_002',
    employeeId: 'emp_002',
    employee: { id: 'emp_002', name: 'Michael Scott', jobPosition: 'Payroll Specialist' },
    departmentId: 'dept_payroll',
    department: { id: 'dept_payroll', name: 'Payroll & Finance' },
    jobPosition: 'Payroll Specialist',
    wage: 75000,
    salaryStructureId: 'str_regular',
    salaryStructure: { id: 'str_regular', name: 'Regular Executive Salary' },
    startDate: '2022-06-01T00:00:00.000Z',
    endDate: null,
    status: ContractStatus.ACTIVE,
  },
  {
    id: 'cnt_003',
    employeeId: 'emp_003',
    employee: { id: 'emp_003', name: 'Dwight Schrute', jobPosition: 'Payroll Manager' },
    departmentId: 'dept_payroll',
    department: { id: 'dept_payroll', name: 'Payroll & Finance' },
    jobPosition: 'Payroll Manager',
    wage: 95000,
    salaryStructureId: 'str_regular',
    salaryStructure: { id: 'str_regular', name: 'Regular Executive Salary' },
    startDate: '2021-03-10T00:00:00.000Z',
    endDate: null,
    status: ContractStatus.ACTIVE,
  },
  {
    id: 'cnt_004',
    employeeId: 'emp_004',
    employee: { id: 'emp_004', name: 'Jim Halpert', jobPosition: 'Sales Representative' },
    departmentId: 'dept_sales',
    department: { id: 'dept_sales', name: 'Sales & Marketing' },
    jobPosition: 'Sales Representative',
    wage: 65000,
    salaryStructureId: 'str_regular',
    salaryStructure: { id: 'str_regular', name: 'Regular Executive Salary' },
    startDate: '2023-04-01T00:00:00.000Z',
    endDate: null,
    status: ContractStatus.ACTIVE,
  },
];

export const contractsApi = {
  getContracts: async (params = {}) => {
    try {
      const response = await axiosClient.get('/contracts', { params });
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      let filtered = [...DEMO_CONTRACTS];
      if (params.employeeId) filtered = filtered.filter((c) => c.employeeId === params.employeeId);
      if (params.status) filtered = filtered.filter((c) => c.status === params.status);
      return { data: filtered, total: filtered.length };
    }
  },

  getContractById: async (id) => {
    try {
      const response = await axiosClient.get(`/contracts/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      return DEMO_CONTRACTS.find((c) => c.id === id) || DEMO_CONTRACTS[0];
    }
  },

  createContract: async (data) => {
    try {
      const response = await axiosClient.post('/contracts', data);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const newContract = { id: `cnt_${Date.now()}`, ...data, createdAt: new Date().toISOString() };
      DEMO_CONTRACTS.unshift(newContract);
      return newContract;
    }
  },

  updateContract: async (id, data) => {
    try {
      const response = await axiosClient.patch(`/contracts/${id}`, data);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const idx = DEMO_CONTRACTS.findIndex((c) => c.id === id);
      if (idx !== -1) {
        DEMO_CONTRACTS[idx] = { ...DEMO_CONTRACTS[idx], ...data };
        return DEMO_CONTRACTS[idx];
      }
      return { id, ...data };
    }
  },

  deleteContract: async (id) => {
    try {
      const response = await axiosClient.delete(`/contracts/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const idx = DEMO_CONTRACTS.findIndex((c) => c.id === id);
      if (idx !== -1) DEMO_CONTRACTS.splice(idx, 1);
      return { success: true };
    }
  },
};
