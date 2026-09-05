import axiosClient from './axiosClient';

export const dashboardApi = {
  getSummary: async (params) => {
    try {
      const response = await axiosClient.get('/dashboard/summary', { params });
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      return null;
    }
  },

  getKpis: async (params) => {
    try {
      const response = await axiosClient.get('/dashboard/kpis', { params });
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      return {
        totalNetSalaryPaid: 409400,
        payslipsGenerated: 4,
        averageSalary: 102350,
        approvedTimeOff: 8,
        attendanceHealth: 98,
      };
    }
  },

  getSalaryCostByDepartment: async (params) => {
    try {
      const response = await axiosClient.get('/dashboard/salary-cost-by-department', { params });
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      return {
        data: [
          { department: 'Payroll & Finance', cost: 228000 },
          { department: 'Human Resources', cost: 119000 },
          { department: 'Sales & Marketing', cost: 91000 },
          { department: 'Software Engineering', cost: 185000 },
        ],
      };
    }
  },

  getNetSalaryTrend: async (params) => {
    try {
      const response = await axiosClient.get('/dashboard/net-salary-trend', { params });
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      return {
        data: [
          { month: 'Apr 2026', totalNet: 360000 },
          { month: 'May 2026', totalNet: 375000 },
          { month: 'Jun 2026', totalNet: 382000 },
          { month: 'Jul 2026', totalNet: 395000 },
          { month: 'Aug 2026', totalNet: 402000 },
          { month: 'Sep 2026', totalNet: 409400 },
        ],
      };
    }
  },

  getPayslipStatusBreakdown: async (params) => {
    try {
      const response = await axiosClient.get('/dashboard/payslip-status-breakdown', { params });
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      return {
        data: [
          { status: 'DRAFT', count: 1 },
          { status: 'COMPUTED', count: 4 },
          { status: 'VALIDATED', count: 2 },
          { status: 'PAID', count: 12 },
        ],
      };
    }
  },

  getAttendanceOverview: async (params) => {
    try {
      const response = await axiosClient.get('/dashboard/attendance-overview', { params });
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      return {
        present: 22,
        late: 2,
        absent: 1,
        missingCheckout: 0,
      };
    }
  },

  getTimeOffOverview: async (params) => {
    try {
      const response = await axiosClient.get('/dashboard/time-off-overview', { params });
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      return {
        pendingRequests: 3,
        approvedDays: 8,
        activeAllocations: 12,
      };
    }
  },

  getWarnings: async (params) => {
    try {
      const response = await axiosClient.get('/dashboard/warnings', { params });
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      return {
        data: [
          { id: 'w1', type: 'INFO', message: 'September payroll batch generated for 4 employees.', severity: 'INFO' },
          { id: 'w2', type: 'WARNING', message: 'Employee Pam Beesly has pending leave request for this period.', severity: 'WARNING' },
        ],
      };
    }
  },
};
