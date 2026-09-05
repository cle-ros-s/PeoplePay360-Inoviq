import axiosClient from './axiosClient';

export const dashboardApi = {
  getSummary: async (params) => {
    const response = await axiosClient.get('/dashboard/summary', { params });
    return response.data;
  },

  getKpis: async (params) => {
    const response = await axiosClient.get('/dashboard/kpis', { params });
    return response.data;
  },

  getSalaryCostByDepartment: async (params) => {
    const response = await axiosClient.get('/dashboard/salary-cost-by-department', { params });
    return response.data;
  },

  getNetSalaryTrend: async (params) => {
    const response = await axiosClient.get('/dashboard/net-salary-trend', { params });
    return response.data;
  },

  getPayslipStatusBreakdown: async (params) => {
    const response = await axiosClient.get('/dashboard/payslip-status-breakdown', { params });
    return response.data;
  },

  getAttendanceOverview: async (params) => {
    const response = await axiosClient.get('/dashboard/attendance-overview', { params });
    return response.data;
  },

  getTimeOffOverview: async (params) => {
    const response = await axiosClient.get('/dashboard/time-off-overview', { params });
    return response.data;
  },

  getWarnings: async (params) => {
    const response = await axiosClient.get('/dashboard/warnings', { params });
    return response.data;
  },
};
