import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'lime' | 'blue' | 'orange' | 'red' | 'neutral';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  icon,
  className = '',
  style
}) => {
  const variantStyles: Record<string, { bg: string; text: string }> = {
    lime: { bg: 'var(--accent-lime)', text: 'var(--accent-lime-text)' },
    blue: { bg: 'var(--accent-blue-surface)', text: 'var(--accent-blue)' },
    orange: { bg: 'var(--accent-orange-surface)', text: 'var(--accent-orange)' },
    red: { bg: 'var(--accent-red-surface)', text: 'var(--accent-red)' },
    neutral: { bg: 'var(--bg-surface-secondary)', text: 'var(--text-primary)' }
  };

  const { bg, text } = variantStyles[variant] || variantStyles.neutral;

  return (
    <span
      className={`neo-badge ${className}`}
      style={{
        backgroundColor: bg,
        color: text,
        fontSize: size === 'sm' ? '0.72rem' : '0.8rem',
        padding: size === 'sm' ? '0.15rem 0.45rem' : '0.25rem 0.65rem',
        ...style
      }}
    >
      {icon && <span style={{ display: 'inline-flex', alignItems: 'center' }}>{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
