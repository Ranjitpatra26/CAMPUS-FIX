import React from 'react';
import { ComplaintStatus } from '../../types';
import { Clock, UserCheck, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: ComplaintStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const configs: Record<
    ComplaintStatus,
    { bg: string; text: string; icon: React.ReactNode; label: string }
  > = {
    Submitted: {
      bg: 'var(--status-submitted-bg)',
      text: 'var(--status-submitted-text)',
      icon: <Clock size={size === 'sm' ? 12 : 14} />,
      label: 'Submitted'
    },
    Assigned: {
      bg: 'var(--status-assigned-bg)',
      text: 'var(--status-assigned-text)',
      icon: <UserCheck size={size === 'sm' ? 12 : 14} />,
      label: 'Assigned'
    },
    'In Progress': {
      bg: 'var(--status-in-progress-bg)',
      text: 'var(--status-in-progress-text)',
      icon: <RefreshCw size={size === 'sm' ? 12 : 14} />,
      label: 'In Progress'
    },
    Resolved: {
      bg: 'var(--status-resolved-bg)',
      text: 'var(--status-resolved-text)',
      icon: <CheckCircle size={size === 'sm' ? 12 : 14} />,
      label: 'Resolved'
    },
    Rejected: {
      bg: 'var(--status-rejected-bg)',
      text: 'var(--status-rejected-text)',
      icon: <XCircle size={size === 'sm' ? 12 : 14} />,
      label: 'Rejected'
    }
  };

  const config = configs[status] || configs.Submitted;

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
