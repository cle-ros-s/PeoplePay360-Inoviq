import React from 'react';

export default function PageHeader({ title, description, actions, children }) {
  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
        {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
      </div>
      {(actions || children) && (
        <div className="flex items-center gap-3 flex-wrap">
          {actions}
          {children}
        </div>
      )}
    </div>
  );
}
