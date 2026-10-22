import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useNotification, NotificationItem } from '../../context/NotificationContext';
import { Bell, CheckCheck, Clock, ExternalLink } from 'lucide-react';

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
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotification();

  const handleItemClick = (n: NotificationItem) => {
    markAsRead(n.id);
    if (n.ticketId && onSelectTicket) {
      onSelectTicket(n.ticketId);
      onClose();
    }
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
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="secondary"
            size="sm"
            onClick={markAllAsRead}
            disabled={unreadCount === 0}
            leftIcon={<CheckCheck size={14} />}
          >
            Mark All as Read
          </Button>
        </div>

        {notifications.length === 0 ? (
          <div
            style={{
              padding: '2rem',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '0.9rem'
            }}
          >
            No notifications available.
          </div>
        ) : (
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
                  cursor: 'pointer'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '0.25rem'
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
                  <span
                    className="font-mono"
                    style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}
                  >
                    {n.timestamp}
                  </span>
                </div>

                <p
                  style={{
                    fontSize: '0.85rem',
                    color: 'var(--text-secondary)',
                    margin: 0,
                    lineHeight: 1.4
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
