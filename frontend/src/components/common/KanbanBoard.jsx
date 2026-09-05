import React from 'react';
import StatusBadge from './StatusBadge';
import { User, Building, Briefcase } from 'lucide-react';

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-6">
      {groupKeys.map((groupName) => (
        <div key={groupName} className="bg-gray-50/80 rounded-xl p-4 border border-gray-200 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-gray-200">
            <h3 className="font-semibold text-sm text-gray-800">{groupName}</h3>
            <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full font-bold">
              {grouped[groupName].length}
            </span>
          </div>

          <div className="flex flex-col gap-3 overflow-y-auto max-h-[70vh] pr-1">
            {grouped[groupName].map((emp) => (
              <div
                key={emp.id}
                onClick={() => onCardClick && onCardClick(emp)}
                className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {emp.avatarUrl ? (
                      <img
                        src={emp.avatarUrl}
                        alt={emp.name}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                        {emp.name?.charAt(0) || 'E'}
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-sm text-gray-900 leading-snug">{emp.name}</h4>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Briefcase className="w-3 h-3 text-gray-400" />
                        {emp.jobPosition}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Building className="w-3 h-3 text-gray-400" />
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
