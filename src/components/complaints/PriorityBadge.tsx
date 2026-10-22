import React from 'react';
import { ComplaintPriority } from '../../types';
import { AlertCircle, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';

interface PriorityBadgeProps {
  priority: ComplaintPriority;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'md' }) => {
  const configs: Record<
    ComplaintPriority,
    { bg: string; text: string; icon: React.ReactNode; label: string }
  > = {
    Low: {
      bg: 'var(--bg-surface-secondary)',
      text: 'var(--text-secondary)',
      icon: <ArrowDown size={size === 'sm' ? 12 : 14} />,
      label: 'Low'
    },
    Medium: {
      bg: 'var(--accent-orange-surface)',
      text: 'var(--accent-orange)',
      icon: <ArrowUp size={size === 'sm' ? 12 : 14} />,
      label: 'Medium'
    },
    High: {
      bg: 'var(--accent-red-surface)',
      text: 'var(--accent-red)',
      icon: <AlertTriangle size={size === 'sm' ? 12 : 14} />,
      label: 'High'
    },
    Critical: {
      bg: 'var(--accent-red)',
      text: '#FFFFFF',
      icon: <AlertCircle size={size === 'sm' ? 12 : 14} />,
      label: 'Critical'
    }
  };

  const config = configs[priority] || configs.Low;

  return (
    <span
      className="neo-badge"
      style={{
        backgroundColor: config.bg,
        color: config.text,
        fontSize: size === 'sm' ? '0.725rem' : '0.8rem',
        padding: size === 'sm' ? '0.15rem 0.5rem' : '0.25rem 0.65rem',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.35rem',
        border: '1.5px solid var(--border-color)',
        borderRadius: 'var(--radius-sm)',
        fontWeight: 700
      }}
    >
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};
