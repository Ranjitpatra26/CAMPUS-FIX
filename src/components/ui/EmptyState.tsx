import React from 'react';
import { Button } from './Button';
import { Inbox } from 'lucide-react';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  icon
}) => {
  return (
    <div
      className="neo-card"
      style={{
        padding: '3rem 1.5rem',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--bg-surface)'
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          backgroundColor: 'var(--accent-lime)',
          border: 'var(--border-width) solid var(--border-color)',
          boxShadow: 'var(--shadow-offset)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem',
          color: 'var(--text-primary)'
        }}
      >
        {icon || <Inbox size={32} />}
      </div>

      <h3
        className="font-heading"
        style={{ fontSize: '1.25rem', color: 'var(--text-primary)', marginBottom: '0.4rem' }}
      >
        {title}
      </h3>
      <p
        style={{
          color: 'var(--text-secondary)',
          fontSize: '0.925rem',
          maxWidth: '420px',
          marginBottom: actionLabel ? '1.5rem' : '0'
        }}
      >
        {description}
      </p>

      {actionLabel && onAction && (
        <Button variant="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
