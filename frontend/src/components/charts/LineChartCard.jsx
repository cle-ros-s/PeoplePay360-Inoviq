import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import LoadingState from '../common/LoadingState';
import EmptyState from '../common/EmptyState';
import { formatCurrency } from '../../utils/formatters';

export default function LineChartCard({ title, data = [], dataKey = 'totalNet', nameKey = 'month', isLoading = false }) {
  if (isLoading) {
    return (
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm min-h-[300px] flex items-center justify-center">
        <LoadingState message="Loading trend data..." />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm min-h-[300px] flex flex-col justify-center">
        <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
        <EmptyState description="No net salary trend data available." />
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey={nameKey} tick={{ fontSize: 11, fill: '#64748b' }} />
            <YAxis
              tick={{ fontSize: 11, fill: '#64748b' }}
              tickFormatter={(val) => `$${val >= 1000 ? `${val / 1000}k` : val}`}
            />
            <Tooltip
              formatter={(value) => [formatCurrency(value), 'Net Salary']}
              contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
            />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="#059669"
              strokeWidth={3}
              dot={{ r: 4, fill: '#059669' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
