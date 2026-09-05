import React from 'react';
import payfluxLogo from '../../assets/payflux-logo.png';

export default function PayFluxLogo({ className = 'h-10 w-auto', alt = 'PayFlux Logo' }) {
  return (
    <img
      src={payfluxLogo}
      alt={alt}
      className={`object-contain ${className}`}
    />
  );
}
