import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import {
  LayoutDashboard,
  Users,
  Building,
  FileText,
  Calendar,
  Clock,
  Palmtree,
  DollarSign,
  Settings,
  UserCog,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

export default function SideMenu({ isMobile = false, onCloseMobile }) {
  const { can, isEmployee } = usePermissions();
  const [openSubmenu, setOpenSubmenu] = useState({
    timeOff: true,
    payroll: true,
    payrollConfig: false,
  });

  const toggleSubmenu = (key) => {
    setOpenSubmenu((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-blue-50 text-blue-700 font-semibold'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;

  const subNavLinkClass = ({ isActive }) =>
    `flex items-center gap-2 pl-9 pr-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-blue-50 text-blue-700 font-semibold'
        : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
    }`;

  return (
    <aside
      className={`w-64 bg-white border-r border-gray-200 flex flex-col flex-shrink-0 min-h-[calc(100vh-57px)] ${
        isMobile ? 'h-full' : ''
      }`}
    >
      <div className="p-4 space-y-6 flex-1 overflow-y-auto">
        {/* Main Section */}
        <div>
          <p className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Main Menu</p>
          <nav className="space-y-1">
            {can('VIEW_DASHBOARD') && (
              <NavLink to="/dashboard" onClick={onCloseMobile} className={navLinkClass}>
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </NavLink>
            )}

            {can('VIEW_ALL_EMPLOYEES') && (
              <NavLink to="/employees" onClick={onCloseMobile} className={navLinkClass}>
                <Users className="w-4 h-4" />
                Employees
              </NavLink>
            )}

            {can('VIEW_DEPARTMENTS') && (
              <NavLink to="/departments" onClick={onCloseMobile} className={navLinkClass}>
                <Building className="w-4 h-4" />
                Departments
              </NavLink>
            )}

            {can('VIEW_CONTRACTS') && (
              <NavLink to="/contracts" onClick={onCloseMobile} className={navLinkClass}>
                <FileText className="w-4 h-4" />
                Contracts
              </NavLink>
            )}

            {can('VIEW_SCHEDULES') && (
              <NavLink to="/schedules" onClick={onCloseMobile} className={navLinkClass}>
                <Calendar className="w-4 h-4" />
                Working Schedules
              </NavLink>
            )}

            <NavLink to="/attendance" onClick={onCloseMobile} className={navLinkClass}>
              <Clock className="w-4 h-4" />
              Attendance
            </NavLink>
          </nav>
        </div>

        {/* Time Off Section */}
        <div>
          <button
            type="button"
            onClick={() => toggleSubmenu('timeOff')}
            className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider hover:text-gray-600"
          >
            <span>Time Off</span>
            {openSubmenu.timeOff ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
          {openSubmenu.timeOff && (
            <nav className="mt-1 space-y-0.5">
              <NavLink to="/time-off/requests" onClick={onCloseMobile} className={subNavLinkClass}>
                Requests
              </NavLink>
              <NavLink to="/time-off/allocations" onClick={onCloseMobile} className={subNavLinkClass}>
                Allocations
              </NavLink>
              {can('MANAGE_TIME_OFF_TYPES') && (
                <NavLink to="/time-off/types" onClick={onCloseMobile} className={subNavLinkClass}>
                  Time Off Types
                </NavLink>
              )}
            </nav>
          )}
        </div>

        {/* Payroll Section */}
        {can('VIEW_PAYRUNS') && (
          <div>
            <button
              type="button"
              onClick={() => toggleSubmenu('payroll')}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider hover:text-gray-600"
            >
              <span>Payroll</span>
              {openSubmenu.payroll ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            {openSubmenu.payroll && (
              <nav className="mt-1 space-y-0.5">
                <NavLink to="/payroll/payruns" onClick={onCloseMobile} className={subNavLinkClass}>
                  Payruns
                </NavLink>
                <NavLink to="/payroll/payslips" onClick={onCloseMobile} className={subNavLinkClass}>
                  Payslips
                </NavLink>
              </nav>
            )}
          </div>
        )}

        {/* Payroll Configuration Section */}
        {can('VIEW_SALARY_STRUCTURES') && (
          <div>
            <button
              type="button"
              onClick={() => toggleSubmenu('payrollConfig')}
              className="w-full flex items-center justify-between px-3 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider hover:text-gray-600"
            >
              <span>Payroll Config</span>
              {openSubmenu.payrollConfig ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </button>
            {openSubmenu.payrollConfig && (
              <nav className="mt-1 space-y-0.5">
                <NavLink to="/payroll-config/structures" onClick={onCloseMobile} className={subNavLinkClass}>
                  Salary Structures
                </NavLink>
              </nav>
            )}
          </div>
        )}

        {/* Administration Section */}
        {can('VIEW_USERS') && (
          <div>
            <p className="px-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Administration</p>
            <nav className="space-y-1">
              <NavLink to="/users" onClick={onCloseMobile} className={navLinkClass}>
                <UserCog className="w-4 h-4" />
                User Management
              </NavLink>
            </nav>
          </div>
        )}
      </div>
    </aside>
  );
}
