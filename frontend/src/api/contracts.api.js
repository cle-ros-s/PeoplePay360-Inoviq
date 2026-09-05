import axiosClient from './axiosClient';
import { ContractStatus } from '../utils/constants';
import { SIXTY_CONTRACTS } from './mockData60';

const DEMO_CONTRACTS = SIXTY_CONTRACTS;

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
