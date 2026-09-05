import React from 'react';
import SkeletonLoader from './SkeletonLoader';
import EmptyState from './EmptyState';
import Pagination from './Pagination';

export default function DataTable({
  columns = [],
  data = [],
  isLoading = false,
  emptyMessage = 'No data found.',
  onRowClick,
  pagination,
}) {
  if (isLoading) {
    return <SkeletonLoader rows={5} cols={columns.length} />;
  }

  if (!data || data.length === 0) {
    return <EmptyState description={emptyMessage} />;
  }

  return (
    <div
      className="rounded-2xl overflow-hidden animate-fadeInUp"
      style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(113,75,103,0.12)',
        boxShadow: '0 2px 16px rgba(113,75,103,0.07)',
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr
              className="text-xs font-bold uppercase tracking-wider"
              style={{
                background: 'linear-gradient(135deg, rgba(113,75,103,0.07) 0%, rgba(1,126,132,0.05) 100%)',
                borderBottom: '1px solid rgba(113,75,103,0.12)',
                color: '#4B3B44',
              }}
            >
              {columns.map((col, idx) => (
                <th key={idx} className={`px-6 py-4 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rIdx) => (
              <tr
                key={row.id || rIdx}
                onClick={() => onRowClick && onRowClick(row)}
                className="transition-all duration-150"
                style={{
                  borderBottom: '1px solid rgba(113,75,103,0.07)',
                  cursor: onRowClick ? 'pointer' : 'default',
                  color: '#212121',
                  fontSize: '0.875rem',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = onRowClick
                    ? 'linear-gradient(135deg, rgba(113,75,103,0.05) 0%, rgba(1,126,132,0.04) 100%)'
                    : 'rgba(113,75,103,0.02)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {columns.map((col, cIdx) => (
                  <td key={cIdx} className={`px-6 py-4 ${col.className || ''}`}>
                    {col.render
                      ? col.render(row, rIdx)
                      : col.accessorKey
                      ? row[col.accessorKey] ?? '—'
                      : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination && (
        <Pagination
          page={pagination.page}
          pageSize={pagination.pageSize}
          total={pagination.total}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  );
}
