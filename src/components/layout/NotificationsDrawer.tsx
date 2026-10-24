import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useNotification, NotificationItem } from '../../context/NotificationContext';
import {
  Bell,
  CheckCheck,
  Check,
  X,
  ExternalLink,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTicket?: (ticketId: string) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  onSelectTicket
}) => {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    refreshNotifications
  } = useNotification();

  const handleItemClick = (n: NotificationItem) => {
    if (!n.read) {
      markAsRead(n.id);
    }
    if (n.ticketId && onSelectTicket) {
      onSelectTicket(n.ticketId);
      onClose();
    }
  };

  const handleMarkAsReadClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    markAsRead(id);
  };

  const handleDismissClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    dismissNotification(id);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Campus Notifications"
      subtitle={`You have ${unreadCount} unread update${unreadCount === 1 ? '' : 's'}`}
      maxWidth="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Top Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button
            onClick={() => refreshNotifications()}
            disabled={isLoading}
            className="neo-btn neo-btn-secondary neo-btn-sm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.8rem',
              padding: '0.35rem 0.65rem'
            }}
            title="Refresh notifications from server"
          >
            <RefreshCw size={13} className={isLoading ? 'spin-animation' : ''} />
            <span>{isLoading ? 'Checking...' : 'Refresh'}</span>
          </button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => markAllAsRead()}
            disabled={unreadCount === 0 || isLoading}
            leftIcon={<CheckCheck size={14} />}
          >
            Mark All as Read
          </Button>
        </div>

        {/* Error Notification */}
        {error && (
          <div
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: 'var(--accent-red-light, rgba(239, 68, 68, 0.1))',
              border: '1.5px solid var(--accent-red)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              fontSize: '0.85rem',
              color: 'var(--text-primary)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} color="var(--accent-red)" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => refreshNotifications()}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--accent-blue)',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.8rem',
                textDecoration: 'underline'
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading Spinner for empty initial load */}
        {isLoading && notifications.length === 0 && (
          <div
            style={{
              padding: '3rem 1rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <RefreshCw size={24} className="spin-animation" style={{ color: 'var(--accent-lime)' }} />
            <span>Synchronizing persistent notifications...</span>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && notifications.length === 0 && (
          <div
            style={{
              padding: '3rem 1.5rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.75rem',
              backgroundColor: 'var(--bg-surface-secondary)',
              borderRadius: 'var(--radius-md)',
              border: '1.5px dashed var(--border-color)'
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-surface)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1.5px solid var(--border-color)'
              }}
            >
              <Bell size={20} color="var(--text-muted)" />
            </div>
            <div>
              <p style={{ margin: '0 0 0.25rem 0', fontWeight: 600, color: 'var(--text-primary)' }}>
                No notifications available
              </p>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Real notifications are generated automatically as tickets are submitted and updated.
              </span>
            </div>
          </div>
        )}

        {/* Notification List */}
        {notifications.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {notifications.map(n => (
              <div
                key={n.id}
                onClick={() => handleItemClick(n)}
                className="neo-card neo-card-interactive"
                style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: n.read ? 'var(--bg-surface)' : 'var(--bg-surface-secondary)',
                  borderLeft: !n.read ? '5px solid var(--accent-lime)' : '2px solid var(--border-color)',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.25rem',
                    gap: '0.5rem'
                  }}
                >
                  <span
                    className="font-heading"
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: n.read ? 600 : 700,
                      color: 'var(--text-primary)'
                    }}
                  >
                    {n.title}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    <span
                      className="font-mono"
                      style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}
                    >
                      {n.timestamp}
                    </span>

                    {/* Mark as Read button if unread */}
                    {!n.read && (
                      <button
                        onClick={e => handleMarkAsReadClick(e, n.id)}
                        className="neo-btn neo-btn-secondary"
                        style={{
                          padding: '0.2rem 0.4rem',
                          fontSize: '0.7rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                        title="Mark as read"
                        aria-label={`Mark "${n.title}" as read`}
                      >
                        <Check size={12} />
                        <span className="hidden sm:inline">Read</span>
                      </button>
                    )}

                    {/* Dismiss / Done button */}
                    <button
                      onClick={e => handleDismissClick(e, n.id)}
                      className="neo-btn neo-btn-secondary"
                      style={{
                        padding: '0.2rem 0.35rem',
                        fontSize: '0.7rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-muted)'
                      }}
                      title="Dismiss notification"
                      aria-label={`Dismiss "${n.title}"`}
                    >
                      <X size={13} />
                    </button>
                  </div>
                </div>

                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    margin: 0,
                    lineHeight: 1.4,
                    paddingRight: '1rem'
                  }}
                >
                  {n.description}
                </p>

                {n.ticketId && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.3rem',
                      marginTop: '0.4rem',
                      fontSize: '0.75rem',
                      color: 'var(--accent-blue)',
                      fontWeight: 600
                    }}
                  >
                    <span>View ticket details ({n.ticketId})</span>
                    <ExternalLink size={12} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
