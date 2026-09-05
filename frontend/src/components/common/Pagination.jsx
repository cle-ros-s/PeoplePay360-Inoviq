import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page = 1, pageSize = 20, total = 0, onPageChange }) {
  const totalPages = Math.ceil(total / pageSize) || 1;
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  if (total === 0) return null;

  const btnBase = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2rem',
    height: '2rem',
    borderRadius: '0.625rem',
    border: '1px solid rgba(113,75,103,0.20)',
    transition: 'all 0.15s',
    color: '#714B67',
    background: 'rgba(255,255,255,0.80)',
    cursor: 'pointer',
  };

  return (
    <div
      className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3.5 px-6"
      style={{ borderTop: '1px solid rgba(113,75,103,0.10)', background: 'rgba(113,75,103,0.02)' }}
    >
      <div className="text-xs" style={{ color: '#9CA3AF' }}>
        Showing{' '}
        <span className="font-bold" style={{ color: '#212121' }}>{startItem}</span>
        {' '}–{' '}
        <span className="font-bold" style={{ color: '#212121' }}>{endItem}</span>
        {' '}of{' '}
        <span className="font-bold" style={{ color: '#212121' }}>{total}</span>
        {' '}records
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          style={{ ...btnBase, opacity: page <= 1 ? 0.35 : 1, cursor: page <= 1 ? 'not-allowed' : 'pointer' }}
          onMouseEnter={e => { if (page > 1) e.currentTarget.style.background = 'rgba(113,75,103,0.10)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.80)'; }}
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="text-xs font-semibold px-3" style={{ color: '#714B67' }}>
          {page} / {totalPages}
        </span>

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          style={{ ...btnBase, opacity: page >= totalPages ? 0.35 : 1, cursor: page >= totalPages ? 'not-allowed' : 'pointer' }}
          onMouseEnter={e => { if (page < totalPages) e.currentTarget.style.background = 'rgba(113,75,103,0.10)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.80)'; }}
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
