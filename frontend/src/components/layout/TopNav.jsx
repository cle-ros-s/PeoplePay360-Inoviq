import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, Menu } from 'lucide-react';
import { formatEnumLabel } from '../../utils/formatters';
import PayFluxLogo from '../common/PayFluxLogo';

export default function TopNav({ onMobileMenuToggle }) {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Left Side: Mobile Menu Button & Brand Logo */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <PayFluxLogo className="h-8 w-auto" />
            <span className="font-bold text-lg text-gray-900 tracking-tight hidden sm:inline-block">
              PayFlux
            </span>
          </div>
        </div>

        {/* Right Side: Quick Check-in & User Profile */}
        <div className="flex items-center gap-4">
          {/* User Profile Card */}
          <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-gray-900 leading-none">{user?.name}</p>
              <span className="inline-block mt-0.5 text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                {formatEnumLabel(user?.role)}
              </span>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
