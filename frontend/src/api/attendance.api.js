import axiosClient from './axiosClient';
import { AttendanceStatus } from '../utils/constants';
import { SIXTY_ATTENDANCE } from './mockData60';

const DEMO_ATTENDANCE = [...SIXTY_ATTENDANCE];

export const attendanceApi = {
  getAttendance: async (params = {}) => {
    try {
      const response = await axiosClient.get('/attendance', { params });
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      let filtered = [...DEMO_ATTENDANCE];
      if (params.employeeId) filtered = filtered.filter((a) => a.employeeId === params.employeeId);
      if (params.status) filtered = filtered.filter((a) => a.status === params.status);
      return { data: filtered, total: filtered.length, page: params.page || 1, pageSize: params.pageSize || 20 };
    }
  },

  checkIn: async (data) => {
    try {
      const response = await axiosClient.post('/attendance', data);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const newAtt = {
        id: `att_${Date.now()}`,
        employeeId: data.employeeId,
        employee: { name: 'Current User', jobPosition: 'Staff' },
        checkIn: data.checkIn || new Date().toISOString(),
        checkOut: null,
        workedHours: null,
        status: AttendanceStatus.PRESENT,
        isManualEdit: false,
      };
      DEMO_ATTENDANCE.unshift(newAtt);
      return newAtt;
    }
  },

  checkOut: async (id, data) => {
    try {
      const response = await axiosClient.patch(`/attendance/${id}/check-out`, data);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const att = DEMO_ATTENDANCE.find((a) => a.id === id) || DEMO_ATTENDANCE[0];
      att.checkOut = data.checkOut || new Date().toISOString();
      const inTime = new Date(att.checkIn);
      const outTime = new Date(att.checkOut);
      att.workedHours = +((outTime - inTime) / (1000 * 60 * 60)).toFixed(2);
      return att;
    }
  },

  updateAttendance: async (id, data) => {
    try {
      const response = await axiosClient.patch(`/attendance/${id}`, data);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const att = DEMO_ATTENDANCE.find((a) => a.id === id);
      if (att) {
        Object.assign(att, data, { isManualEdit: true });
        return att;
      }
      return { id, ...data, isManualEdit: true };
    }
  },
};
