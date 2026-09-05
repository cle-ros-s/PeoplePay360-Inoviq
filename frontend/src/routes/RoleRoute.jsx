import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { hasPermission } from '../utils/permissions';
import { Role } from '../utils/constants';

export default function RoleRoute({ permissionKey, allowedRoles }) {
  const { user } = useAuth();
  const userRole = user?.role;

  let hasAccess = false;
  if (permissionKey) {
    hasAccess = hasPermission(userRole, permissionKey);
  } else if (allowedRoles) {
    hasAccess = allowedRoles.includes(userRole);
  }

  if (!hasAccess) {
    // Redirect unauthorized users based on role
    if (userRole === Role.EMPLOYEE) {
      return <Navigate to="/attendance" replace />;
    }
    return <Navigate to="/employees" replace />;
  }

  return <Outlet />;
}
