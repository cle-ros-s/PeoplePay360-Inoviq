import React from 'react';

export default function SkeletonLoader({ rows = 5, cols = 4 }) {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.85)',
        border: '1px solid rgba(113,75,103,0.10)',
        boxShadow: '0 2px 12px rgba(113,75,103,0.06)',
      }}
    >
      {/* Fake header */}
      <div
        className="px-6 py-4 flex gap-8"
        style={{ background: 'linear-gradient(135deg, rgba(113,75,103,0.06) 0%, rgba(1,126,132,0.04) 100%)', borderBottom: '1px solid rgba(113,75,103,0.10)' }}
      >
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-3 rounded-full skeleton flex-1" />
        ))}
      </div>
      {/* Fake rows */}
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div
          key={rIdx}
          className="px-6 py-4 flex gap-8"
          style={{ borderBottom: '1px solid rgba(113,75,103,0.06)' }}
        >
          {Array.from({ length: cols }).map((_, cIdx) => (
            <div
              key={cIdx}
              className="h-3.5 rounded-full skeleton flex-1"
              style={{ animationDelay: `${(rIdx * cols + cIdx) * 0.06}s` }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
