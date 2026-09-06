import React from 'react';

export default function PageHeader({ title, description, actions, children }) {
  return (
    <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3.5 pb-4 border-b border-slate-200">
      <div className="min-w-0 flex-1">
        <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-xs sm:text-sm font-medium mt-1 text-slate-500 leading-normal max-w-3xl line-clamp-2">
            {description}
          </p>
        )}
      </div>
      {(actions || children) && (
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
}

