import axiosClient from './axiosClient';
import { EmployeeStatus, EmployeeType } from '../utils/constants';

const DEMO_EMPLOYEES = [
  {
    id: 'emp_001',
    name: 'Sarah Connor',
    email: 'hr.manager@peoplepay360.com',
    phone: '+1 555-0192',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    jobPosition: 'HR Manager',
    status: EmployeeStatus.ACTIVE,
    employeeType: EmployeeType.FULL_TIME,
    bankAccountNumber: '987654321011',
    bankIfsc: 'HDFC0001234',
    joiningDate: '2023-01-15T00:00:00.000Z',
    departmentId: 'dept_hr',
    department: { id: 'dept_hr', name: 'Human Resources' },
    managerId: null,
    scheduleId: 'sched_fulltime',
    schedule: { id: 'sched_fulltime', name: 'Standard 40h Full-Time', totalWeeklyHours: 40 },
    contracts: [{ id: 'cnt_001', status: 'ACTIVE', wage: 85000, jobPosition: 'HR Manager', startDate: '2023-01-15T00:00:00.000Z' }],
  },
  {
    id: 'emp_002',
    name: 'Michael Scott',
    email: 'payroll.user@peoplepay360.com',
    phone: '+1 555-0144',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    jobPosition: 'Payroll Specialist',
    status: EmployeeStatus.ACTIVE,
    employeeType: EmployeeType.FULL_TIME,
    bankAccountNumber: '987654321022',
    bankIfsc: 'HDFC0001234',
    joiningDate: '2022-06-01T00:00:00.000Z',
    departmentId: 'dept_payroll',
    department: { id: 'dept_payroll', name: 'Payroll & Finance' },
    managerId: 'emp_001',
    scheduleId: 'sched_fulltime',
    schedule: { id: 'sched_fulltime', name: 'Standard 40h Full-Time', totalWeeklyHours: 40 },
    contracts: [{ id: 'cnt_002', status: 'ACTIVE', wage: 75000, jobPosition: 'Payroll Specialist', startDate: '2022-06-01T00:00:00.000Z' }],
  },
  {
    id: 'emp_003',
    name: 'Dwight Schrute',
    email: 'payroll.manager@peoplepay360.com',
    phone: '+1 555-0188',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    jobPosition: 'Payroll Manager',
    status: EmployeeStatus.ACTIVE,
    employeeType: EmployeeType.FULL_TIME,
    bankAccountNumber: '987654321033',
    bankIfsc: 'HDFC0001234',
    joiningDate: '2021-03-10T00:00:00.000Z',
    departmentId: 'dept_payroll',
    department: { id: 'dept_payroll', name: 'Payroll & Finance' },
    managerId: 'emp_001',
    scheduleId: 'sched_fulltime',
    schedule: { id: 'sched_fulltime', name: 'Standard 40h Full-Time', totalWeeklyHours: 40 },
    contracts: [{ id: 'cnt_003', status: 'ACTIVE', wage: 95000, jobPosition: 'Payroll Manager', startDate: '2021-03-10T00:00:00.000Z' }],
  },
  {
    id: 'emp_004',
    name: 'Jim Halpert',
    email: 'employee@peoplepay360.com',
    phone: '+1 555-0177',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    jobPosition: 'Sales Representative',
    status: EmployeeStatus.ACTIVE,
    employeeType: EmployeeType.FULL_TIME,
    bankAccountNumber: '987654321044',
    bankIfsc: 'HDFC0001234',
    joiningDate: '2023-04-01T00:00:00.000Z',
    departmentId: 'dept_sales',
    department: { id: 'dept_sales', name: 'Sales & Marketing' },
    managerId: 'emp_002',
    scheduleId: 'sched_fulltime',
    schedule: { id: 'sched_fulltime', name: 'Standard 40h Full-Time', totalWeeklyHours: 40 },
    contracts: [{ id: 'cnt_004', status: 'ACTIVE', wage: 65000, jobPosition: 'Sales Representative', startDate: '2023-04-01T00:00:00.000Z' }],
  },
  {
    id: 'emp_005',
    name: 'Pam Beesly',
    email: 'pam.beesly@peoplepay360.com',
    phone: '+1 555-0155',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    jobPosition: 'Office Administrator',
    status: EmployeeStatus.ACTIVE,
    employeeType: EmployeeType.PART_TIME,
    bankAccountNumber: '987654321055',
    bankIfsc: 'HDFC0001234',
    joiningDate: '2023-08-15T00:00:00.000Z',
    departmentId: 'dept_hr',
    department: { id: 'dept_hr', name: 'Human Resources' },
    managerId: 'emp_001',
    scheduleId: 'sched_parttime',
    schedule: { id: 'sched_parttime', name: 'Part-Time 20h', totalWeeklyHours: 20 },
    contracts: [{ id: 'cnt_005', status: 'ACTIVE', wage: 45000, jobPosition: 'Office Administrator', startDate: '2023-08-15T00:00:00.000Z' }],
  },
];

export const employeesApi = {
  getEmployees: async (params = {}) => {
    try {
      const response = await axiosClient.get('/employees', { params });
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      // Offline fallback
      let filtered = [...DEMO_EMPLOYEES];
      if (params.search) {
        const s = params.search.toLowerCase();
        filtered = filtered.filter((e) => e.name.toLowerCase().includes(s) || e.jobPosition.toLowerCase().includes(s) || e.email.toLowerCase().includes(s));
      }
      if (params.department) {
        filtered = filtered.filter((e) => e.departmentId === params.department);
      }
      if (params.status) {
        filtered = filtered.filter((e) => e.status === params.status);
      }
      if (params.type) {
        filtered = filtered.filter((e) => e.employeeType === params.type);
      }
      return { data: filtered, total: filtered.length, page: params.page || 1, pageSize: params.pageSize || 20 };
    }
  },

  getEmployeeById: async (id) => {
    try {
      const response = await axiosClient.get(`/employees/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const emp = DEMO_EMPLOYEES.find((e) => e.id === id) || DEMO_EMPLOYEES[0];
      return emp;
    }
  },

  createEmployee: async (data) => {
    try {
      const response = await axiosClient.post('/employees', data);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const newEmp = { id: `emp_${Date.now()}`, ...data, createdAt: new Date().toISOString() };
      DEMO_EMPLOYEES.unshift(newEmp);
      return newEmp;
    }
  },

  updateEmployee: async (id, data) => {
    try {
      const response = await axiosClient.patch(`/employees/${id}`, data);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const idx = DEMO_EMPLOYEES.findIndex((e) => e.id === id);
      if (idx !== -1) {
        DEMO_EMPLOYEES[idx] = { ...DEMO_EMPLOYEES[idx], ...data };
        return DEMO_EMPLOYEES[idx];
      }
      return { id, ...data };
    }
  },

  deleteEmployee: async (id) => {
    try {
      const response = await axiosClient.delete(`/employees/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const idx = DEMO_EMPLOYEES.findIndex((e) => e.id === id);
      if (idx !== -1) DEMO_EMPLOYEES.splice(idx, 1);
      return { success: true };
    }
  },

  // Smart-button drill downs
  getEmployeeContracts: async (id) => {
    try {
      const response = await axiosClient.get(`/employees/${id}/contracts`);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      return { data: [{ id: `cnt_${id}`, wage: 75000, status: 'ACTIVE' }], total: 1 };
    }
  },

  getEmployeeAttendance: async (id) => {
    try {
      const response = await axiosClient.get(`/employees/${id}/attendance`);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      return { data: [{ id: `att_${id}`, workedHours: 8, status: 'PRESENT' }], total: 1 };
    }
  },

  getEmployeeTimeOffRequests: async (id) => {
    try {
      const response = await axiosClient.get(`/employees/${id}/time-off-requests`);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      return { data: [{ id: `tor_${id}`, duration: 2, status: 'APPROVED' }], total: 1 };
    }
  },

  getEmployeeAllocations: async (id) => {
    try {
      const response = await axiosClient.get(`/employees/${id}/allocations`);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      return { data: [{ id: `alloc_${id}`, allocatedAmount: 15, takenAmount: 2, status: 'APPROVED' }], total: 1 };
    }
  },
};
