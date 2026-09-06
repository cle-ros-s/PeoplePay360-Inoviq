import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, Menu } from 'lucide-react';
import { formatEnumLabel } from '../../utils/formatters';

export default function TopNav({ onMobileMenuToggle }) {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Left: Mobile Menu Button & Brand */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-[#7B2FF7] hover:bg-purple-50 transition-all"
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            {/* PayFlux Logo */}
            <div className="w-8 h-8 shrink-0">
              <img
                src="/payflux-logo.png"
                alt="PayFlux Logo"
                className="w-full h-full object-contain"
                draggable={false}
              />
            </div>
            <div className="flex items-center leading-none">
              <span className="font-black text-xl tracking-tight text-[#0d2b6e]">
                Pay
              </span>
              <span className="font-black text-xl tracking-tight text-[#00aadd]">
                Flux
              </span>
            </div>
          </div>
        </div>

        {/* Right: User Profile */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
            {/* Avatar */}
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-xs bg-gradient-to-tr from-[#FF4F81] to-[#7B2FF7]">
              <span>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
            </div>

            <div className="hidden md:block text-left">
              <p className="text-xs font-bold leading-none text-slate-900">{user?.name}</p>
              <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-[#7B2FF7] border border-purple-200">
                {formatEnumLabel(user?.role)}
              </span>
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
