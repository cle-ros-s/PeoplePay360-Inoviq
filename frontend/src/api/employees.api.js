import axiosClient from './axiosClient';
import { EmployeeStatus, EmployeeType } from '../utils/constants';
import { SIXTY_EMPLOYEES } from './mockData60';

const DEMO_EMPLOYEES = SIXTY_EMPLOYEES;

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
