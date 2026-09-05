import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({ title = 'No Data Found', description, icon: Icon = Inbox }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-16 px-6 rounded-2xl text-center animate-fadeInUp"
      style={{
        background: 'rgba(255,255,255,0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(113,75,103,0.10)',
        boxShadow: '0 2px 12px rgba(113,75,103,0.06)',
      }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, rgba(113,75,103,0.10) 0%, rgba(1,126,132,0.08) 100%)' }}
      >
        <Icon className="w-7 h-7" style={{ color: '#714B67' }} />
        <div className="absolute inset-0 opacity-30" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 60%)' }} />
      </div>
      <h3 className="text-base font-bold mb-1" style={{ color: '#212121' }}>{title}</h3>
      {description && (
        <p className="text-sm max-w-xs leading-relaxed" style={{ color: '#9CA3AF' }}>{description}</p>
      )}
    </div>
  );
}
