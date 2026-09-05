import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function SmartButton({ icon: Icon, label, count, onClick, to, active = false }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="flex items-center gap-2.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
      style={
        active
          ? {
              background: 'linear-gradient(135deg, rgba(113,75,103,0.12) 0%, rgba(1,126,132,0.08) 100%)',
              border: '1px solid rgba(113,75,103,0.30)',
              color: '#714B67',
              boxShadow: '0 2px 8px rgba(113,75,103,0.12)',
            }
          : {
              background: 'rgba(255,255,255,0.80)',
              border: '1px solid rgba(113,75,103,0.15)',
              color: '#6B7280',
              boxShadow: '0 1px 4px rgba(33,33,33,0.06)',
            }
      }
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(113,75,103,0.06)';
          e.currentTarget.style.borderColor = 'rgba(113,75,103,0.25)';
          e.currentTarget.style.color = '#714B67';
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.80)';
          e.currentTarget.style.borderColor = 'rgba(113,75,103,0.15)';
          e.currentTarget.style.color = '#6B7280';
        }
      }}
    >
      {Icon && <Icon className="w-4 h-4" style={{ color: active ? '#714B67' : '#9CA3AF' }} />}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className="ml-1 px-2 py-0.5 rounded-full text-xs font-bold"
          style={
            active
              ? { background: 'rgba(113,75,103,0.18)', color: '#714B67' }
              : { background: 'rgba(107,114,128,0.12)', color: '#6B7280' }
          }
        >
          {count}
        </span>
      )}
    </button>
  );
}
