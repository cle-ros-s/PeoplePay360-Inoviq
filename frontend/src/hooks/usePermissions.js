import { useAuth } from './useAuth';
import { hasPermission } from '../utils/permissions';
import { Role } from '../utils/constants';

export function usePermissions() {
  const { user } = useAuth();
  const userRole = user?.role;

  const can = (permissionKey) => {
    return hasPermission(userRole, permissionKey);
  };

  const isAdmin = userRole === Role.ADMIN;
  const isHrManager = userRole === Role.HR_MANAGER;
  const isPayrollUser = userRole === Role.HR_PAYROLL_USER;
  const isPayrollManager = userRole === Role.HR_PAYROLL_MANAGER;
  const isEmployee = userRole === Role.EMPLOYEE;

  return {
    can,
    userRole,
    isAdmin,
    isHrManager,
    isPayrollUser,
    isPayrollManager,
    isEmployee,
    employeeId: user?.employeeId || null,
  };
}
