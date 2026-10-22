import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  maxLength?: number;
  currentLength?: number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      required,
      maxLength,
      currentLength,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || (label ? `textarea-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

    return (
      <div className="neo-input-group">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {label && (
            <label htmlFor={textareaId} className="neo-label">
              <span>{label}</span>
              {required && <span style={{ color: 'var(--accent-red)', fontWeight: 800 }}>*</span>}
            </label>
          )}

          {maxLength !== undefined && currentLength !== undefined && (
            <span
              className="font-mono"
              style={{
                fontSize: '0.75rem',
                color: currentLength > maxLength * 0.9 ? 'var(--accent-red)' : 'var(--text-muted)',
                fontWeight: 600
              }}
            >
              {currentLength} / {maxLength}
            </span>
          )}
        </div>

        <textarea
          ref={ref}
          id={textareaId}
          maxLength={maxLength}
          className={`neo-textarea ${error ? 'neo-input-error' : ''} ${className}`}
          rows={props.rows || 4}
          {...props}
        />

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

Textarea.displayName = 'Textarea';
