import React from 'react';
import StatusBadge from './StatusBadge';
import { Briefcase, Building } from 'lucide-react';

export default function KanbanBoard({ columns = [], data = [], groupByKey = 'department.name', onCardClick }) {
  // Group data by key
  const grouped = data.reduce((acc, item) => {
    let groupVal = 'Unassigned';
    if (groupByKey === 'department.name') {
      groupVal = item.department?.name || 'No Department';
    } else if (groupByKey === 'status') {
      groupVal = item.status || 'Other';
    }
    if (!acc[groupVal]) acc[groupVal] = [];
    acc[groupVal].push(item);
    return acc;
  }, {});

  const groupKeys = Object.keys(grouped);

  if (data.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 mb-6">
      {groupKeys.map((groupName) => (
        <div
          key={groupName}
          className="rounded-2xl p-4 flex flex-col gap-3"
          style={{
            background: 'rgba(255,255,255,0.68)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgba(113,75,103,0.12)',
            boxShadow: '0 2px 12px rgba(113,75,103,0.07)',
          }}
        >
          {/* Column header */}
          <div
            className="flex items-center justify-between pb-3"
            style={{ borderBottom: '1px solid rgba(113,75,103,0.10)' }}
          >
            <h3 className="font-bold text-sm truncate" style={{ color: '#212121' }}>{groupName}</h3>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-bold"
              style={{ background: 'rgba(113,75,103,0.10)', color: '#714B67' }}
            >
              {grouped[groupName].length}
            </span>
          </div>

          {/* Cards */}
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[70vh] pr-0.5">
            {grouped[groupName].map((emp) => (
              <div
                key={emp.id}
                onClick={() => onCardClick && onCardClick(emp)}
                className="p-4 rounded-xl flex flex-col gap-3 transition-all duration-200"
                style={{
                  background: 'rgba(255,255,255,0.90)',
                  border: '1px solid rgba(113,75,103,0.10)',
                  boxShadow: '0 1px 6px rgba(33,33,33,0.06)',
                  cursor: onCardClick ? 'pointer' : 'default',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(113,75,103,0.14)';
                  e.currentTarget.style.borderColor = 'rgba(113,75,103,0.25)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = '0 1px 6px rgba(33,33,33,0.06)';
                  e.currentTarget.style.borderColor = 'rgba(113,75,103,0.10)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div className="flex items-start gap-3">
                  {emp.avatarUrl ? (
                    <img
                      src={emp.avatarUrl}
                      alt={emp.name}
                      className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                      style={{ border: '2px solid rgba(113,75,103,0.15)' }}
                    />
                  ) : (
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm text-white flex-shrink-0 relative overflow-hidden"
                      style={{ background: 'linear-gradient(135deg, #714B67 0%, #017E84 100%)' }}
                    >
                      <span className="relative z-10">{emp.name?.charAt(0) || 'E'}</span>
                      <div className="absolute inset-0 opacity-20" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 60%)' }} />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-sm leading-tight truncate" style={{ color: '#212121' }}>{emp.name}</h4>
                    {emp.jobPosition && (
                      <p className="text-xs flex items-center gap-1 mt-0.5 truncate" style={{ color: '#9CA3AF' }}>
                        <Briefcase className="w-3 h-3 flex-shrink-0" />
                        {emp.jobPosition}
                      </p>
                    )}
                  </div>
                </div>

                <div
                  className="flex items-center justify-between pt-2"
                  style={{ borderTop: '1px solid rgba(113,75,103,0.07)' }}
                >
                  <span className="text-xs flex items-center gap-1" style={{ color: '#9CA3AF' }}>
                    <Building className="w-3 h-3" />
                    {emp.department?.name || 'No Dept'}
                  </span>
                  <StatusBadge status={emp.status} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
