import React from 'react';
import { formatEnumLabel } from '../../utils/formatters';

const statusStyles = {
  // Employee & Contract
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  INACTIVE: 'bg-gray-100 text-gray-600 border-gray-200',
  DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
  EXPIRED: 'bg-amber-50 text-amber-700 border-amber-200',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',

  // Attendance
  PRESENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  LATE: 'bg-amber-50 text-amber-700 border-amber-200',
  ABSENT: 'bg-rose-50 text-rose-700 border-rose-200',
  OVERTIME: 'bg-blue-50 text-blue-700 border-blue-200',
  MISSING_CHECKOUT: 'bg-purple-50 text-purple-700 border-purple-200',
  MANUALLY_EDITED: 'bg-indigo-50 text-indigo-700 border-indigo-200',

  // Time Off & Allocations
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  SUBMITTED: 'bg-blue-50 text-blue-700 border-blue-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REFUSED: 'bg-rose-50 text-rose-700 border-rose-200',

  // Payroll
  COMPUTED: 'bg-blue-50 text-blue-700 border-blue-200',
  VALIDATED: 'bg-purple-50 text-purple-700 border-purple-200',
  PAID: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold',

  // Warnings
  INFO: 'bg-blue-50 text-blue-700 border-blue-200',
  WARNING: 'bg-amber-50 text-amber-700 border-amber-200',
  CRITICAL: 'bg-rose-100 text-rose-800 border-rose-300 font-semibold',
};

export default function StatusBadge({ status }) {
  if (!status) return null;
  const style = statusStyles[status] || 'bg-gray-100 text-gray-700 border-gray-200';
  const label = formatEnumLabel(status);

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${style}`}>
      {label}
    </span>
  );
}
