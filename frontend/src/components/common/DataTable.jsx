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
    <div className="rounded-2xl overflow-hidden bg-white border border-slate-200/90 shadow-2xs animate-fadeInUp">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-xs font-bold uppercase tracking-wider bg-slate-50/90 border-b border-slate-200 text-slate-700">
              {columns.map((col, idx) => (
                <th key={idx} className={`px-6 py-4 font-bold ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((row, rIdx) => (
              <tr
                key={row.id || rIdx}
                onClick={() => onRowClick && onRowClick(row)}
                className={`transition-colors duration-150 ${
                  onRowClick ? 'cursor-pointer hover:bg-purple-50/25' : 'hover:bg-slate-50/50'
                } text-sm font-medium text-slate-900`}
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
