import React from 'react';
import PayFluxLogo from '../common/PayFluxLogo';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-3">
          <PayFluxLogo className="h-16 w-auto" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">PayFlux</h2>
        <p className="mt-2 text-sm text-gray-500">Integrated HR & Payroll Operations Platform</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl sm:px-10 border border-gray-200">
          {children}
        </div>
      </div>
    </div>
  );
}
