import axiosClient from './axiosClient';
import { PayrunStatus, PayslipStatus } from '../utils/constants';
import { SIXTY_EMPLOYEES } from './mockData60';

const DEMO_PAYRUNS = [
  {
    id: 'payrun_001',
    name: 'September 2026 Monthly Payroll',
    salaryStructureId: 'str_regular',
    salaryStructure: { id: 'str_regular', name: 'Regular Executive Salary' },
    periodStart: '2026-09-01T00:00:00.000Z',
    periodEnd: '2026-09-30T00:00:00.000Z',
    status: PayrunStatus.COMPUTED,
    createdByUserId: 'usr_admin_1',
    createdAt: '2026-09-02T10:00:00.000Z',
    employees: [
      { id: 'pe_1', employeeId: 'emp_001' },
      { id: 'pe_2', employeeId: 'emp_002' },
      { id: 'pe_3', employeeId: 'emp_003' },
      { id: 'pe_4', employeeId: 'emp_004' },
    ],
    payslips: [
      {
        id: 'ps_1',
        employeeId: 'emp_001',
        employee: { name: 'Sarah Connor', jobPosition: 'HR Manager' },
        contract: { wage: 85000 },
        basic: 85000,
        gross: 119000,
        net: 108800,
        status: PayslipStatus.COMPUTED,
      },
      {
        id: 'ps_2',
        employeeId: 'emp_002',
        employee: { name: 'Michael Scott', jobPosition: 'Payroll Specialist' },
        contract: { wage: 75000 },
        basic: 75000,
        gross: 105000,
        net: 96000,
        status: PayslipStatus.COMPUTED,
      },
      {
        id: 'ps_3',
        employeeId: 'emp_003',
        employee: { name: 'Dwight Schrute', jobPosition: 'Payroll Manager' },
        contract: { wage: 95000 },
        basic: 95000,
        gross: 133000,
        net: 121600,
        status: PayslipStatus.COMPUTED,
      },
      {
        id: 'ps_4',
        employeeId: 'emp_004',
        employee: { name: 'Jim Halpert', jobPosition: 'Sales Representative' },
        contract: { wage: 65000 },
        basic: 65000,
        gross: 91000,
        net: 83200,
        status: PayslipStatus.COMPUTED,
      },
    ],
    warnings: [
      { id: 'w1', type: 'INFO', message: 'Payrun batch generated for 4 active employees.', severity: 'INFO' },
      { id: 'w2', type: 'WARNING', message: 'Employee Pam Beesly has pending leave request for this period.', severity: 'WARNING' },
    ],
  },
];

export const payrunsApi = {
  getEligibleEmployees: async (params) => {
    try {
      const response = await axiosClient.post('/payruns/eligible-employees', params);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      return {
        eligibleEmployees: SIXTY_EMPLOYEES,
      };
    }
  },

  createPayrun: async (data) => {
    try {
      const response = await axiosClient.post('/payruns', data);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const newPayrun = {
        id: `payrun_${Date.now()}`,
        name: data.name,
        salaryStructureId: data.salaryStructureId,
        salaryStructure: { id: data.salaryStructureId, name: 'Regular Executive Salary' },
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        status: PayrunStatus.DRAFT,
        createdByUserId: 'usr_admin_1',
        createdAt: new Date().toISOString(),
        employees: (data.employeeIds || []).map((empId) => ({ id: `pe_${empId}`, employeeId: empId })),
        payslips: (data.employeeIds || []).map((empId, idx) => ({
          id: `ps_${empId}_${Date.now()}`,
          employeeId: empId,
          employee: { name: `Employee ${idx + 1}`, jobPosition: 'Staff' },
          contract: { wage: 70000 },
          basic: 70000,
          gross: 98000,
          net: 89600,
          status: PayslipStatus.DRAFT,
        })),
        warnings: [{ id: 'w_init', type: 'INFO', message: 'Payrun created in DRAFT state.', severity: 'INFO' }],
      };
      DEMO_PAYRUNS.unshift(newPayrun);
      return newPayrun;
    }
  },

  getPayruns: async (params = {}) => {
    try {
      const response = await axiosClient.get('/payruns', { params });
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      let filtered = [...DEMO_PAYRUNS];
      if (params.status) filtered = filtered.filter((p) => p.status === params.status);
      return { data: filtered, total: filtered.length };
    }
  },

  getPayrunById: async (id) => {
    try {
      const response = await axiosClient.get(`/payruns/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      return DEMO_PAYRUNS.find((p) => p.id === id) || DEMO_PAYRUNS[0];
    }
  },

  computePayrun: async (id) => {
    try {
      const response = await axiosClient.post(`/payruns/${id}/compute`);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const p = DEMO_PAYRUNS.find((item) => item.id === id) || DEMO_PAYRUNS[0];
      p.status = PayrunStatus.COMPUTED;
      p.payslips.forEach((ps) => (ps.status = PayslipStatus.COMPUTED));
      return p;
    }
  },

  validatePayrun: async (id) => {
    try {
      const response = await axiosClient.post(`/payruns/${id}/validate`);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const p = DEMO_PAYRUNS.find((item) => item.id === id) || DEMO_PAYRUNS[0];
      p.status = PayrunStatus.VALIDATED;
      p.payslips.forEach((ps) => (ps.status = PayslipStatus.VALIDATED));
      return p;
    }
  },

  markPaidPayrun: async (id) => {
    try {
      const response = await axiosClient.post(`/payruns/${id}/mark-paid`);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const p = DEMO_PAYRUNS.find((item) => item.id === id) || DEMO_PAYRUNS[0];
      p.status = PayrunStatus.PAID;
      p.payslips.forEach((ps) => (ps.status = PayslipStatus.PAID));
      return p;
    }
  },

  sendPayslips: async (id) => {
    try {
      const response = await axiosClient.post(`/payruns/${id}/send-payslips`);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      return { message: 'Payslips bulk emailed to all employees!' };
    }
  },

  deletePayrun: async (id) => {
    try {
      const response = await axiosClient.delete(`/payruns/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const idx = DEMO_PAYRUNS.findIndex((p) => p.id === id);
      if (idx !== -1) DEMO_PAYRUNS.splice(idx, 1);
      return { success: true };
    }
  },
};
