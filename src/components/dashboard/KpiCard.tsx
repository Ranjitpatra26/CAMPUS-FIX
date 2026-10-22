import React from 'react';
import { Card } from '../ui/Card';

export interface KpiCardProps {
  label: string;
  value: number | string;
  indicatorText?: string;
  icon?: React.ReactNode;
  accentBar?: 'lime' | 'blue' | 'orange' | 'red';
  onClick?: () => void;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  label,
  value,
  indicatorText,
  icon,
  accentBar = 'lime',
  onClick
}) => {
  return (
    <Card
      accentBar={accentBar}
      interactive={Boolean(onClick)}
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '130px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <span
          className="font-heading"
          style={{
            fontSize: '0.85rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--text-secondary)'
          }}
        >
          {label}
        </span>
        {icon && (
          <div
            style={{
              padding: '0.35rem',
              borderRadius: 'var(--radius-sm)',
              border: '1.5px solid var(--border-color)',
              backgroundColor: 'var(--bg-surface-secondary)',
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '1.5px 1.5px 0px var(--border-color)'
            }}
          >
            {icon}
          </div>
        )}
      </div>

      <div style={{ marginTop: '0.75rem' }}>
        <div
          className="font-heading"
          style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            lineHeight: 1,
            color: 'var(--text-primary)',
            letterSpacing: '-0.04em'
          }}
        >
          {value}
        </div>

        {indicatorText && (
          <p
            style={{
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              marginTop: '0.35rem',
              fontWeight: 500
            }}
          >
            {indicatorText}
          </p>
        )}
      </div>
    </Card>
  );
};
