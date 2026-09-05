import axiosClient from './axiosClient';

export const usersApi = {
  getUsers: async (params) => {
    const response = await axiosClient.get('/users', { params });
    return response.data;
  },
  createUser: async (data) => {
    const response = await axiosClient.post('/users', data);
    return response.data;
  },
  updateUser: async (id, data) => {
    const response = await axiosClient.patch(`/users/${id}`, data);
    return response.data;
  },
  deleteUser: async (id) => {
    const response = await axiosClient.delete(`/users/${id}`);
    return response.data;
  },
};
