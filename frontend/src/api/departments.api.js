import axiosClient from './axiosClient';

const DEMO_DEPARTMENTS = [
  { id: 'dept_hr', name: 'Human Resources', employees: [1, 2], _count: { employees: 2 } },
  { id: 'dept_payroll', name: 'Payroll & Finance', employees: [1, 2], _count: { employees: 2 } },
  { id: 'dept_sales', name: 'Sales & Marketing', employees: [1], _count: { employees: 1 } },
  { id: 'dept_engineering', name: 'Software Engineering', employees: [1, 2, 3], _count: { employees: 3 } },
];

export const departmentsApi = {
  getDepartments: async (params) => {
    try {
      const response = await axiosClient.get('/departments', { params });
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      return { data: DEMO_DEPARTMENTS, total: DEMO_DEPARTMENTS.length };
    }
  },
  createDepartment: async (data) => {
    try {
      const response = await axiosClient.post('/departments', data);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const newDept = { id: `dept_${Date.now()}`, name: data.name, _count: { employees: 0 } };
      DEMO_DEPARTMENTS.push(newDept);
      return newDept;
    }
  },
  updateDepartment: async (id, data) => {
    try {
      const response = await axiosClient.patch(`/departments/${id}`, data);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const dept = DEMO_DEPARTMENTS.find((d) => d.id === id);
      if (dept) dept.name = data.name;
      return { id, ...data };
    }
  },
  deleteDepartment: async (id) => {
    try {
      const response = await axiosClient.delete(`/departments/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const idx = DEMO_DEPARTMENTS.findIndex((d) => d.id === id);
      if (idx !== -1) DEMO_DEPARTMENTS.splice(idx, 1);
      return { success: true };
    }
  },
};
