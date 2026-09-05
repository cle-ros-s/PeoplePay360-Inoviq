import React from 'react';
import { Search, X } from 'lucide-react';

export default function SearchInput({ value, onChange, placeholder = 'Search...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search
        className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: '#9CA3AF' }}
      />
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field pl-10 pr-9"
        style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
          style={{ color: '#9CA3AF' }}
          onMouseEnter={e => e.currentTarget.style.color = '#714B67'}
          onMouseLeave={e => e.currentTarget.style.color = '#9CA3AF'}
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
