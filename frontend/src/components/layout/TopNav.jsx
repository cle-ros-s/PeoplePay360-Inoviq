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
            {/* PayFlux Modern Vector Logo */}
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0">
              <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xs">
                <defs>
                  <linearGradient id="pNavGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FF4F81" />
                    <stop offset="100%" stopColor="#7B2FF7" />
                  </linearGradient>
                </defs>
                <path
                  d="M8 8C8 5.79086 9.79086 4 12 4H26C33.732 4 40 10.268 40 18C40 25.732 33.732 32 26 32H16V38C16 40.2091 14.2091 42 12 42C9.79086 42 8 40.2091 8 38V8Z"
                  fill="url(#pNavGrad)"
                />
                <path
                  d="M16 12H25C28.3137 12 31 14.6863 31 18C31 21.3137 28.3137 24 25 24H16V12Z"
                  fill="#FFFFFF"
                  fillOpacity="0.95"
                />
              </svg>
            </div>
            <div className="flex items-center leading-none">
              <span className="font-black text-xl tracking-tight text-slate-900">
                Pay
              </span>
              <span className="font-black text-xl tracking-tight bg-gradient-to-r from-[#FF4F81] to-[#7B2FF7] bg-clip-text text-transparent">
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
