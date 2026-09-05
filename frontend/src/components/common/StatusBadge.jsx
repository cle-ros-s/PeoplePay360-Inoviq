import React from 'react';
import { formatEnumLabel } from '../../utils/formatters';

const statusStyles = {
  // Employee & Contract
  ACTIVE:   { bg: 'rgba(16,185,129,0.10)',  color: '#059669', border: 'rgba(16,185,129,0.25)' },
  INACTIVE: { bg: 'rgba(107,114,128,0.10)', color: '#6B7280', border: 'rgba(107,114,128,0.25)' },
  DRAFT:    { bg: 'rgba(100,116,139,0.10)', color: '#64748B', border: 'rgba(100,116,139,0.25)' },
  EXPIRED:  { bg: 'rgba(245,158,11,0.10)',  color: '#D97706', border: 'rgba(245,158,11,0.25)' },
  CANCELLED:{ bg: 'rgba(239,68,68,0.10)',   color: '#DC2626', border: 'rgba(239,68,68,0.25)' },

  // Attendance
  PRESENT:         { bg: 'rgba(16,185,129,0.10)',  color: '#059669', border: 'rgba(16,185,129,0.25)' },
  LATE:            { bg: 'rgba(245,158,11,0.10)',  color: '#D97706', border: 'rgba(245,158,11,0.25)' },
  ABSENT:          { bg: 'rgba(239,68,68,0.10)',   color: '#DC2626', border: 'rgba(239,68,68,0.25)' },
  OVERTIME:        { bg: 'rgba(1,126,132,0.10)',   color: '#017E84', border: 'rgba(1,126,132,0.25)' },
  MISSING_CHECKOUT:{ bg: 'rgba(113,75,103,0.10)',  color: '#714B67', border: 'rgba(113,75,103,0.25)' },
  MANUALLY_EDITED: { bg: 'rgba(99,102,241,0.10)',  color: '#6366F1', border: 'rgba(99,102,241,0.25)' },

  // Time Off & Allocations
  PENDING:   { bg: 'rgba(245,158,11,0.10)',  color: '#D97706', border: 'rgba(245,158,11,0.25)' },
  SUBMITTED: { bg: 'rgba(1,126,132,0.10)',   color: '#017E84', border: 'rgba(1,126,132,0.25)' },
  APPROVED:  { bg: 'rgba(16,185,129,0.10)',  color: '#059669', border: 'rgba(16,185,129,0.25)' },
  REFUSED:   { bg: 'rgba(239,68,68,0.10)',   color: '#DC2626', border: 'rgba(239,68,68,0.25)' },

  // Payroll
  COMPUTED:  { bg: 'rgba(1,126,132,0.10)',   color: '#017E84', border: 'rgba(1,126,132,0.25)' },
  VALIDATED: { bg: 'rgba(113,75,103,0.10)',  color: '#714B67', border: 'rgba(113,75,103,0.25)' },
  PAID:      { bg: 'rgba(16,185,129,0.15)',  color: '#047857', border: 'rgba(16,185,129,0.35)' },

  // Warnings
  INFO:     { bg: 'rgba(1,126,132,0.10)',  color: '#017E84', border: 'rgba(1,126,132,0.25)' },
  WARNING:  { bg: 'rgba(245,158,11,0.10)', color: '#D97706', border: 'rgba(245,158,11,0.25)' },
  CRITICAL: { bg: 'rgba(239,68,68,0.12)',  color: '#B91C1C', border: 'rgba(239,68,68,0.35)' },
};

export default function StatusBadge({ status }) {
  if (!status) return null;
  const style = statusStyles[status] || { bg: 'rgba(107,114,128,0.10)', color: '#6B7280', border: 'rgba(107,114,128,0.25)' };
  const label = formatEnumLabel(status);

  return (
    <span
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
      style={{
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
      }}
    >
      {label}
    </span>
  );
}
