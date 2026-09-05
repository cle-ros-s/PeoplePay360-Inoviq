import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, Menu } from 'lucide-react';
import { formatEnumLabel } from '../../utils/formatters';

export default function TopNav({ onMobileMenuToggle }) {
  const { user, logout } = useAuth();

  return (
    <header
      className="sticky top-0 z-30"
      style={{
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderBottom: '1px solid rgba(113,75,103,0.12)',
        boxShadow: '0 2px 20px rgba(113,75,103,0.08)',
      }}
    >
      <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Left: Mobile Menu Button & Brand */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onMobileMenuToggle}
            className="lg:hidden p-2 rounded-xl transition-all"
            style={{ color: '#714B67' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(113,75,103,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            aria-label="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            {/* Logo badge */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-sm relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #714B67 0%, #017E84 100%)' }}
            >
              <span className="relative z-10">P</span>
              <div className="absolute inset-0 opacity-25" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 60%)' }} />
            </div>
            <div className="hidden sm:block">
              <span className="font-extrabold text-lg tracking-tight gradient-brand-text">
                PeoplePay360
              </span>
            </div>
          </div>
        </div>

        {/* Right: User Profile */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 pl-3 border-l" style={{ borderColor: 'rgba(113,75,103,0.15)' }}>
            {/* Avatar */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white shadow-sm relative overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #714B67 0%, #017E84 100%)' }}
            >
              <span className="relative z-10">{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
              <div className="absolute inset-0 opacity-20" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 60%)' }} />
            </div>

            <div className="hidden md:block text-left">
              <p className="text-xs font-bold leading-none" style={{ color: '#212121' }}>{user?.name}</p>
              <span
                className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(113,75,103,0.12) 0%, rgba(1,126,132,0.10) 100%)',
                  color: '#714B67',
                  border: '1px solid rgba(113,75,103,0.20)',
                }}
              >
                {formatEnumLabel(user?.role)}
              </span>
            </div>

            <button
              onClick={logout}
              title="Logout"
              className="p-2 rounded-xl transition-all"
              style={{ color: '#9CA3AF' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.08)'; e.currentTarget.style.color = '#DC2626'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
