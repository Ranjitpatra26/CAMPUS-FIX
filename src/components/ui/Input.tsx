import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      required,
      leftIcon,
      rightIcon,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || (label ? `input-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="neo-input-group">
        {label && (
          <label htmlFor={inputId} className="neo-label">
            <span>{label}</span>
            {required && <span style={{ color: 'var(--accent-red)', fontWeight: 800 }}>*</span>}
          </label>
        )}

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
          {leftIcon && (
            <span
              style={{
                position: 'absolute',
                left: '0.85rem',
                color: 'var(--text-secondary)',
                display: 'flex',
                alignItems: 'center',
                pointerEvents: 'none'
              }}
            >
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            className={`neo-input ${error ? 'neo-input-error' : ''} ${className}`}
            style={{
              paddingLeft: leftIcon ? '2.5rem' : '0.85rem',
              paddingRight: rightIcon ? '2.5rem' : '0.85rem'
            }}
            {...props}
          />

          {rightIcon && (
            <span
              style={{
                position: 'absolute',
                right: '0.85rem',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {rightIcon}
            </span>
          )}
        </div>

        {error && <p className="neo-error-text">{error}</p>}
        {helperText && !error && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
