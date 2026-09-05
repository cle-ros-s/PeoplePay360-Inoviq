import React from 'react';
import { Grid3X3, List } from 'lucide-react';

export default function ViewToggle({ view, onViewChange }) {
  return (
    <div
      className="inline-flex items-center p-1 rounded-xl gap-0.5"
      style={{
        background: 'rgba(113,75,103,0.07)',
        border: '1px solid rgba(113,75,103,0.12)',
      }}
    >
      {[
        { key: 'list',   Icon: List,        label: 'List view' },
        { key: 'kanban', Icon: Grid3X3,     label: 'Kanban view' },
      ].map(({ key, Icon, label }) => (
        <button
          key={key}
          type="button"
          onClick={() => onViewChange(key)}
          title={label}
          className="p-1.5 rounded-lg transition-all duration-200"
          style={
            view === key
              ? {
                  background: 'linear-gradient(135deg, #714B67 0%, #017E84 100%)',
                  color: '#ffffff',
                  boxShadow: '0 2px 8px rgba(113,75,103,0.25)',
                }
              : { color: '#9CA3AF', background: 'transparent' }
          }
          onMouseEnter={e => { if (view !== key) e.currentTarget.style.color = '#714B67'; }}
          onMouseLeave={e => { if (view !== key) e.currentTarget.style.color = '#9CA3AF'; }}
        >
          <Icon className="w-4 h-4" />
        </button>
      ))}
    </div>
  );
}
