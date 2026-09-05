import React from 'react';

export default function KpiCard({ title, value, subtext, icon: Icon, color = 'purple', isLoading = false }) {
  const colorMap = {
    purple:  { bg: 'rgba(113,75,103,0.10)',  color: '#714B67', border: 'rgba(113,75,103,0.18)' },
    teal:    { bg: 'rgba(1,126,132,0.10)',   color: '#017E84', border: 'rgba(1,126,132,0.18)' },
    blue:    { bg: 'rgba(59,130,246,0.10)',  color: '#3B82F6', border: 'rgba(59,130,246,0.18)' },
    emerald: { bg: 'rgba(16,185,129,0.10)',  color: '#10B981', border: 'rgba(16,185,129,0.18)' },
    amber:   { bg: 'rgba(245,158,11,0.10)',  color: '#F59E0B', border: 'rgba(245,158,11,0.18)' },
    rose:    { bg: 'rgba(239,68,68,0.10)',   color: '#EF4444', border: 'rgba(239,68,68,0.18)' },
    indigo:  { bg: 'rgba(99,102,241,0.10)',  color: '#6366F1', border: 'rgba(99,102,241,0.18)' },
  };

  const c = colorMap[color] || colorMap.purple;
  const isSkeleton = isLoading || value === '...';

  return (
    <div
      className="p-5 rounded-2xl flex items-start justify-between transition-all duration-200 glass-card"
    >
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#9CA3AF' }}>{title}</p>
        {isSkeleton ? (
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mt-1.5 mb-1" />
        ) : (
          <h3 className="text-2xl font-extrabold mt-1.5 tracking-tight" style={{ color: '#212121' }}>{value}</h3>
        )}
        {subtext && <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{subtext}</p>}
      </div>
      {Icon && (
        <div
          className="p-3 rounded-xl flex-shrink-0 ml-4 relative overflow-hidden"
          style={{ background: c.bg, border: `1px solid ${c.border}` }}
        >
          <Icon className="w-5 h-5 relative z-10" style={{ color: c.color }} />
          <div className="absolute inset-0 opacity-30" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 60%)' }} />
        </div>
      )}
    </div>
  );
}
