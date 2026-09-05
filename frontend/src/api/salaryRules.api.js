import axiosClient from './axiosClient';

const DEMO_RULES = [
  { id: 'r1', structureId: 'str_regular', code: 'BASIC', name: 'Basic Salary', category: 'BASIC', sequence: 1, computationMethod: 'FIXED', amount: 85000, isActive: true },
  { id: 'r2', structureId: 'str_regular', code: 'HRA', name: 'House Rent Allowance', category: 'ALLOWANCE', sequence: 2, computationMethod: 'PERCENTAGE', percentage: 40, percentageBasisCode: 'BASIC', isActive: true },
  { id: 'r3', structureId: 'str_regular', code: 'GROSS', name: 'Gross Salary', category: 'GROSS', sequence: 3, computationMethod: 'FORMULA', formula: 'BASIC + HRA', isActive: true },
  { id: 'r4', structureId: 'str_regular', code: 'PF', name: 'Provident Fund Deduction', category: 'DEDUCTION', sequence: 4, computationMethod: 'PERCENTAGE', percentage: 12, percentageBasisCode: 'BASIC', isActive: true },
  { id: 'r5', structureId: 'str_regular', code: 'NET', name: 'Net Salary Payable', category: 'NET', sequence: 5, computationMethod: 'FORMULA', formula: 'GROSS - PF', isActive: true },
];

export const salaryRulesApi = {
  getRulesByStructure: async (structureId) => {
    try {
      const response = await axiosClient.get(`/salary-structures/${structureId}/rules`);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const filtered = DEMO_RULES.filter((r) => r.structureId === structureId);
      return { data: filtered.length > 0 ? filtered : DEMO_RULES, total: DEMO_RULES.length };
    }
  },
  createRule: async (structureId, data) => {
    try {
      const response = await axiosClient.post(`/salary-structures/${structureId}/rules`, data);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const newRule = { id: `r_${Date.now()}`, structureId, ...data };
      DEMO_RULES.push(newRule);
      return newRule;
    }
  },
  updateRule: async (id, data) => {
    try {
      const response = await axiosClient.patch(`/salary-rules/${id}`, data);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const rule = DEMO_RULES.find((r) => r.id === id);
      if (rule) Object.assign(rule, data);
      return { id, ...data };
    }
  },
  deleteRule: async (id) => {
    try {
      const response = await axiosClient.delete(`/salary-rules/${id}`);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const idx = DEMO_RULES.findIndex((r) => r.id === id);
      if (idx !== -1) DEMO_RULES.splice(idx, 1);
      return { success: true };
    }
  },
  reorderRules: async (structureId, ruleIds) => {
    try {
      const response = await axiosClient.patch(`/salary-structures/${structureId}/reorder-rules`, { ruleIds });
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      ruleIds.forEach((id, idx) => {
        const rule = DEMO_RULES.find((r) => r.id === id);
        if (rule) rule.sequence = idx + 1;
      });
      return { success: true };
    }
  },
};
