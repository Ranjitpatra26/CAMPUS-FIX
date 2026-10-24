import { NotificationItem, NotificationType } from '../../types';
import { authService } from '../auth/authService';

export interface NotificationResponse {
  notifications: NotificationItem[];
  unreadCount: number;
}

export interface INotificationRepository {
  getNotifications(options?: { unreadOnly?: boolean }): Promise<NotificationResponse>;
  getUnreadCount(): Promise<number>;
  markAsRead(id: string): Promise<void>;
  markAllAsRead(): Promise<void>;
  dismissNotification(id: string): Promise<void>;
}

export function formatRelativeTime(isoString?: string): string {
  if (!isoString) return 'Just now';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    const now = Date.now();
    const diffSeconds = Math.floor((now - date.getTime()) / 1000);

    if (diffSeconds < 60) return 'Just now';
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export class ApiNotificationRepository implements INotificationRepository {
  private baseUrl: string;
  private isCustomBaseUrl: boolean;

  constructor(customBaseUrl?: string) {
    this.isCustomBaseUrl = Boolean(customBaseUrl);
    const raw = customBaseUrl || import.meta.env.VITE_API_BASE_URL || '';
    this.baseUrl = raw.trim().replace(/\/+$/, '');
  }

  public getBaseUrl(): string {
    if (this.isCustomBaseUrl) {
      return this.baseUrl;
    }

    if (
      typeof window !== 'undefined' &&
      window.location &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
      this.baseUrl.includes('lambda-url')
    ) {
      return '/api';
    }
    return this.baseUrl;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const idToken = await authService.getIdToken();
    if (!idToken) {
      throw new Error(
        'Authentication required: Missing Cognito ID token. Please sign in with CampusFix SSO.'
      );
    }
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`
    };
  }

  private mapRawNotification(raw: any): NotificationItem {
    const id = raw.notificationId || (raw.complaintId?.startsWith('NOTIF#') ? raw.complaintId.replace(/^NOTIF#/, '') : raw.id);
    return {
      id,
      title: raw.title || 'Notification',
      description: raw.description || raw.message || '',
      timestamp: formatRelativeTime(raw.createdAt),
      read: Boolean(raw.isRead || raw.read),
      type: (raw.type as NotificationType) || 'system',
      ticketId: raw.relatedComplaintId || raw.ticketId,
      createdAt: raw.createdAt,
      isDismissed: Boolean(raw.isDismissed)
    };
  }

  async getNotifications(options?: { unreadOnly?: boolean }): Promise<NotificationResponse> {
    const baseUrl = this.getBaseUrl();
    if (!baseUrl) {
      throw new Error('Backend API URL is not configured (VITE_API_BASE_URL).');
    }

    const headers = await this.getAuthHeaders();
    const query = options?.unreadOnly ? '?unreadOnly=true' : '';
    const response = await fetch(`${baseUrl}/notifications${query}`, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const err = await response.json();
        errorMessage = err.message || err.error || errorMessage;
      } catch {
        // no json body
      }
      throw new Error(`Failed to retrieve notifications from DynamoDB: ${errorMessage}`);
    }

    const data = await response.json();
    const rawList = Array.isArray(data.notifications) ? data.notifications : [];
    const mapped: NotificationItem[] = rawList.map((item: any) => this.mapRawNotification(item));

    return {
      notifications: mapped,
      unreadCount: typeof data.unreadCount === 'number' ? data.unreadCount : mapped.filter((n: NotificationItem) => !n.read).length
    };
  }

  async getUnreadCount(): Promise<number> {
    const baseUrl = this.getBaseUrl();
    if (!baseUrl) return 0;

    const headers = await this.getAuthHeaders();
    const response = await fetch(`${baseUrl}/notifications/unread-count`, {
      method: 'GET',
      headers
    });

    if (!response.ok) return 0;
    const data = await response.json();
    return typeof data.unreadCount === 'number' ? data.unreadCount : 0;
  }

  async markAsRead(id: string): Promise<void> {
    const baseUrl = this.getBaseUrl();
    if (!baseUrl) return;

    const headers = await this.getAuthHeaders();
    const response = await fetch(`${baseUrl}/notifications/${encodeURIComponent(id)}/read`, {
      method: 'PATCH',
      headers
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const err = await response.json();
        errorMessage = err.message || err.error || errorMessage;
      } catch {
        // no json body
      }
      throw new Error(`Failed to persist mark-as-read in DynamoDB: ${errorMessage}`);
    }
  }

  async markAllAsRead(): Promise<void> {
    const baseUrl = this.getBaseUrl();
    if (!baseUrl) return;

    const headers = await this.getAuthHeaders();
    const response = await fetch(`${baseUrl}/notifications/read-all`, {
      method: 'PATCH',
      headers
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const err = await response.json();
        errorMessage = err.message || err.error || errorMessage;
      } catch {
        // no json body
      }
      throw new Error(`Failed to persist mark-all-read in DynamoDB: ${errorMessage}`);
    }
  }

  async dismissNotification(id: string): Promise<void> {
    const baseUrl = this.getBaseUrl();
    if (!baseUrl) return;

    const headers = await this.getAuthHeaders();
    const response = await fetch(`${baseUrl}/notifications/${encodeURIComponent(id)}/dismiss`, {
      method: 'PATCH',
      headers
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const err = await response.json();
        errorMessage = err.message || err.error || errorMessage;
      } catch {
        // no json body
      }
      throw new Error(`Failed to persist notification dismissal in DynamoDB: ${errorMessage}`);
    }
  }
}

export class LocalStorageNotificationRepository implements INotificationRepository {
  private getStorageKey(): string {
    let userId = 'default';
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem('campusfix_mock_current_user_v1');
        if (stored) {
          const parsed = JSON.parse(stored);
          userId = parsed.id || parsed.email || 'default';
        }
      }
    } catch {
      // fallback
    }
    return `campusfix_notifications_mock_${userId}`;
  }

  private loadNotifications(): NotificationItem[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(this.getStorageKey());
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('[CampusFix Mock Notifications] Error reading from localStorage', e);
    }
    return [];
  }

  private saveNotifications(notifications: NotificationItem[]): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(this.getStorageKey(), JSON.stringify(notifications));
      }
    } catch (e) {
      console.warn('[CampusFix Mock Notifications] Error writing to localStorage', e);
    }
  }

  async getNotifications(options?: { unreadOnly?: boolean }): Promise<NotificationResponse> {
    const all = this.loadNotifications();
    const active = all.filter(n => !n.isDismissed);
    const filtered = options?.unreadOnly ? active.filter(n => !n.read) : active;
    const unreadCount = active.filter(n => !n.read).length;
    return {
      notifications: filtered,
      unreadCount
    };
  }

  async getUnreadCount(): Promise<number> {
    const all = this.loadNotifications();
    return all.filter(n => !n.read && !n.isDismissed).length;
  }

  async markAsRead(id: string): Promise<void> {
    const all = this.loadNotifications();
    const updated = all.map(n => (n.id === id ? { ...n, read: true } : n));
    this.saveNotifications(updated);
  }

  async markAllAsRead(): Promise<void> {
    const all = this.loadNotifications();
    const updated = all.map(n => ({ ...n, read: true }));
    this.saveNotifications(updated);
  }

  async dismissNotification(id: string): Promise<void> {
    const all = this.loadNotifications();
    const updated = all.map(n => (n.id === id ? { ...n, isDismissed: true, read: true } : n));
    this.saveNotifications(updated);
  }
}

export class CompositeNotificationRepository implements INotificationRepository {
  private localRepo: LocalStorageNotificationRepository;
  private apiRepo: ApiNotificationRepository;
  private mockOverride?: boolean;

  constructor(options?: { mockEnabled?: boolean; apiBaseUrl?: string }) {
    this.localRepo = new LocalStorageNotificationRepository();
    this.apiRepo = new ApiNotificationRepository(options?.apiBaseUrl);
    this.mockOverride = options?.mockEnabled;
  }

  isMockEnabled(): boolean {
    if (this.mockOverride !== undefined) {
      return this.mockOverride;
    }
    if (import.meta.env.PROD) {
      return false;
    }
    const raw = import.meta.env.VITE_ENABLE_MOCK_AUTH;
    return raw !== 'false' && raw !== false;
  }

  private getActiveRepo(): INotificationRepository {
    if (this.isMockEnabled()) {
      return this.localRepo;
    }
    return this.apiRepo;
  }

  async getNotifications(options?: { unreadOnly?: boolean }): Promise<NotificationResponse> {
    return this.getActiveRepo().getNotifications(options);
  }

  async getUnreadCount(): Promise<number> {
    return this.getActiveRepo().getUnreadCount();
  }

  async markAsRead(id: string): Promise<void> {
    return this.getActiveRepo().markAsRead(id);
  }

  async markAllAsRead(): Promise<void> {
    return this.getActiveRepo().markAllAsRead();
  }

  async dismissNotification(id: string): Promise<void> {
    return this.getActiveRepo().dismissNotification(id);
  }
}

export const notificationRepository = new CompositeNotificationRepository();
