import React from 'react';
import { AlertOctagon } from 'lucide-react';

export default function ErrorState({
  title = 'Something went wrong',
  message = 'Unable to connect to the server. Please check your connection and try again.',
  onRetry,
}) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-6 rounded-2xl text-center animate-fadeInUp"
      style={{
        background: 'rgba(255,255,255,0.80)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(239,68,68,0.15)',
        boxShadow: '0 2px 12px rgba(239,68,68,0.08)',
      }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ background: 'rgba(239,68,68,0.10)' }}
      >
        <AlertOctagon className="w-7 h-7" style={{ color: '#DC2626' }} />
      </div>
      <h3 className="text-base font-bold mb-1" style={{ color: '#212121' }}>{title}</h3>
      {message && (
        <p className="text-sm max-w-xs leading-relaxed" style={{ color: '#9CA3AF' }}>{message}</p>
      )}
    </div>
  );
}
