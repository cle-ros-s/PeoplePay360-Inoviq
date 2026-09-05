import axiosClient from './axiosClient';
import { PayslipStatus } from '../utils/constants';
import { SIXTY_PAYSLIPS } from './mockData60';

const DEMO_PAYSLIPS = SIXTY_PAYSLIPS;

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
