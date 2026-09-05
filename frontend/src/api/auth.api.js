import axiosClient from './axiosClient';
import { Role } from '../utils/constants';

const DEMO_USERS = {
  'admin@payflux.com': {
    id: 'usr_admin_1',
    name: 'Administrator',
    email: 'admin@payflux.com',
    role: Role.ADMIN,
    employeeId: null,
  },
  'admin@peoplepay360.com': {
    id: 'usr_admin_1',
    name: 'Administrator',
    email: 'admin@payflux.com',
    role: Role.ADMIN,
    employeeId: null,
  },
  'hr.manager@payflux.com': {
    id: 'usr_hrmgr_1',
    name: 'Sarah Connor (HR Manager)',
    email: 'hr.manager@payflux.com',
    role: Role.HR_MANAGER,
    employeeId: 'emp_001',
  },
  'hr.manager@peoplepay360.com': {
    id: 'usr_hrmgr_1',
    name: 'Sarah Connor (HR Manager)',
    email: 'hr.manager@payflux.com',
    role: Role.HR_MANAGER,
    employeeId: 'emp_001',
  },
  'payroll.user@payflux.com': {
    id: 'usr_payuser_1',
    name: 'Michael Scott (Payroll Specialist)',
    email: 'payroll.user@payflux.com',
    role: Role.HR_PAYROLL_USER,
    employeeId: 'emp_002',
  },
  'payroll.user@peoplepay360.com': {
    id: 'usr_payuser_1',
    name: 'Michael Scott (Payroll Specialist)',
    email: 'payroll.user@payflux.com',
    role: Role.HR_PAYROLL_USER,
    employeeId: 'emp_002',
  },
  'payroll.manager@payflux.com': {
    id: 'usr_paymgr_1',
    name: 'Dwight Schrute (Payroll Manager)',
    email: 'payroll.manager@payflux.com',
    role: Role.HR_PAYROLL_MANAGER,
    employeeId: 'emp_003',
  },
  'payroll.manager@peoplepay360.com': {
    id: 'usr_paymgr_1',
    name: 'Dwight Schrute (Payroll Manager)',
    email: 'payroll.manager@payflux.com',
    role: Role.HR_PAYROLL_MANAGER,
    employeeId: 'emp_003',
  },
  'employee@payflux.com': {
    id: 'usr_emp_1',
    name: 'Jim Halpert (Employee)',
    email: 'employee@payflux.com',
    role: Role.EMPLOYEE,
    employeeId: 'emp_004',
  },
  'employee@peoplepay360.com': {
    id: 'usr_emp_1',
    name: 'Jim Halpert (Employee)',
    email: 'employee@payflux.com',
    role: Role.EMPLOYEE,
    employeeId: 'emp_004',
  },
};

export const authApi = {
  login: async (credentials) => {
    try {
      const response = await axiosClient.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      // If backend responded with 401 / 400 / 403, throw real backend error
      if (error.response) {
        throw error;
      }

      // Backend server is offline / unreachable (Network Error).
      // Fallback to local demo authentication so user can test the UI roles seamlessly.
      console.warn('Backend server unreachable at http://localhost:4000/api. Activating offline demo login fallback.');
      
      const emailLower = credentials.email?.toLowerCase().trim();
      const matchedUser = DEMO_USERS[emailLower] || {
        id: `usr_${Date.now()}`,
        name: credentials.email.split('@')[0],
        email: credentials.email,
        role: emailLower.includes('hr') ? Role.HR_MANAGER : emailLower.includes('payroll') ? Role.HR_PAYROLL_MANAGER : Role.ADMIN,
        employeeId: 'emp_001',
      };

      const demoToken = `demo_jwt_token_${matchedUser.role}_${Date.now()}`;
      return {
        token: demoToken,
        user: matchedUser,
      };
    }
  },

  me: async () => {
    try {
      const response = await axiosClient.get('/auth/me');
      return response.data;
    } catch (error) {
      if (error.response) {
        throw error;
      }

      // Backend server unreachable, restore saved user from localStorage if present
      const savedUser = localStorage.getItem('peoplepay360_user');
      if (savedUser) {
        return JSON.parse(savedUser);
      }
      throw error;
    }
  },
};
