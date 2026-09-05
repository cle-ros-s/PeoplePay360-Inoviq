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
        <label htmlFor={name} className="form-label">
          {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
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
        className={`input-field ${error ? 'error' : ''}`}
      />
      {error && (
        <p className="text-xs mt-1.5 font-medium" style={{ color: '#EF4444' }}>
          {error.message || error}
        </p>
      )}
    </div>
  );
}
