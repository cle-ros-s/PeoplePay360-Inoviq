import React from 'react';

export default function FormField({
  label,
  name,
  type = 'text',
  register,
  error,
  required = false,
  placeholder,
  disabled = false,
  step,
  min,
  max,
  className = '',
}) {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={name} className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        id={name}
        type={type}
        step={step}
        min={min}
        max={max}
        placeholder={placeholder}
        disabled={disabled}
        {...(register ? register(name) : {})}
        className={`w-full px-3.5 py-2 text-sm rounded-lg border transition-colors shadow-sm focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-100'
        } ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white text-gray-900'}`}
      />
      {error && <p className="text-xs text-red-600 mt-1 font-medium">{error.message || error}</p>}
    </div>
  );
}
