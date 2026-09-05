import axiosClient from './axiosClient';
import { AllocationStatus } from '../utils/constants';

const DEMO_ALLOCATIONS = [
  {
    id: 'alloc_1',
    employeeId: 'emp_001',
    employee: { name: 'Sarah Connor', jobPosition: 'HR Manager' },
    timeOffTypeId: 'tot_annual',
    timeOffType: { name: 'Paid Annual Leave', unit: 'DAYS' },
    allocatedAmount: 18,
    takenAmount: 3,
    validFrom: '2026-01-01T00:00:00.000Z',
    validTo: '2026-12-31T00:00:00.000Z',
    status: AllocationStatus.APPROVED,
  },
  {
    id: 'alloc_2',
    employeeId: 'emp_002',
    employee: { name: 'Michael Scott', jobPosition: 'Payroll Specialist' },
    timeOffTypeId: 'tot_annual',
    timeOffType: { name: 'Paid Annual Leave', unit: 'DAYS' },
    allocatedAmount: 15,
    takenAmount: 2,
    validFrom: '2026-01-01T00:00:00.000Z',
    validTo: '2026-12-31T00:00:00.000Z',
    status: AllocationStatus.APPROVED,
  },
  {
    id: 'alloc_3',
    employeeId: 'emp_004',
    employee: { name: 'Jim Halpert', jobPosition: 'Sales Representative' },
    timeOffTypeId: 'tot_sick',
    timeOffType: { name: 'Sick Leave', unit: 'DAYS' },
    allocatedAmount: 10,
    takenAmount: 1,
    validFrom: '2026-01-01T00:00:00.000Z',
    validTo: '2026-12-31T00:00:00.000Z',
    status: AllocationStatus.APPROVED,
  },
];

export const allocationsApi = {
  getAllocations: async (params = {}) => {
    try {
      const response = await axiosClient.get('/allocations', { params });
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      let filtered = [...DEMO_ALLOCATIONS];
      if (params.employeeId) filtered = filtered.filter((a) => a.employeeId === params.employeeId);
      if (params.status) filtered = filtered.filter((a) => a.status === params.status);
      return { data: filtered, total: filtered.length };
    }
  },
  createAllocation: async (data) => {
    try {
      const response = await axiosClient.post('/allocations', data);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const newAlloc = { id: `alloc_${Date.now()}`, takenAmount: 0, ...data };
      DEMO_ALLOCATIONS.unshift(newAlloc);
      return newAlloc;
    }
  },
  updateAllocation: async (id, data) => {
    try {
      const response = await axiosClient.patch(`/allocations/${id}`, data);
      return response.data;
    } catch (error) {
      if (error.response) throw error;
      const alloc = DEMO_ALLOCATIONS.find((a) => a.id === id);
      if (alloc) Object.assign(alloc, data);
      return { id, ...data };
    }
  },
};
