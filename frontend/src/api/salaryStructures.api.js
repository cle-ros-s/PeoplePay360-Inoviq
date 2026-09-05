import axiosClient from './axiosClient';

const DEMO_STRUCTURES = [
  {
    id: 'str_regular',
    name: 'Regular Executive Salary',
    description: 'Standard executive salary structure with BASIC, HRA (40%), PF (12%), GROSS, and NET rules.',
    isActive: true,
    rules: [
      { id: 'r1', code: 'BASIC', name: 'Basic Salary', category: 'BASIC', sequence: 1, computationMethod: 'FIXED', amount: 85000 },
      { id: 'r2', code: 'HRA', name: 'House Rent Allowance', category: 'ALLOWANCE', sequence: 2, computationMethod: 'PERCENTAGE', percentage: 40, percentageBasisCode: 'BASIC' },
      { id: 'r3', code: 'GROSS', name: 'Gross Salary', category: 'GROSS', sequence: 3, computationMethod: 'FORMULA', formula: 'BASIC + HRA' },
      { id: 'r4', code: 'PF', name: 'Provident Fund Deduction', category: 'DEDUCTION', sequence: 4, computationMethod: 'PERCENTAGE', percentage: 12, percentageBasisCode: 'BASIC' },
      { id: 'r5', code: 'NET', name: 'Net Salary Payable', category: 'NET', sequence: 5, computationMethod: 'FORMULA', formula: 'GROSS - PF' },
    ],
  },
];

export const salaryStructuresApi = {
  getSalaryStructures: async (params) => {
    try {
      const response = await axiosClient.get('/salary-structures', { params });
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      return { data: DEMO_STRUCTURES, total: DEMO_STRUCTURES.length };
    }
  },
  getSalaryStructureById: async (id) => {
    try {
      const response = await axiosClient.get(`/salary-structures/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      return DEMO_STRUCTURES.find((s) => s.id === id) || DEMO_STRUCTURES[0];
    }
  },
  createSalaryStructure: async (data) => {
    try {
      const response = await axiosClient.post('/salary-structures', data);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const newStr = { id: `str_${Date.now()}`, rules: [], ...data };
      DEMO_STRUCTURES.push(newStr);
      return newStr;
    }
  },
  updateSalaryStructure: async (id, data) => {
    try {
      const response = await axiosClient.patch(`/salary-structures/${id}`, data);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const str = DEMO_STRUCTURES.find((s) => s.id === id);
      if (str) Object.assign(str, data);
      return { id, ...data };
    }
  },
  deleteSalaryStructure: async (id) => {
    try {
      const response = await axiosClient.delete(`/salary-structures/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const idx = DEMO_STRUCTURES.findIndex((s) => s.id === id);
      if (idx !== -1) DEMO_STRUCTURES.splice(idx, 1);
      return { success: true };
    }
  },
};
