import React from 'react';
import Modal from './Modal';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isLoading = false,
  variant = 'danger',
}) {
  const isDanger = variant === 'danger';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex items-start gap-4">
        <div
          className="p-3 rounded-2xl flex-shrink-0"
          style={{
            background: isDanger ? 'rgba(220,38,38,0.10)' : 'rgba(245,158,11,0.10)',
            color: isDanger ? '#DC2626' : '#D97706',
          }}
        >
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{message}</p>
        </div>
      </div>

      <div
        className="mt-6 flex items-center justify-end gap-3 pt-4"
        style={{ borderTop: '1px solid rgba(113,75,103,0.10)' }}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all duration-200"
          style={{
            color: '#6B7280',
            borderColor: 'rgba(107,114,128,0.30)',
            background: 'transparent',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(107,114,128,0.08)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isLoading}
          className="px-4 py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-200 disabled:opacity-50"
          style={{
            background: isDanger
              ? 'linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)'
              : 'linear-gradient(135deg, #714B67 0%, #017E84 100%)',
            boxShadow: isDanger
              ? '0 4px 14px rgba(220,38,38,0.25)'
              : '0 4px 14px rgba(113,75,103,0.25)',
          }}
        >
          {isLoading ? 'Processing...' : confirmText}
        </button>
      </div>
    </Modal>
  );
}
