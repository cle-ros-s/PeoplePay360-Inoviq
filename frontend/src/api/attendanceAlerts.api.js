import axiosClient from './axiosClient';

export const attendanceAlertsApi = {
  getAlerts: async (params = {}) => {
    const response = await axiosClient.get('/attendance-alerts', { params });
    return response.data;
  },

  getAlertById: async (id) => {
    const response = await axiosClient.get(`/attendance-alerts/${id}`);
    return response.data;
  },

  getMyAlert: async () => {
    const response = await axiosClient.get('/attendance-alerts/my-alert');
    return response.data;
  },

  runCheck: async (data = {}) => {
    const response = await axiosClient.post('/attendance-alerts/run-check', data);
    return response.data;
  },

  updateAlertStatus: async (id, data) => {
    const response = await axiosClient.patch(`/attendance-alerts/${id}/status`, data);
    return response.data;
  },

  getThreshold: async () => {
    const response = await axiosClient.get('/attendance-alerts/threshold');
    return response.data;
  },

  updateThreshold: async (data) => {
    const response = await axiosClient.patch('/attendance-alerts/threshold', data);
    return response.data;
  },
};
