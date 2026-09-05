import React from 'react';
import logoImg from '../../assets/payflux-logo.png';

export default function BrandLogo({ size = 'md', className = '', showText = false, textClassName = '' }) {
  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    '2xl': 'w-32 h-32',
  };

  const imgSizeClass = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <img
        src={logoImg}
        alt="PayFlux"
        className={`${imgSizeClass} object-contain transition-transform`}
      />
      {showText && (
        <span className={`font-bold tracking-tight text-slate-900 ${textClassName || 'text-xl'}`}>
          PayFlux
        </span>
      )}
    </div>
  );
}
