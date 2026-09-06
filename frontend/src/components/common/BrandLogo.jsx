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
        <img
          src="/payflux-logo.png"
          alt="PayFlux Logo"
          className="w-full h-full object-contain drop-shadow-sm"
          style={{ mixBlendMode: 'multiply' }}
          draggable={false}
        />
      </div>
      {showText && (
        <div className="flex items-center leading-none">
          <span className={`font-black tracking-tight text-[#0d2b6e] ${textClassName || 'text-xl'}`}>
            Pay
          </span>
          <span className={`font-black tracking-tight text-[#00aadd] ${textClassName || 'text-xl'}`}>
            Flux
          </span>
        </div>
      )}
    </div>
  );
}
