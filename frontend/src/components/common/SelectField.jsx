import React from 'react';

export default function SelectField({
  label,
  name,
  options = [],
  register,
  error,
  required = false,
  disabled = false,
  placeholder = 'Select option...',
  className = 'mb-4',
}) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={name} className="form-label">
          {label} {required && <span style={{ color: '#EF4444' }}>*</span>}
        </label>
      )}
      <select
        id={name}
        disabled={disabled}
        {...(register ? register(name) : {})}
        className={`input-field ${error ? 'error' : ''}`}
        style={disabled ? { background: '#F3F4F6', color: '#9CA3AF', cursor: 'not-allowed' } : {}}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => {
          const val = typeof opt === 'object' ? opt.value : opt;
          const lbl = typeof opt === 'object' ? opt.label : opt;
          return (
            <option key={val} value={val}>
              {lbl}
            </option>
          );
        })}
      </select>
      {error && (
        <p className="text-xs mt-1.5 font-medium" style={{ color: '#EF4444' }}>
          {error.message || error}
        </p>
      )}
    </div>
  );
}
