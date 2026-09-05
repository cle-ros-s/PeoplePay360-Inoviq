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
    `flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 ${
      isActive
        ? 'nav-active'
        : 'text-gray-600 hover:bg-primary-50 hover:text-primary-600'
    }`;

  const subNavLinkClass = ({ isActive }) =>
    `flex items-center gap-2 pl-9 pr-3 py-2 text-xs font-medium rounded-xl transition-all duration-200 ${
      isActive
        ? 'nav-active'
        : 'text-gray-500 hover:bg-primary-50 hover:text-primary-600'
    }`;

  return (
    <aside
      className={`w-64 flex flex-col flex-shrink-0 ${isMobile ? 'h-full' : 'min-h-[calc(100vh-57px)]'}`}
      style={{
        background: 'rgba(255,255,255,0.78)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(113,75,103,0.12)',
        boxShadow: '2px 0 20px rgba(113,75,103,0.06)',
      }}
    >
      <div className="p-4 space-y-5 flex-1 overflow-y-auto">

        {/* Main Section */}
        <div>
          <p className="section-label">Main Menu</p>
          <nav className="space-y-0.5">
            {can('VIEW_DASHBOARD') && (
              <NavLink to="/dashboard" onClick={onCloseMobile} className={navLinkClass}>
                <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
                Dashboard
              </NavLink>
            )}

            {can('VIEW_ALL_EMPLOYEES') && (
              <NavLink to="/employees" onClick={onCloseMobile} className={navLinkClass}>
                <Users className="w-4 h-4 flex-shrink-0" />
                Employees
              </NavLink>
            )}

            {can('VIEW_DEPARTMENTS') && (
              <NavLink to="/departments" onClick={onCloseMobile} className={navLinkClass}>
                <Building className="w-4 h-4 flex-shrink-0" />
                Departments
              </NavLink>
            )}

            {can('VIEW_CONTRACTS') && (
              <NavLink to="/contracts" onClick={onCloseMobile} className={navLinkClass}>
                <FileText className="w-4 h-4 flex-shrink-0" />
                Contracts
              </NavLink>
            )}

            {can('VIEW_SCHEDULES') && (
              <NavLink to="/schedules" onClick={onCloseMobile} className={navLinkClass}>
                <Calendar className="w-4 h-4 flex-shrink-0" />
                Working Schedules
              </NavLink>
            )}

            <NavLink to="/attendance" onClick={onCloseMobile} className={navLinkClass}>
              <Clock className="w-4 h-4 flex-shrink-0" />
              Attendance
            </NavLink>
          </nav>
        </div>

        {/* Divider */}
        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(113,75,103,0.15) 50%, transparent 100%)' }} />

        {/* Time Off Section */}
        <div>
          <button
            type="button"
            onClick={() => toggleSubmenu('timeOff')}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all group"
            style={{ color: 'rgba(113,75,103,0.55)' }}
          >
            <span className="text-[10px] font-bold uppercase tracking-widest">Time Off</span>
            {openSubmenu.timeOff
              ? <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              : <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
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
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all"
              style={{ color: 'rgba(113,75,103,0.55)' }}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest">Payroll</span>
              {openSubmenu.payroll
                ? <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                : <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
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
              className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg transition-all"
              style={{ color: 'rgba(113,75,103,0.55)' }}
            >
              <span className="text-[10px] font-bold uppercase tracking-widest">Payroll Config</span>
              {openSubmenu.payrollConfig
                ? <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                : <ChevronRight className="w-3.5 h-3.5 opacity-60" />}
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

        {/* Divider */}
        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent 0%, rgba(113,75,103,0.15) 50%, transparent 100%)' }} />

        {/* Administration Section */}
        {can('VIEW_USERS') && (
          <div>
            <p className="section-label">Administration</p>
            <nav className="space-y-0.5">
              <NavLink to="/users" onClick={onCloseMobile} className={navLinkClass}>
                <UserCog className="w-4 h-4 flex-shrink-0" />
                User Management
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      {/* Bottom brand strip */}
      <div
        className="p-4 border-t flex items-center gap-2"
        style={{ borderColor: 'rgba(113,75,103,0.12)' }}
      >
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-extrabold"
          style={{ background: 'linear-gradient(135deg, #714B67 0%, #017E84 100%)' }}
        >
          P
        </div>
        <span className="text-xs font-semibold gradient-brand-text">PeoplePay360</span>
      </div>
    </aside>
  );
}
