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
  IndianRupee,
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
    `flex items-center gap-3 px-3.5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
      isActive
        ? 'nav-active shadow-2xs'
        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
    }`;

  const subNavLinkClass = ({ isActive }) =>
    `flex items-center gap-2 pl-9 pr-3.5 py-2 text-xs font-semibold rounded-xl transition-all duration-200 ${
      isActive
        ? 'nav-active shadow-2xs'
        : 'text-slate-500 hover:bg-slate-100/80 hover:text-slate-900'
    }`;

  return (
    <aside
      className={`w-64 flex flex-col flex-shrink-0 bg-white/95 backdrop-blur-md border-r border-slate-200 ${
        isMobile ? 'h-full' : 'min-h-[calc(100vh-57px)]'
      }`}
    >
      <div className="p-4 space-y-5 flex-1 overflow-y-auto">
        {/* Main Section */}
        <div>
          <p className="section-label">Main Menu</p>
          <nav className="space-y-1">
            {can('VIEW_DASHBOARD') && (
              <NavLink to="/dashboard" onClick={onCloseMobile} className={navLinkClass}>
                <LayoutDashboard className="w-4 h-4 flex-shrink-0 text-slate-500 group-hover:text-purple-600" />
                Dashboard
              </NavLink>
            )}

            {can('VIEW_ALL_EMPLOYEES') && (
              <NavLink to="/employees" onClick={onCloseMobile} className={navLinkClass}>
                <Users className="w-4 h-4 flex-shrink-0 text-slate-500 group-hover:text-purple-600" />
                Employees
              </NavLink>
            )}

            {can('VIEW_DEPARTMENTS') && (
              <NavLink to="/departments" onClick={onCloseMobile} className={navLinkClass}>
                <Building className="w-4 h-4 flex-shrink-0 text-slate-500 group-hover:text-purple-600" />
                Departments
              </NavLink>
            )}

            {can('VIEW_CONTRACTS') && (
              <NavLink to="/contracts" onClick={onCloseMobile} className={navLinkClass}>
                <FileText className="w-4 h-4 flex-shrink-0 text-slate-500 group-hover:text-purple-600" />
                Contracts
              </NavLink>
            )}

            {can('VIEW_SCHEDULES') && (
              <NavLink to="/schedules" onClick={onCloseMobile} className={navLinkClass}>
                <Calendar className="w-4 h-4 flex-shrink-0 text-slate-500 group-hover:text-purple-600" />
                Working Schedules
              </NavLink>
            )}

            <NavLink to="/attendance" onClick={onCloseMobile} className={navLinkClass}>
              <Clock className="w-4 h-4 flex-shrink-0 text-slate-500 group-hover:text-purple-600" />
              Attendance
            </NavLink>
          </nav>
        </div>

        {/* Divider */}
        <div className="h-px bg-slate-200" />

        {/* Time Off Section */}
        <div>
          <button
            type="button"
            onClick={() => toggleSubmenu('timeOff')}
            className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 transition-all group"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider">Time Off</span>
            {openSubmenu.timeOff ? (
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 opacity-70" />
            )}
          </button>
          {openSubmenu.timeOff && (
            <nav className="mt-1 space-y-1">
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
              className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 transition-all"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider">Payroll</span>
              {openSubmenu.payroll ? (
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 opacity-70" />
              )}
            </button>
            {openSubmenu.payroll && (
              <nav className="mt-1 space-y-1">
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
              className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-800 transition-all"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider">Payroll Config</span>
              {openSubmenu.payrollConfig ? (
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 opacity-70" />
              )}
            </button>
            {openSubmenu.payrollConfig && (
              <nav className="mt-1 space-y-1">
                <NavLink to="/payroll-config/structures" onClick={onCloseMobile} className={subNavLinkClass}>
                  Salary Structures
                </NavLink>
              </nav>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-slate-200" />

        {/* Administration Section */}
        {can('VIEW_USERS') && (
          <div>
            <p className="section-label">Administration</p>
            <nav className="space-y-1">
              <NavLink to="/users" onClick={onCloseMobile} className={navLinkClass}>
                <UserCog className="w-4 h-4 flex-shrink-0 text-slate-500 group-hover:text-purple-600" />
                User Management
              </NavLink>
            </nav>
          </div>
        )}
      </div>

      {/* Bottom brand strip */}
      <div className="p-4 border-t border-slate-200 flex items-center gap-2.5 bg-slate-50/50">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black shadow-2xs bg-gradient-to-tr from-[#FF4F81] to-[#7B2FF7]">
          P
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-extrabold text-slate-900 tracking-tight">PayFlux</span>
          <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wide -mt-0.5">HR &amp; Payroll SaaS</span>
        </div>
      </div>
    </aside>
  );
}
