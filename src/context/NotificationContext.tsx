import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef
} from 'react';
import { NotificationItem } from '../types';
import { useAuth } from './AuthContext';
import { notificationRepository } from '../services/notifications/notificationRepository';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

export type { NotificationItem };

interface NotificationContextType {
  toasts: ToastItem[];
  addToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  removeToast: (id: string) => void;
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissNotification: (id: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Keep a reference to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Toast Management
  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, title: string, message?: string, duration = 4000) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      setToasts(prev => [...prev, { id, type, title, message }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  // Notification Fetching
  const fetchNotifications = useCallback(
    async (silent = false) => {
      if (!user) {
        setNotifications([]);
        setUnreadCount(0);
        setError(null);
        return;
      }

      if (!silent) {
        setIsLoading(true);
      }
      setError(null);

      try {
        const response = await notificationRepository.getNotifications();
        if (isMountedRef.current) {
          setNotifications(response.notifications);
          setUnreadCount(response.unreadCount);
        }
      } catch (err: any) {
        console.warn('[CampusFix Notifications] Failed to load notifications:', err);
        if (isMountedRef.current) {
          setError(err?.message || 'Unable to load notifications.');
        }
      } finally {
        if (isMountedRef.current && !silent) {
          setIsLoading(false);
        }
      }
    },
    [user]
  );

  // Fetch when authenticated user changes
  useEffect(() => {
    isMountedRef.current = true;
    fetchNotifications(false);

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchNotifications]);

  // Automatic refresh on tab focus / visibilitychange and background interval
  useEffect(() => {
    if (!user) return;

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        fetchNotifications(true);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    // Periodic refresh every 45s while tab is open
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchNotifications(true);
      }
    }, 45000);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
      clearInterval(intervalId);
    };
  }, [user, fetchNotifications]);

  // Mark single notification as read (with optimistic UI update & rollback)
  const markAsRead = async (id: string) => {
    const previousNotifications = notifications;
    const target = notifications.find(n => n.id === id);
    if (!target || target.read) return;

    // Optimistic update
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await notificationRepository.markAsRead(id);
    } catch (err: any) {
      console.error('[CampusFix Notifications] Failed to mark as read:', err);
      // Rollback on failure
      setNotifications(previousNotifications);
      setUnreadCount(previousNotifications.filter(n => !n.read).length);
      addToast('error', 'Update Failed', 'Could not persist read status. Please try again.');
    }
  };

  // Mark all notifications as read (with optimistic UI update & rollback)
  const markAllAsRead = async () => {
    if (unreadCount === 0) return;
    const previousNotifications = notifications;

    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      await notificationRepository.markAllAsRead();
      addToast('info', 'Notifications', 'All notifications marked as read.');
    } catch (err: any) {
      console.error('[CampusFix Notifications] Failed to mark all as read:', err);
      // Rollback on failure
      setNotifications(previousNotifications);
      setUnreadCount(previousNotifications.filter(n => !n.read).length);
      addToast('error', 'Update Failed', 'Could not mark all notifications as read.');
    }
  };

  // Dismiss notification (with optimistic UI update & rollback)
  const dismissNotification = async (id: string) => {
    const previousNotifications = notifications;
    const target = notifications.find(n => n.id === id);
    if (!target) return;

    // Optimistic update
    const updated = notifications.filter(n => n.id !== id);
    setNotifications(updated);
    if (!target.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }

    try {
      await notificationRepository.dismissNotification(id);
    } catch (err: any) {
      console.error('[CampusFix Notifications] Failed to dismiss notification:', err);
      // Rollback on failure
      setNotifications(previousNotifications);
      setUnreadCount(previousNotifications.filter(n => !n.read).length);
      addToast('error', 'Dismiss Failed', 'Could not dismiss notification.');
    }
  };

  const refreshNotifications = async () => {
    await fetchNotifications(false);
  };

  return (
    <NotificationContext.Provider
      value={{
        toasts,
        addToast,
        removeToast,
        notifications,
        unreadCount,
        isLoading,
        error,
        markAsRead,
        markAllAsRead,
        dismissNotification,
        refreshNotifications
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
