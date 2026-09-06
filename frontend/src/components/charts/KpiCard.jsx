import React from 'react';

export default function KpiCard({ title, value, subtext, icon: Icon, color = 'purple', isLoading = false, onClick }) {
  const colorMap = {
    purple:  { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE' },
    teal:    { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' },
    blue:    { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
    emerald: { bg: '#ECFDF5', color: '#059669', border: '#A7F3D0' },
    amber:   { bg: '#FFFBEB', color: '#D97706', border: '#FDE68A' },
    rose:    { bg: '#FFF1F2', color: '#E11D48', border: '#FECDD3' },
    indigo:  { bg: '#EEF2FF', color: '#4F46E5', border: '#C7D2FE' },
  };

  const c = colorMap[color] || colorMap.purple;
  const isSkeleton = isLoading || value === '...';

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:shadow-md transition-all duration-200 flex items-start justify-between ${
        onClick ? 'cursor-pointer hover:border-purple-300 hover:scale-[1.01]' : ''
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{title}</p>
        {isSkeleton ? (
          <div className="h-8 w-24 bg-slate-200 rounded animate-pulse mt-2 mb-1" />
        ) : (
          <h3 className="text-2xl font-black mt-1.5 tracking-tight text-slate-900">{value}</h3>
        )}
        {subtext && <p className="text-xs font-semibold mt-1 text-slate-500">{subtext}</p>}
      </div>
      {Icon && (
        <div
          className="p-3 rounded-xl flex-shrink-0 ml-3.5 shadow-2xs"
          style={{ background: c.bg, border: `1px solid ${c.border}` }}
        >
          <Icon className="w-5 h-5" style={{ color: c.color }} />
        </div>
      )}
    </div>
  );
}
