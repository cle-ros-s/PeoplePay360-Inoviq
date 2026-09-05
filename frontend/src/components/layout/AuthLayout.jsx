import React from 'react';
import BrandLogo from '../common/BrandLogo';
import { ShieldCheck } from 'lucide-react';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      {/* Brand Header */}
      <div className="w-full max-w-md text-center mb-8">
        <div className="inline-flex justify-center mb-2">
          <BrandLogo size="xl" />
        </div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">PayFlux</h1>
        <p className="mt-1.5 text-sm font-medium text-slate-500">
          Integrated HR & Payroll Operations Platform
        </p>
      </div>

      {/* Login Card Container */}
      <div className="w-full max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-2xl border border-slate-200 shadow-xl shadow-slate-100">
          {children}
        </div>

        {/* Secure Access Footer */}
        <div className="mt-6 text-center flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-400">
          <ShieldCheck className="w-4 h-4 text-slate-400" />
          <span>Secure HR & Payroll Access</span>
        </div>
      </div>
    </div>
  );
}
