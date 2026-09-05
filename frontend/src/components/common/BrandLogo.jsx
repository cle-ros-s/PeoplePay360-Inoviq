import React from 'react';

export default function BrandLogo({ size = 'md', className = '', showText = false, textClassName = '' }) {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
    '2xl': 'w-28 h-28',
  };

  const imgSizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div className={`relative flex items-center justify-center shrink-0 ${imgSizeClass}`}>
        <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xs">
          <defs>
            <linearGradient id="pBrandGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF4F81" />
              <stop offset="100%" stopColor="#7B2FF7" />
            </linearGradient>
          </defs>
          <path
            d="M8 8C8 5.79086 9.79086 4 12 4H26C33.732 4 40 10.268 40 18C40 25.732 33.732 32 26 32H16V38C16 40.2091 14.2091 42 12 42C9.79086 42 8 40.2091 8 38V8Z"
            fill="url(#pBrandGrad)"
          />
          <path
            d="M16 12H25C28.3137 12 31 14.6863 31 18C31 21.3137 28.3137 24 25 24H16V12Z"
            fill="#FFFFFF"
            fillOpacity="0.95"
          />
        </svg>
      </div>
      {showText && (
        <div className="flex items-center leading-none">
          <span className={`font-black tracking-tight text-slate-900 ${textClassName || 'text-xl'}`}>
            Pay
          </span>
          <span className={`font-black tracking-tight bg-gradient-to-r from-[#FF4F81] to-[#7B2FF7] bg-clip-text text-transparent ${textClassName || 'text-xl'}`}>
            Flux
          </span>
        </div>
      )}
    </div>
  );
}
