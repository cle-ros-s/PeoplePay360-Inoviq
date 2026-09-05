import React from 'react';

export default function KpiCard({ title, value, subtext, icon: Icon, color = 'blue', isLoading = false }) {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    rose: 'bg-rose-50 text-rose-600 border-rose-100',
  };

  const selectedColorClass = colorStyles[color] || colorStyles.blue;
  const isSkeleton = isLoading || value === '...';

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-start justify-between">
      <div className="w-full mr-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
        {isSkeleton ? (
          <div className="h-8 w-24 bg-gray-200 rounded animate-pulse mt-1.5 mb-1" />
        ) : (
          <h3 className="text-2xl font-bold text-gray-900 mt-1 tracking-tight">{value}</h3>
        )}
        {subtext && <p className="text-xs text-gray-500 mt-1">{subtext}</p>}
      </div>
      {Icon && (
        <div className={`p-3 rounded-xl border shrink-0 ${selectedColorClass}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
    </div>
  );
}
