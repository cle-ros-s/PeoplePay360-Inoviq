import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 animate-fadeInUp">
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, rgba(113,75,103,0.10) 0%, rgba(1,126,132,0.08) 100%)' }}
      >
        <Loader2
          className="w-6 h-6 animate-spin"
          style={{ color: '#714B67' }}
        />
      </div>
      <p className="text-sm font-medium" style={{ color: '#9CA3AF' }}>{message}</p>
    </div>
  );
}
