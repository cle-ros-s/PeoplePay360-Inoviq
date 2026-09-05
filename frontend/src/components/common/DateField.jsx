import React from 'react';

export default function DateField({
  label,
  name,
  register,
  error,
  required = false,
  disabled = false,
  min,
  max,
  className = '',
}) {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={name} className="form-label">
          {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
        </label>
      )}
      <input
        id={name}
        type="date"
        min={min}
        max={max}
        disabled={disabled}
        {...(register ? register(name) : {})}
        className={`input-field ${error ? 'error' : ''}`}
        style={disabled ? { background: '#F3F4F6', color: '#9CA3AF', cursor: 'not-allowed' } : {}}
      />
      {error && (
        <p className="text-xs mt-1.5 font-medium" style={{ color: '#EF4444' }}>
          {error.message || error}
        </p>
      )}
    </div>
  );
}
