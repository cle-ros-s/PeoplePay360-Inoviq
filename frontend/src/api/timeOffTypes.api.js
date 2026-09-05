import axiosClient from './axiosClient';
import { TimeOffUnit } from '../utils/constants';

const DEMO_TYPES = [
  { id: 'tot_annual', name: 'Paid Annual Leave', unit: TimeOffUnit.DAYS, requiresAllocation: true, requiresApproval: true, color: '#2563eb' },
  { id: 'tot_sick', name: 'Sick Leave', unit: TimeOffUnit.DAYS, requiresAllocation: true, requiresApproval: false, color: '#e11d48' },
  { id: 'tot_casual', name: 'Casual / Personal Leave', unit: TimeOffUnit.DAYS, requiresAllocation: true, requiresApproval: true, color: '#059669' },
  { id: 'tot_unpaid', name: 'Unpaid Leave', unit: TimeOffUnit.DAYS, requiresAllocation: false, requiresApproval: true, color: '#64748b' },
];

export const timeOffTypesApi = {
  getTimeOffTypes: async (params) => {
    try {
      const response = await axiosClient.get('/time-off-types', { params });
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      return { data: DEMO_TYPES, total: DEMO_TYPES.length };
    }
  },
  createTimeOffType: async (data) => {
    try {
      const response = await axiosClient.post('/time-off-types', data);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const newType = { id: `tot_${Date.now()}`, ...data };
      DEMO_TYPES.push(newType);
      return newType;
    }
  },
  updateTimeOffType: async (id, data) => {
    try {
      const response = await axiosClient.patch(`/time-off-types/${id}`, data);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const type = DEMO_TYPES.find((t) => t.id === id);
      if (type) Object.assign(type, data);
      return { id, ...data };
    }
  },
  deleteTimeOffType: async (id) => {
    try {
      const response = await axiosClient.delete(`/time-off-types/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const idx = DEMO_TYPES.findIndex((t) => t.id === id);
      if (idx !== -1) DEMO_TYPES.splice(idx, 1);
      return { success: true };
    }
  },
};
