import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import BrandLogo from '../common/BrandLogo';
import { LogOut, Menu } from 'lucide-react';
import { formatEnumLabel } from '../../utils/formatters';

export default function TopNav({ onMobileMenuToggle }) {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between">
        {/* Left Side: Mobile Menu Button & Brand Logo */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <BrandLogo size="sm" showText textClassName="text-lg text-slate-900 font-bold" />
        </div>

        {/* Right Side: User Profile & Actions */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-900 leading-none">{user?.name}</p>
              <span className="inline-block mt-0.5 text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100">
                {formatEnumLabel(user?.role)}
              </span>
            </div>
            <button
              onClick={logout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
