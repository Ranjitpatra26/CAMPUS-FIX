import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import {
  ApiNotificationRepository,
  LocalStorageNotificationRepository,
  CompositeNotificationRepository,
  formatRelativeTime
} from '../src/services/notifications/notificationRepository';
import { authService } from '../src/services/auth/authService';

class MockLocalStorage {
  private store: Record<string, string> = {};

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = value;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

describe('Notification Persistence & Repository Tests', () => {
  const testBaseUrl = 'https://ipsptjyvvdr7qovskjlrcof2hq0moqvl.lambda-url.ap-southeast-2.on.aws';
  const mockStorage = new MockLocalStorage();

  beforeEach(() => {
    vi.restoreAllMocks();
    mockStorage.clear();
    Object.defineProperty(globalThis, 'window', {
      value: { localStorage: mockStorage, location: { hostname: 'localhost' } },
      writable: true
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    mockStorage.clear();
  });

  describe('formatRelativeTime helper', () => {
    it('returns "Just now" for current timestamps or missing dates', () => {
      expect(formatRelativeTime()).toBe('Just now');
      expect(formatRelativeTime(new Date().toISOString())).toBe('Just now');
    });

    it('formats minutes ago correctly', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      expect(formatRelativeTime(fiveMinutesAgo)).toBe('5m ago');
    });

    it('formats hours ago correctly', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(threeHoursAgo)).toBe('3h ago');
    });

    it('formats yesterday correctly', () => {
      const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
      expect(formatRelativeTime(yesterday)).toBe('Yesterday');
    });
  });

  describe('ApiNotificationRepository (Cloud DynamoDB Integration)', () => {
    it('fetches notifications with Bearer ID token from GET /notifications', async () => {
      vi.spyOn(authService, 'getIdToken').mockResolvedValue('test.id.token.jwt');

      const mockResponse = {
        notifications: [
          {
            notificationId: 'notif-101',
            recipientUserId: 'student-sub-1',
            recipientRole: 'student',
            type: 'ticket_update',
            title: 'Status Updated: CMP-101',
            message: 'Your ticket is now Resolved.',
            relatedComplaintId: 'CMP-101',
            createdAt: '2026-10-24T12:00:00Z',
            isRead: false,
            isDismissed: false
          }
        ],
        unreadCount: 1
      };

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse
      } as Response);

      const repo = new ApiNotificationRepository(testBaseUrl);
      const result = await repo.getNotifications();

      expect(fetchSpy).toHaveBeenCalledWith(
        `${testBaseUrl}/notifications`,
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer test.id.token.jwt'
          }
        })
      );

      expect(result.notifications).toHaveLength(1);
      expect(result.notifications[0].id).toBe('notif-101');
      expect(result.notifications[0].title).toBe('Status Updated: CMP-101');
      expect(result.notifications[0].ticketId).toBe('CMP-101');
      expect(result.notifications[0].read).toBe(false);
      expect(result.unreadCount).toBe(1);
    });

    it('retrieves unread count from GET /notifications/unread-count', async () => {
      vi.spyOn(authService, 'getIdToken').mockResolvedValue('test.id.token.jwt');

      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ unreadCount: 3 })
      } as Response);

      const repo = new ApiNotificationRepository(testBaseUrl);
      const count = await repo.getUnreadCount();
      expect(count).toBe(3);
    });

    it('sends PATCH /notifications/:id/read to persist mark-as-read in DynamoDB', async () => {
      vi.spyOn(authService, 'getIdToken').mockResolvedValue('test.id.token.jwt');

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ isRead: true, notificationId: 'notif-101' })
      } as Response);

      const repo = new ApiNotificationRepository(testBaseUrl);
      await repo.markAsRead('notif-101');

      expect(fetchSpy).toHaveBeenCalledWith(
        `${testBaseUrl}/notifications/notif-101/read`,
        expect.objectContaining({
          method: 'PATCH',
          headers: expect.objectContaining({
            Authorization: 'Bearer test.id.token.jwt'
          })
        })
      );
    });

    it('sends PATCH /notifications/read-all to persist mark-all-read in DynamoDB', async () => {
      vi.spyOn(authService, 'getIdToken').mockResolvedValue('test.id.token.jwt');

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, count: 4 })
      } as Response);

      const repo = new ApiNotificationRepository(testBaseUrl);
      await repo.markAllAsRead();

      expect(fetchSpy).toHaveBeenCalledWith(
        `${testBaseUrl}/notifications/read-all`,
        expect.objectContaining({
          method: 'PATCH'
        })
      );
    });

    it('sends PATCH /notifications/:id/dismiss to persist dismissal in DynamoDB', async () => {
      vi.spyOn(authService, 'getIdToken').mockResolvedValue('test.id.token.jwt');

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true, notificationId: 'notif-101', isDismissed: true })
      } as Response);

      const repo = new ApiNotificationRepository(testBaseUrl);
      await repo.dismissNotification('notif-101');

      expect(fetchSpy).toHaveBeenCalledWith(
        `${testBaseUrl}/notifications/notif-101/dismiss`,
        expect.objectContaining({
          method: 'PATCH'
        })
      );
    });

    it('throws sanitized errors on server failure', async () => {
      vi.spyOn(authService, 'getIdToken').mockResolvedValue('test.id.token.jwt');

      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: 'InternalServerError', message: 'DynamoDB connection failed.' })
      } as Response);

      const repo = new ApiNotificationRepository(testBaseUrl);
      await expect(repo.getNotifications()).rejects.toThrow('DynamoDB connection failed.');
    });
  });

  describe('LocalStorageNotificationRepository (Mock Mode Persistence)', () => {
    it('persists read and dismissal states across reloads in localStorage', async () => {
      const repo1 = new LocalStorageNotificationRepository();

      // Seed mock notification directly in localStorage
      const initialItem = {
        id: 'seed-notif-1',
        title: 'Ticket Assigned',
        description: 'CMP-202 assigned to Electrical Works.',
        timestamp: 'Just now',
        read: false,
        type: 'assignment' as const,
        ticketId: 'CMP-202',
        isDismissed: false
      };
      mockStorage.setItem(
        'campusfix_notifications_mock_default',
        JSON.stringify([initialItem])
      );

      // Verify unread count
      let unread = await repo1.getUnreadCount();
      expect(unread).toBe(1);

      // Mark as read
      await repo1.markAsRead('seed-notif-1');

      // Simulate page refresh by creating new repository instance
      const repo2 = new LocalStorageNotificationRepository();
      const resAfterRead = await repo2.getNotifications();
      expect(resAfterRead.notifications[0].read).toBe(true);
      expect(resAfterRead.unreadCount).toBe(0);

      // Dismiss notification
      await repo2.dismissNotification('seed-notif-1');

      // Simulate reload again
      const repo3 = new LocalStorageNotificationRepository();
      const resAfterDismiss = await repo3.getNotifications();
      expect(resAfterDismiss.notifications).toHaveLength(0);
      expect(resAfterDismiss.unreadCount).toBe(0);
    });
  });

  describe('CompositeNotificationRepository routing', () => {
    it('routes to ApiNotificationRepository when mock auth is disabled', () => {
      const composite = new CompositeNotificationRepository({
        mockEnabled: false,
        apiBaseUrl: testBaseUrl
      });
      expect(composite.isMockEnabled()).toBe(false);
    });

    it('routes to LocalStorageNotificationRepository when mock auth is enabled', () => {
      const composite = new CompositeNotificationRepository({
        mockEnabled: true,
        apiBaseUrl: testBaseUrl
      });
      expect(composite.isMockEnabled()).toBe(true);
    });
  });
});
