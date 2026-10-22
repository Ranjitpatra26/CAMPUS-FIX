import React from 'react';
import { Complaint, ComplaintStatus } from '../../types';
import { Check, Clock, AlertTriangle, UserCheck, RefreshCw, XCircle } from 'lucide-react';

interface StatusTimelineProps {
  complaint: Complaint;
}

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ complaint }) => {
  const isRejected = complaint.status === 'Rejected';

  // Standard progressive flow
  const standardSteps: ComplaintStatus[] = ['Submitted', 'Assigned', 'In Progress', 'Resolved'];

  const getEventForStatus = (status: ComplaintStatus) => {
    // Find the latest history entry matching this status
    return [...complaint.statusHistory].reverse().find(h => h.newStatus === status);
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Visual Stepper Bar for Desktop/Tablet */}
      <div
        className="neo-card"
        style={{
          padding: '1.25rem',
          backgroundColor: 'var(--bg-surface-secondary)'
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isRejected ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)',
            gap: '0.75rem',
            position: 'relative'
          }}
        >
          {standardSteps.map((step, idx) => {
            if (isRejected && (step === 'In Progress' || step === 'Resolved')) {
              return null; // Handle rejected state at the end
            }

            const event = getEventForStatus(step);
            const isCompleted = Boolean(event);
            const isCurrent = complaint.status === step;

            return (
              <div
                key={step}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  position: 'relative',
                  zIndex: 2
                }}
              >
                {/* Step Circle/Box */}
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: 'var(--radius-sm)',
                    border: 'var(--border-width) solid var(--border-color)',
                    backgroundColor: isCompleted
                      ? isCurrent
                        ? 'var(--accent-lime)'
                        : 'var(--accent-blue)'
                      : 'var(--bg-surface)',
                    color: isCompleted
                      ? isCurrent
                        ? 'var(--accent-lime-text)'
                        : 'var(--accent-blue-text)'
                      : 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: isCompleted ? '2px 2px 0px var(--border-color)' : 'none',
                    fontWeight: 800,
                    marginBottom: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                >
                  {isCompleted ? (
                    isCurrent ? (
                      <Clock size={18} />
                    ) : (
                      <Check size={18} strokeWidth={3} />
                    )
                  ) : (
                    <span>{idx + 1}</span>
                  )}
                </div>

                <span
                  className="font-heading"
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: isCompleted ? 'var(--text-primary)' : 'var(--text-muted)'
                  }}
                >
                  {step}
                </span>

                {event && (
                  <span
                    className="font-mono"
                    style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}
                  >
                    {formatDate(event.timestamp)}
                  </span>
                )}
              </div>
            );
          })}

          {/* Terminal Rejected state pill if rejected */}
          {isRejected && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
                zIndex: 2
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: 'var(--radius-sm)',
                  border: 'var(--border-width) solid var(--border-color)',
                  backgroundColor: 'var(--accent-red)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '2px 2px 0px var(--border-color)',
                  marginBottom: '0.5rem'
                }}
              >
                <XCircle size={20} />
              </div>
              <span
                className="font-heading"
                style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-red)' }}
              >
                Rejected
              </span>
              <span
                className="font-mono"
                style={{ fontSize: '0.7rem', color: 'var(--accent-red)', marginTop: '0.2rem' }}
              >
                Terminal State
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Detailed Status Event Log */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <h4
          className="font-heading"
          style={{
            fontSize: '0.95rem',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            color: 'var(--text-secondary)'
          }}
        >
          Resolution Audit Trail ({complaint.statusHistory.length} Events)
        </h4>

        {complaint.statusHistory.map((hist, idx) => {
          const isLatest = idx === complaint.statusHistory.length - 1;

          return (
            <div
              key={hist.id}
              className="neo-card"
              style={{
                padding: '1rem',
                borderLeft: isLatest
                  ? '6px solid var(--accent-lime)'
                  : '4px solid var(--border-color)',
                backgroundColor: isLatest ? 'var(--bg-surface)' : 'var(--bg-surface-secondary)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  marginBottom: '0.4rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    className="font-heading"
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)'
                    }}
                  >
                    Status changed to:{' '}
                    <span style={{ color: 'var(--accent-blue)' }}>{hist.newStatus}</span>
                  </span>
                  {isLatest && (
                    <span
                      className="neo-badge"
                      style={{
                        backgroundColor: 'var(--accent-lime)',
                        color: 'var(--accent-lime-text)',
                        fontSize: '0.675rem',
                        padding: '0.1rem 0.4rem'
                      }}
                    >
                      Current
                    </span>
                  )}
                </div>

                <span
                  className="font-mono"
                  style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}
                >
                  {formatDate(hist.timestamp)}
                </span>
              </div>

              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                <span style={{ fontWeight: 600 }}>Action by:</span> {hist.actor.name}{' '}
                <span className="font-mono" style={{ textTransform: 'capitalize' }}>
                  ({hist.actor.role})
                </span>
              </div>

              {hist.remark && (
                <div
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    padding: '0.6rem 0.85rem',
                    border: '1.5px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.875rem',
                    color: 'var(--text-primary)',
                    fontStyle: 'italic',
                    marginTop: '0.5rem'
                  }}
                >
                  "{hist.remark}"
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
