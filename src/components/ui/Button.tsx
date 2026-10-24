import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'blue' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  loadingText,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  ...props
}) => {
  const variantClass = {
    primary: 'neo-btn-primary',
    secondary: 'neo-btn-secondary',
    blue: 'neo-btn-blue',
    danger: 'neo-btn-danger'
  }[variant];

  const sizeClass = {
    sm: 'neo-btn-sm',
    md: '',
    lg: 'neo-btn-lg'
  }[size];

  const fullWidthClass = fullWidth ? 'neo-btn-full' : '';

  return (
    <button
      className={`neo-btn ${variantClass} ${sizeClass} ${fullWidthClass} ${className}`.trim().replace(/\s+/g, ' ')}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin"
            style={{
              animation: 'spin 1s linear infinite',
              width: size === 'sm' ? '14px' : '18px',
              height: size === 'sm' ? '14px' : '18px'
            }}
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              strokeDasharray="30 60"
            />
          </svg>
          <style>{`
            @keyframes spin {
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <span>{loadingText || 'Processing...'}</span>
        </>
      ) : (
        <>
          {leftIcon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
