import React from 'react';
import SearchInput from './SearchInput';
import { RotateCcw, SlidersHorizontal } from 'lucide-react';

export default function FilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  filters = [],
  onReset,
  children,
}) {
  const hasActiveFilters = searchValue || filters.some((f) => f.value !== '' && f.value !== undefined);

  return (
    <div
      className="p-4 rounded-2xl mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4"
      style={{
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid rgba(113,75,103,0.12)',
        boxShadow: '0 2px 12px rgba(113,75,103,0.06)',
      }}
    >
      <div className="flex flex-wrap items-center gap-3 flex-1">
        {onSearchChange !== undefined && (
          <div className="w-full sm:w-64">
            <SearchInput value={searchValue} onChange={onSearchChange} placeholder={searchPlaceholder} />
          </div>
        )}

        {filters.map((f, idx) => (
          <div key={idx} className="w-full sm:w-48">
            <select
              value={f.value || ''}
              onChange={(e) => f.onChange(e.target.value)}
              className="input-field"
              style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
            >
              <option value="">{f.label}</option>
              {f.options.map((opt) => {
                const val = typeof opt === 'object' ? opt.value : opt;
                const lbl = typeof opt === 'object' ? opt.label : opt;
                return (
                  <option key={val} value={val}>
                    {lbl}
                  </option>
                );
              })}
            </select>
          </div>
        ))}

        {children}

        {hasActiveFilters && onReset && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all"
            style={{
              color: '#714B67',
              background: 'rgba(113,75,103,0.08)',
              border: '1px solid rgba(113,75,103,0.20)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(113,75,103,0.14)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(113,75,103,0.08)'}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
