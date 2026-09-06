import axiosClient from './axiosClient';
import { TimeOffReqStatus } from '../utils/constants';

const DEMO_REQUESTS = [
  {
    id: 'tor_1',
    employeeId: 'emp_001',
    employee: { name: 'Sarah Connor', jobPosition: 'HR Manager' },
    timeOffTypeId: 'tot_annual',
    timeOffType: { name: 'Paid Annual Leave', unit: 'DAYS' },
    startDate: '2026-09-10T00:00:00.000Z',
    endDate: '2026-09-12T00:00:00.000Z',
    duration: 3,
    status: TimeOffReqStatus.APPROVED,
    reason: 'Family vacation',
  },
  {
    id: 'tor_2',
    employeeId: 'emp_004',
    employee: { name: 'Jim Halpert', jobPosition: 'Sales Representative' },
    timeOffTypeId: 'tot_sick',
    timeOffType: { name: 'Sick Leave', unit: 'DAYS' },
    startDate: '2026-09-15T00:00:00.000Z',
    endDate: '2026-09-15T00:00:00.000Z',
    duration: 1,
    status: TimeOffReqStatus.SUBMITTED,
    reason: 'Medical appointment',
  },
];

export const timeOffRequestsApi = {
  getTimeOffRequests: async (params = {}) => {
    try {
      const response = await axiosClient.get('/time-off-requests', { params });
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      let filtered = [...DEMO_REQUESTS];
      if (params.employeeId) filtered = filtered.filter((r) => r.employeeId === params.employeeId);
      if (params.status) filtered = filtered.filter((r) => r.status === params.status);
      return { data: filtered, total: filtered.length, page: params.page || 1, pageSize: params.pageSize || 20 };
    }
  },
  createTimeOffRequest: async (data) => {
    try {
      const response = await axiosClient.post('/time-off-requests', data);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const newReq = { id: `tor_${Date.now()}`, status: TimeOffReqStatus.SUBMITTED, ...data };
      DEMO_REQUESTS.unshift(newReq);
      return newReq;
    }
  },
  approveTimeOffRequest: async (id) => {
    try {
      const response = await axiosClient.patch(`/time-off-requests/${id}/approve`);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const req = DEMO_REQUESTS.find((r) => r.id === id);
      if (req) req.status = TimeOffReqStatus.APPROVED;
      return req;
    }
  },
  refuseTimeOffRequest: async (id, data = {}) => {
    try {
      const response = await axiosClient.patch(`/time-off-requests/${id}/refuse`, data);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const req = DEMO_REQUESTS.find((r) => r.id === id);
      if (req) req.status = TimeOffReqStatus.REFUSED;
      return req;
    }
  },
  bulkApprove: async (ids = []) => {
    try {
      const response = await axiosClient.post('/time-off-requests/bulk-approve', { ids });
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      return { approved: ids.length };
    }
  },
  bulkRefuse: async (ids = [], reason = 'Bulk refused by manager') => {
    try {
      const response = await axiosClient.post('/time-off-requests/bulk-refuse', { ids, reason });
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      return { refused: ids.length };
    }
  },
};
