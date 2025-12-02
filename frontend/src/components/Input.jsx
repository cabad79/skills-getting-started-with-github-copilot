/**
 * Input Component
 * Modern input field with label and validation support
 */

import React from 'react';

const Input = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`input-group ${className}`}>
      {label && (
        <label>
          {label}
          {required && <span style={{ color: 'var(--color-error)' }}> *</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
        {...props}
      />
      {error && (
        <span style={{
          fontSize: 'var(--font-size-sm)',
          color: 'var(--color-error)',
          marginTop: 'var(--space-1)'
        }}>
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;
