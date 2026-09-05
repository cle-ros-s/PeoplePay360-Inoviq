import axiosClient from './axiosClient';
import { AttendanceStatus } from '../utils/constants';

const DEMO_ATTENDANCE = [
  {
    id: 'att_1',
    employeeId: 'emp_001',
    employee: { name: 'Sarah Connor', jobPosition: 'HR Manager' },
    checkIn: '2026-09-05T09:00:00.000Z',
    checkOut: '2026-09-05T18:00:00.000Z',
    workedHours: 8,
    status: AttendanceStatus.PRESENT,
    isManualEdit: false,
  },
  {
    id: 'att_2',
    employeeId: 'emp_002',
    employee: { name: 'Michael Scott', jobPosition: 'Payroll Specialist' },
    checkIn: '2026-09-05T09:30:00.000Z',
    checkOut: '2026-09-05T18:00:00.000Z',
    workedHours: 7.5,
    status: AttendanceStatus.LATE,
    isManualEdit: false,
  },
  {
    id: 'att_3',
    employeeId: 'emp_003',
    employee: { name: 'Dwight Schrute', jobPosition: 'Payroll Manager' },
    checkIn: '2026-09-05T08:45:00.000Z',
    checkOut: '2026-09-05T18:30:00.000Z',
    workedHours: 8.75,
    status: AttendanceStatus.OVERTIME,
    isManualEdit: false,
  },
  {
    id: 'att_4',
    employeeId: 'emp_004',
    employee: { name: 'Jim Halpert', jobPosition: 'Sales Representative' },
    checkIn: '2026-09-05T09:00:00.000Z',
    checkOut: null,
    workedHours: null,
    status: AttendanceStatus.PRESENT,
    isManualEdit: false,
  },
];

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
