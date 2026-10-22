import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  interactive?: boolean;
  accentBar?: 'lime' | 'blue' | 'orange' | 'red';
  className?: string;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  interactive = false,
  accentBar,
  className = '',
  noPadding = false,
  style,
  ...props
}) => {
  const accentColors = {
    lime: 'var(--accent-lime)',
    blue: 'var(--accent-blue)',
    orange: 'var(--accent-orange)',
    red: 'var(--accent-red)'
  };

  return (
    <div
      className={`neo-card ${interactive ? 'neo-card-interactive' : ''} ${className}`}
      style={{
        position: 'relative',
        padding: noPadding ? '0' : '1.25rem',
        overflow: 'hidden',
        borderTop: accentBar ? `6px solid ${accentColors[accentBar]}` : undefined,
        ...style
      }}
      {...props}
    >
      {children}
    </div>
  );
};
