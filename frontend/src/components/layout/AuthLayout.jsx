import React from 'react';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 text-white font-bold text-2xl shadow-lg shadow-blue-500/30 mb-4">
          P360
        </div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">PeoplePay360</h2>
        <p className="mt-2 text-sm text-slate-400">Integrated HR & Payroll Operations Platform</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-800">
          {children}
        </div>
      </div>
    </div>
  );
}
