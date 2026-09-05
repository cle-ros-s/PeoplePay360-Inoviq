import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import LoadingState from '../common/LoadingState';
import EmptyState from '../common/EmptyState';
import { formatCurrency } from '../../utils/formatters';

export default function BarChartCard({ title, data = [], dataKey = 'cost', nameKey = 'department', isLoading = false }) {
  if (isLoading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm min-h-[300px] flex items-center justify-center">
        <LoadingState message="Loading chart data..." />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm min-h-[300px] flex flex-col justify-center">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
        <EmptyState description="No department salary data available." />
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey={nameKey}
              tick={{ fontSize: 11, fill: '#64748b' }}
              interval={0}
              angle={-20}
              textAnchor="end"
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(val) => `$${val >= 1000 ? `${val / 1000}k` : val}`}
            />
            <Tooltip
              formatter={(value) => [formatCurrency(value), 'Salary Cost']}
              contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
            />
            <Bar dataKey={dataKey} fill="#2563eb" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
