import React from 'react';
import { LayoutGrid, List } from 'lucide-react';

export default function ViewToggle({ view = 'list', onViewChange }) {
  return (
    <div className="inline-flex items-center p-1 bg-gray-100 rounded-lg border border-gray-200">
      <button
        type="button"
        onClick={() => onViewChange('list')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          view === 'list'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <List className="w-3.5 h-3.5" />
        List
      </button>
      <button
        type="button"
        onClick={() => onViewChange('kanban')}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
          view === 'kanban'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        <LayoutGrid className="w-3.5 h-3.5" />
        Kanban
      </button>
    </div>
  );
}
