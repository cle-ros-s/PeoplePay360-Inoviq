import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function SmartButton({ icon: Icon, label, count, onClick, to, active = false }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex items-center gap-2.5 px-4 py-2 rounded-lg border text-sm font-medium transition-all shadow-sm ${
        active
          ? 'bg-blue-50 border-blue-300 text-blue-700 font-semibold'
          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'
      }`}
    >
      {Icon && <Icon className={`w-4 h-4 ${active ? 'text-blue-600' : 'text-gray-500'}`} />}
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={`ml-1 px-2 py-0.5 rounded-full text-xs font-bold ${
            active ? 'bg-blue-200 text-blue-800' : 'bg-gray-100 text-gray-700'
          }`}
        >
          {count}
        </span>
      )}
    </button>
  );
}
