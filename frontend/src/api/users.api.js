import axiosClient from './axiosClient';
import { SIXTY_USERS } from './mockData60';

let DEMO_USERS_LIST = [...SIXTY_USERS];

export const usersApi = {
  getUsers: async (params = {}) => {
    try {
      const response = await axiosClient.get('/users', { params });
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      let filtered = [...DEMO_USERS_LIST];
      if (params.search) {
        const s = params.search.toLowerCase();
        filtered = filtered.filter(
          (u) => u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || u.role.toLowerCase().includes(s)
        );
      }
      if (params.role) {
        filtered = filtered.filter((u) => u.role === params.role);
      }
      return { data: filtered, total: filtered.length, page: params.page || 1, pageSize: params.pageSize || 20 };
    }
  },
  createUser: async (data) => {
    try {
      const response = await axiosClient.post('/users', data);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const newUser = {
        id: `usr_${Date.now()}`,
        name: data.name,
        email: data.email,
        role: data.role,
        employeeId: data.employeeId || null,
        createdAt: new Date().toISOString(),
      };
      DEMO_USERS_LIST.unshift(newUser);
      return newUser;
    }
  },
  updateUser: async (id, data) => {
    try {
      const response = await axiosClient.patch(`/users/${id}`, data);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const idx = DEMO_USERS_LIST.findIndex((u) => u.id === id);
      if (idx !== -1) {
        DEMO_USERS_LIST[idx] = { ...DEMO_USERS_LIST[idx], ...data };
        return DEMO_USERS_LIST[idx];
      }
      return { id, ...data };
    }
  },
  deleteUser: async (id) => {
    try {
      const response = await axiosClient.delete(`/users/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      DEMO_USERS_LIST = DEMO_USERS_LIST.filter((u) => u.id !== id);
      return { success: true };
    }
  },
};
