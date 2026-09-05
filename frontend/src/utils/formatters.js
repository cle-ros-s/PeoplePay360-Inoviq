import { format, parseISO, isValid } from 'date-fns';

/**
 * Format currency amount
 */
export function formatCurrency(amount, currency = 'USD') {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$0.00';
  }
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount);
}

/**
 * Format date string to display format (e.g., MMM dd, yyyy)
 */
export function formatDate(dateString, formatStr = 'MMM dd, yyyy') {
  if (!dateString) return 'N/A';
  try {
    const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
    if (!isValid(date)) return 'N/A';
    return format(date, formatStr);
  } catch (error) {
    return 'N/A';
  }
}

/**
 * Format date-time string to display format (e.g., MMM dd, yyyy HH:mm)
 */
export function formatDateTime(dateTimeString, formatStr = 'MMM dd, yyyy HH:mm') {
  if (!dateTimeString) return 'N/A';
  try {
    const date = typeof dateTimeString === 'string' ? parseISO(dateTimeString) : new Date(dateTimeString);
    if (!isValid(date)) return 'N/A';
    return format(date, formatStr);
  } catch (error) {
    return 'N/A';
  }
}

/**
 * Format worked hours
 */
export function formatHours(hours) {
  if (hours === null || hours === undefined || isNaN(hours)) {
    return '0.00 hrs';
  }
  const num = typeof hours === 'string' ? parseFloat(hours) : hours;
  return `${num.toFixed(2)} hrs`;
}

/**
 * Capitalize & format enums for UI display (e.g., FULL_TIME -> Full Time)
 */
export function formatEnumLabel(enumValue) {
  if (!enumValue) return '';
  return enumValue
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
