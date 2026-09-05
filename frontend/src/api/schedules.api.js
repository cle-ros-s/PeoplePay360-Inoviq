import axiosClient from './axiosClient';
import { ScheduleType } from '../utils/constants';

const DEMO_SCHEDULES = [
  {
    id: 'sched_fulltime',
    name: 'Standard 40h Full-Time',
    type: ScheduleType.FULL_TIME,
    totalWeeklyHours: 40,
    lines: [
      { id: 'sl_1', dayOfWeek: 1, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
      { id: 'sl_2', dayOfWeek: 2, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
      { id: 'sl_3', dayOfWeek: 3, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
      { id: 'sl_4', dayOfWeek: 4, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
      { id: 'sl_5', dayOfWeek: 5, startTime: '09:00', endTime: '18:00', breakMinutes: 60 },
    ],
  },
  {
    id: 'sched_parttime',
    name: 'Part-Time 20h',
    type: ScheduleType.PART_TIME,
    totalWeeklyHours: 20,
    lines: [
      { id: 'sl_6', dayOfWeek: 1, startTime: '09:00', endTime: '13:00', breakMinutes: 0 },
      { id: 'sl_7', dayOfWeek: 2, startTime: '09:00', endTime: '13:00', breakMinutes: 0 },
      { id: 'sl_8', dayOfWeek: 3, startTime: '09:00', endTime: '13:00', breakMinutes: 0 },
      { id: 'sl_9', dayOfWeek: 4, startTime: '09:00', endTime: '13:00', breakMinutes: 0 },
      { id: 'sl_10', dayOfWeek: 5, startTime: '09:00', endTime: '13:00', breakMinutes: 0 },
    ],
  },
];

export const schedulesApi = {
  getSchedules: async (params) => {
    try {
      const response = await axiosClient.get('/schedules', { params });
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      return { data: DEMO_SCHEDULES, total: DEMO_SCHEDULES.length };
    }
  },
  getScheduleById: async (id) => {
    try {
      const response = await axiosClient.get(`/schedules/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      return DEMO_SCHEDULES.find((s) => s.id === id) || DEMO_SCHEDULES[0];
    }
  },
  createSchedule: async (data) => {
    try {
      const response = await axiosClient.post('/schedules', data);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      // Compute total weekly hours in demo fallback
      let totalMins = 0;
      (data.lines || []).forEach((l) => {
        const [sh, sm] = l.startTime.split(':').map(Number);
        const [eh, em] = l.endTime.split(':').map(Number);
        const shiftMins = (eh * 60 + em) - (sh * 60 + sm) - (l.breakMinutes || 0);
        totalMins += Math.max(0, shiftMins);
      });
      const newSched = { id: `sched_${Date.now()}`, ...data, totalWeeklyHours: +(totalMins / 60).toFixed(2) };
      DEMO_SCHEDULES.push(newSched);
      return newSched;
    }
  },
  updateSchedule: async (id, data) => {
    try {
      const response = await axiosClient.patch(`/schedules/${id}`, data);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      let totalMins = 0;
      (data.lines || []).forEach((l) => {
        const [sh, sm] = l.startTime.split(':').map(Number);
        const [eh, em] = l.endTime.split(':').map(Number);
        const shiftMins = (eh * 60 + em) - (sh * 60 + sm) - (l.breakMinutes || 0);
        totalMins += Math.max(0, shiftMins);
      });
      const sched = DEMO_SCHEDULES.find((s) => s.id === id);
      if (sched) {
        Object.assign(sched, data, { totalWeeklyHours: +(totalMins / 60).toFixed(2) });
        return sched;
      }
      return { id, ...data, totalWeeklyHours: +(totalMins / 60).toFixed(2) };
    }
  },
  deleteSchedule: async (id) => {
    try {
      const response = await axiosClient.delete(`/schedules/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const idx = DEMO_SCHEDULES.findIndex((s) => s.id === id);
      if (idx !== -1) DEMO_SCHEDULES.splice(idx, 1);
      return { success: true };
    }
  },
};
