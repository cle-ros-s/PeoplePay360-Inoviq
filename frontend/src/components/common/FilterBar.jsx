import React from 'react';
import SearchInput from './SearchInput';
import { Filter, RotateCcw } from 'lucide-react';

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
    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
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
              className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500"
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
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
}
