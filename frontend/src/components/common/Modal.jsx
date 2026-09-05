import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, description, children, maxWidth = 'max-w-xl' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4"
      style={{ background: 'rgba(33,33,33,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
    >
      <div
        className={`w-full ${maxWidth} overflow-hidden flex flex-col max-h-[90vh] animate-fadeInUp`}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(113,75,103,0.18)',
          boxShadow: '0 24px 64px rgba(33,33,33,0.22)',
          borderRadius: '1.25rem',
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{
            background: 'linear-gradient(135deg, rgba(113,75,103,0.06) 0%, rgba(1,126,132,0.04) 100%)',
            borderBottom: '1px solid rgba(113,75,103,0.10)',
          }}
        >
          <div>
            <h3 className="text-base font-bold" style={{ color: '#212121' }}>{title}</h3>
            {description && (
              <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl transition-all"
            style={{ color: '#9CA3AF' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(113,75,103,0.08)'; e.currentTarget.style.color = '#714B67'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
