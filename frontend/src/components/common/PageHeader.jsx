import React from 'react';

export default function PageHeader({ title, description, actions, children }) {
  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-5 border-b border-slate-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900">{title}</h1>
        {description && (
          <p className="text-sm font-medium mt-1.5 leading-relaxed text-slate-600">{description}</p>
        )}
      </div>
      {(actions || children) && (
        <div className="flex items-center gap-3 flex-wrap flex-shrink-0">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
}
