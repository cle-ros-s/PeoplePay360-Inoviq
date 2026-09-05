import React from 'react';
import BrandLogo from '../common/BrandLogo';
import { ShieldCheck } from 'lucide-react';

export default function AuthLayout({ children }) {
  return (
    <div
      className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #3a2736 0%, #714B67 45%, #017E84 100%)',
      }}
    >
      {/* Decorative background blobs */}
      <div
        className="absolute top-[-80px] left-[-80px] w-[380px] h-[380px] rounded-full opacity-25 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #017E84 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-[-100px] right-[-60px] w-[340px] h-[340px] rounded-full opacity-20 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #714B67 0%, transparent 70%)' }}
      />
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-10 pointer-events-none"
        style={{ background: 'radial-gradient(circle, #ffffff 0%, transparent 65%)' }}
      />

      {/* Brand header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center relative z-10 animate-fadeInUp">
        <div
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl text-white font-extrabold text-xl shadow-glass-lg mb-5 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #714B67 0%, #017E84 100%)' }}
        >
          <span className="relative z-10">P360</span>
          <div className="absolute inset-0 opacity-30" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 60%)' }} />
        </div>
        <h1 className="text-4xl font-extrabold text-white tracking-tight">PeoplePay360</h1>
        <p className="mt-2 text-sm font-medium" style={{ color: 'rgba(255,255,255,0.70)' }}>
          Integrated HR &amp; Payroll Operations Platform
        </p>
      </div>

      {/* Glass card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 animate-fadeInUp px-4 sm:px-0">
        <div
          className="py-8 px-6 sm:px-10 rounded-2xl"
          style={{
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.60)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          }}
        >
          {children}
        </div>

        {/* Secure Access Footer */}
        <div className="mt-6 text-center flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400">
          <ShieldCheck className="w-4 h-4 text-slate-400" />
          <span>Secure HR & Payroll Access</span>
        </div>
      </div>

      {/* Footer note */}
      <p className="mt-8 text-center text-xs relative z-10" style={{ color: 'rgba(255,255,255,0.45)' }}>
        © {new Date().getFullYear()} PeoplePay360 · Secure &amp; Encrypted
      </p>
    </div>
  );
}
