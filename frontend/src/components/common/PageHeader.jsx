import React from 'react';

export default function PageHeader({ title, description, actions, children }) {
  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-start md:justify-between gap-4 pb-5"
         style={{ borderBottom: '1px solid rgba(113,75,103,0.12)' }}>
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: '#212121' }}>{title}</h1>
        {description && (
          <p className="text-sm mt-1.5 leading-relaxed" style={{ color: '#6B7280' }}>{description}</p>
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
