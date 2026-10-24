import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { CognitoAuthService } from './auth.js';
import { DynamoDBComplaintRepository } from './db.js';
import { BackendConfig } from './config.js';
import {
  createJsonResponse,
  createErrorResponse,
  buildCorsHeaders,
  BadRequestError,
  NotFoundError,
  MethodNotAllowedError,
  ForbiddenError
} from './errors.js';
import {
  validateCreateComplaintInput,
  validateUpdateStatusInput,
  validateAssignComplaintInput
} from './validation.js';
import {
  Complaint,
  ComplaintFilterOptions,
  StatusHistoryEntry,
  InAppNotification
} from './types.js';
import { INotificationService, defaultNotificationService } from './notifications.js';

export function generateComplaintId(): string {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CMP-${ts}-${rand}`;
}

export function resolveCorsOrigin(
  configuredOrigin: string,
  requestOrigin?: string
): string {
  if (!configuredOrigin || configuredOrigin.trim() === '*') {
    return requestOrigin || '*';
  }
  const allowedList = configuredOrigin
    .split(',')
    .map(s => s.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  if (requestOrigin) {
    const cleanRequestOrigin = requestOrigin.trim().replace(/\/+$/, '');
    if (allowedList.includes(cleanRequestOrigin)) {
      return cleanRequestOrigin;
    }
  }
  return allowedList[0] || 'http://localhost:5173';
}

export class AppRouter {
  private authService: CognitoAuthService;
  private db: DynamoDBComplaintRepository;
  private config: BackendConfig;
  private notificationService: INotificationService;

  constructor(
    config: BackendConfig,
    authService: CognitoAuthService,
    db: DynamoDBComplaintRepository,
    notificationService?: INotificationService
  ) {
    this.config = config;
    this.authService = authService;
    this.db = db;
    this.notificationService = notificationService || defaultNotificationService;
  }

  private parseBody(event: APIGatewayProxyEventV2): unknown {
    if (!event.body) return {};
    try {
      const raw = event.isBase64Encoded
        ? Buffer.from(event.body, 'base64').toString('utf8')
        : event.body;
      return JSON.parse(raw);
    } catch {
      throw new BadRequestError('Invalid JSON in request body.');
    }
  }

  public async dispatch(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
    const requestOrigin = event.headers['origin'] || event.headers['Origin'];
    const origin = resolveCorsOrigin(this.config.allowedOrigin, requestOrigin);
    const method = event.requestContext.http.method.toUpperCase();
    const rawPath = event.rawPath || event.requestContext.http.path || '/';
    const pathWithoutQuery = rawPath.split('?')[0];
    const normalizedPath =
      pathWithoutQuery.length > 1 && pathWithoutQuery.endsWith('/')
        ? pathWithoutQuery.slice(0, -1)
        : pathWithoutQuery;

    // 1. Handle CORS preflight
    if (method === 'OPTIONS') {
      return {
        statusCode: 204,
        headers: buildCorsHeaders(origin),
        body: ''
      };
    }

    try {
      // 2. Health check route (unauthenticated)
      if (normalizedPath === '/health' || normalizedPath === '/') {
        return createJsonResponse(200, {
          service: 'CampusFixBackendFunction',
          status: 'HEALTHY',
          timestamp: new Date().toISOString()
        });
      }

      // 3. Authenticate incoming request via Cognito ID Token
      const authHeader =
        event.headers['authorization'] ||
        event.headers['Authorization'];
      const user = await this.authService.authenticate(authHeader);

      // 4. Match routes
      // Route: GET /complaints/my
      if (normalizedPath === '/complaints/my' && method === 'GET') {
        const queryParams = event.queryStringParameters || {};
        let limit = 50;
        if (queryParams.limit !== undefined) {
          const parsed = parseInt(queryParams.limit, 10);
          if (isNaN(parsed) || parsed <= 0) {
            throw new BadRequestError('Invalid limit parameter. Must be a positive integer.');
          }
          limit = Math.min(parsed, 100);
        }
        const nextToken = queryParams.nextToken;

        const result = await this.db.getComplaintsByStudent(user.sub, limit, nextToken);
        return createJsonResponse(200, result);
      }

      // Route: POST /complaints
      if (normalizedPath === '/complaints' && method === 'POST') {
        const body = this.parseBody(event);
        const input = validateCreateComplaintInput(body);

        const now = new Date().toISOString();
        const complaintId = generateComplaintId();

        const initialHistory: StatusHistoryEntry = {
          id: `hist-${Date.now()}-1`,
          previousStatus: null,
          newStatus: 'Submitted',
          timestamp: now,
          actor: {
            id: user.sub,
            name: user.name,
            role: 'student'
          },
          remark: 'Ticket created and registered in system queue.'
        };

        const newComplaint: Complaint = {
          complaintId,
          entityType: 'COMPLAINT',
          title: input.title,
          description: input.description,
          category: input.category,
          priority: input.priority,
          status: 'Submitted',
          location: input.location,
          department: input.department,
          // CRITICAL: Overwrite student identity strictly with verified Cognito claims
          studentId: user.sub,
          studentName: user.name,
          studentEmail: user.email,
          studentDepartment: input.studentDepartment,
          createdAt: now,
          updatedAt: now,
          statusHistory: [initialHistory],
          attachment: null
        };

        await this.db.createComplaint(newComplaint);

        // Non-blocking transactional notification to administrators
        try {
          await this.notificationService.notifyAdminNewComplaint(newComplaint);
        } catch (notificationErr) {
          console.warn('[CampusFix Notification Warning] Failed to send admin email notification:', notificationErr);
        }

        // Event-driven in-app notification for administrators
        try {
          const adminNotification: InAppNotification = {
            complaintId: `NOTIF#sub-${newComplaint.complaintId}`,
            notificationId: `sub-${newComplaint.complaintId}`,
            recipientUserId: 'admin',
            recipientRole: 'admin',
            studentId: 'admin',
            entityType: 'NOTIFICATION',
            type: 'submission',
            title: `New Ticket: ${newComplaint.complaintId}`,
            message: `[${newComplaint.priority}] ${newComplaint.title} registered in ${newComplaint.category} by ${newComplaint.studentName}.`,
            description: `[${newComplaint.priority}] ${newComplaint.title} registered in ${newComplaint.category} by ${newComplaint.studentName}.`,
            relatedComplaintId: newComplaint.complaintId,
            ticketId: newComplaint.complaintId,
            createdAt: now,
            isRead: false,
            readAt: null,
            isDismissed: false,
            dismissedAt: null
          };
          await this.db.createNotification(adminNotification);
        } catch (notifErr) {
          console.warn('[CampusFix Notification Warning] Failed to create admin in-app notification:', notifErr);
        }

        return createJsonResponse(201, newComplaint);
      }

      // Route: GET /admin/analytics/summary (Admin Only)
      if (normalizedPath === '/admin/analytics/summary' && method === 'GET') {
        this.authService.requireAdmin(user);

        const qp = event.queryStringParameters || {};
        const filters: ComplaintFilterOptions = {
          status: qp.status as any,
          priority: qp.priority as any,
          category: qp.category as any,
          department: qp.department as any
        };
        let limit = 100;
        if (qp.limit !== undefined) {
          const parsed = parseInt(qp.limit, 10);
          if (isNaN(parsed) || parsed <= 0) {
            throw new BadRequestError('Invalid limit parameter. Must be a positive integer.');
          }
          limit = Math.min(parsed, 100);
        }
        const nextToken = qp.nextToken;

        const result = await this.db.getAnalyticsRecords(limit, nextToken, filters);
        return createJsonResponse(200, {
          items: result.items,
          complaints: result.items,
          nextToken: result.nextToken
        });
      }

      // Route: GET /complaints/all (Admin Only)
      if (normalizedPath === '/complaints/all' && method === 'GET') {
        this.authService.requireAdmin(user);

        const qp = event.queryStringParameters || {};
        const filters: ComplaintFilterOptions = {
          status: qp.status as any,
          priority: qp.priority as any,
          category: qp.category as any,
          department: qp.department as any
        };
        let limit = 50;
        if (qp.limit !== undefined) {
          const parsed = parseInt(qp.limit, 10);
          if (isNaN(parsed) || parsed <= 0) {
            throw new BadRequestError('Invalid limit parameter. Must be a positive integer.');
          }
          limit = Math.min(parsed, 100);
        }
        const nextToken = qp.nextToken;

        const result = await this.db.getAllComplaints(filters, limit, nextToken);
        return createJsonResponse(200, result);
      }

      // Route: PATCH /complaints/:id/status (Admin Only)
      const statusMatch = normalizedPath.match(/^\/complaints\/([^/]+)\/status$/);
      if (statusMatch) {
        if (method !== 'PATCH') throw new MethodNotAllowedError('Only PATCH is supported for /status');
        this.authService.requireAdmin(user);

        const complaintId = decodeURIComponent(statusMatch[1]);
        const existing = await this.db.getComplaintById(complaintId);
        if (!existing) {
          throw new NotFoundError(`Complaint "${complaintId}" does not exist.`);
        }

        const body = this.parseBody(event);
        const input = validateUpdateStatusInput(body, existing.status);

        const now = new Date().toISOString();
        const historyEntry: StatusHistoryEntry = {
          id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          previousStatus: existing.status,
          newStatus: input.newStatus,
          timestamp: now,
          actor: {
            id: user.sub,
            name: user.name,
            role: 'admin'
          },
          remark: input.remark
        };

        const updated = await this.db.updateComplaintStatus(
          complaintId,
          input.newStatus,
          historyEntry,
          input.remark
        );

        // Non-blocking transactional notification to student
        try {
          await this.notificationService.notifyStudentStatusUpdated(
            updated,
            existing.status,
            input.newStatus,
            input.remark
          );
        } catch (notificationErr) {
          console.warn('[CampusFix Notification Warning] Failed to send student status notification:', notificationErr);
        }

        // Event-driven in-app notification to the complaint's student owner
        try {
          const statusNotifId = `status-${complaintId}-${input.newStatus.replace(/\s+/g, '_')}-${Date.now()}`;
          const statusNotification: InAppNotification = {
            complaintId: `NOTIF#${statusNotifId}`,
            notificationId: statusNotifId,
            recipientUserId: existing.studentId,
            recipientRole: 'student',
            studentId: existing.studentId,
            entityType: 'NOTIFICATION',
            type: 'ticket_update',
            title: `Status: ${input.newStatus}`,
            message: `Complaint ${complaintId} ("${existing.title}") status changed to ${input.newStatus}.${input.remark ? ' Remark: ' + input.remark : ''}`,
            description: `Complaint ${complaintId} ("${existing.title}") status changed to ${input.newStatus}.${input.remark ? ' Remark: ' + input.remark : ''}`,
            relatedComplaintId: complaintId,
            ticketId: complaintId,
            createdAt: now,
            isRead: false,
            readAt: null,
            isDismissed: false,
            dismissedAt: null
          };
          await this.db.createNotification(statusNotification);
        } catch (notifErr) {
          console.warn('[CampusFix Notification Warning] Failed to create in-app status notification:', notifErr);
        }

        return createJsonResponse(200, updated);
      }

      // Route: PATCH /complaints/:id/assign (Admin Only)
      const assignMatch = normalizedPath.match(/^\/complaints\/([^/]+)\/assign$/);
      if (assignMatch) {
        if (method !== 'PATCH') throw new MethodNotAllowedError('Only PATCH is supported for /assign');
        this.authService.requireAdmin(user);

        const complaintId = decodeURIComponent(assignMatch[1]);
        const existing = await this.db.getComplaintById(complaintId);
        if (!existing) {
          throw new NotFoundError(`Complaint "${complaintId}" does not exist.`);
        }

        const body = this.parseBody(event);
        const input = validateAssignComplaintInput(body);

        const now = new Date().toISOString();
        let historyEntry: StatusHistoryEntry | undefined = undefined;

        if (existing.status === 'Submitted') {
          historyEntry = {
            id: `hist-${Date.now()}-assign`,
            previousStatus: 'Submitted',
            newStatus: 'Assigned',
            timestamp: now,
            actor: {
              id: user.sub,
              name: user.name,
              role: 'admin'
            },
            remark: input.remark || `Assigned to ${input.department} (${input.assignedTo})`
          };
        }

        const updated = await this.db.assignComplaint(
          complaintId,
          input.department,
          input.assignedTo,
          historyEntry
        );

        // Non-blocking transactional notification to student
        try {
          await this.notificationService.notifyStudentAssigned(
            updated,
            input.department,
            input.assignedTo,
            input.remark
          );
        } catch (notificationErr) {
          console.warn('[CampusFix Notification Warning] Failed to send student assignment notification:', notificationErr);
        }

        // Event-driven in-app notification to the complaint's student owner
        try {
          const assignNotifId = `assign-${complaintId}-${Date.now()}`;
          const assignNotification: InAppNotification = {
            complaintId: `NOTIF#${assignNotifId}`,
            notificationId: assignNotifId,
            recipientUserId: existing.studentId,
            recipientRole: 'student',
            studentId: existing.studentId,
            entityType: 'NOTIFICATION',
            type: 'assignment',
            title: `Assigned: ${input.department}`,
            message: `Complaint ${complaintId} ("${existing.title}") assigned to ${input.department} (${input.assignedTo}).`,
            description: `Complaint ${complaintId} ("${existing.title}") assigned to ${input.department} (${input.assignedTo}).`,
            relatedComplaintId: complaintId,
            ticketId: complaintId,
            createdAt: now,
            isRead: false,
            readAt: null,
            isDismissed: false,
            dismissedAt: null
          };
          await this.db.createNotification(assignNotification);
        } catch (notifErr) {
          console.warn('[CampusFix Notification Warning] Failed to create in-app assign notification:', notifErr);
        }

        return createJsonResponse(200, updated);
      }

      // Route: GET /complaints/:id
      const singleMatch = normalizedPath.match(/^\/complaints\/([^/]+)$/);
      if (singleMatch && method === 'GET') {
        const complaintId = decodeURIComponent(singleMatch[1]);
        const complaint = await this.db.getComplaintById(complaintId);
        if (!complaint) {
          throw new NotFoundError(`Complaint "${complaintId}" does not exist.`);
        }

        // Student Data Isolation Guard:
        // A student can ONLY view complaints where complaint.studentId === caller's Cognito sub
        if (!user.isAdmin && complaint.studentId !== user.sub) {
          throw new ForbiddenError('You do not have permission to view another student\'s complaint.');
        }

        return createJsonResponse(200, complaint);
      }

      // Route: GET /notifications
      if (normalizedPath === '/notifications' && method === 'GET') {
        const queryParams = event.queryStringParameters || {};
        let limit = 50;
        if (queryParams.limit !== undefined) {
          const parsed = parseInt(queryParams.limit, 10);
          if (isNaN(parsed) || parsed <= 0) {
            throw new BadRequestError('Invalid limit parameter. Must be a positive integer.');
          }
          limit = Math.min(parsed, 100);
        }
        const unreadOnly = queryParams.unreadOnly === 'true';
        const includeDismissed = queryParams.includeDismissed === 'true';

        if (user.isAdmin) {
          // Administrators see notifications addressed to 'admin' queue and optionally their personal user.sub
          const adminQueue = await this.db.getNotificationsByRecipient('admin', {
            limit,
            unreadOnly,
            includeDismissed
          });

          let merged = [...adminQueue.notifications];
          if (user.sub !== 'admin') {
            const personal = await this.db.getNotificationsByRecipient(user.sub, {
              limit,
              unreadOnly,
              includeDismissed
            });
            const existingIds = new Set(merged.map(n => n.notificationId));
            for (const p of personal.notifications) {
              if (!existingIds.has(p.notificationId)) {
                merged.push(p);
              }
            }
          }
          merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          const unreadCount = merged.filter(n => !n.isRead && !n.isDismissed).length;

          return createJsonResponse(200, {
            notifications: merged.slice(0, limit),
            unreadCount
          });
        } else {
          // Students can strictly only view notifications for their own verified Cognito sub
          const result = await this.db.getNotificationsByRecipient(user.sub, {
            limit,
            unreadOnly,
            includeDismissed,
            nextToken: queryParams.nextToken
          });

          return createJsonResponse(200, {
            notifications: result.notifications,
            unreadCount: result.unreadCount,
            nextToken: result.nextToken
          });
        }
      }

      // Route: GET /notifications/unread-count
      if (normalizedPath === '/notifications/unread-count' && method === 'GET') {
        if (user.isAdmin) {
          const adminQueue = await this.db.getNotificationsByRecipient('admin', {
            unreadOnly: true,
            limit: 100
          });
          return createJsonResponse(200, { unreadCount: adminQueue.unreadCount });
        } else {
          const count = await this.db.getUnreadNotificationCount(user.sub);
          return createJsonResponse(200, { unreadCount: count });
        }
      }

      // Route: PATCH /notifications/read-all
      if (normalizedPath === '/notifications/read-all' && method === 'PATCH') {
        let count = 0;
        if (user.isAdmin) {
          count += await this.db.markAllNotificationsAsRead('admin');
          if (user.sub !== 'admin') {
            count += await this.db.markAllNotificationsAsRead(user.sub);
          }
        } else {
          count = await this.db.markAllNotificationsAsRead(user.sub);
        }
        return createJsonResponse(200, { success: true, count });
      }

      // Route: PATCH /notifications/:id/read
      const notifReadMatch = normalizedPath.match(/^\/notifications\/([^/]+)\/read$/);
      if (notifReadMatch) {
        if (method !== 'PATCH') throw new MethodNotAllowedError('Only PATCH is supported for /notifications/:id/read');
        const notificationId = decodeURIComponent(notifReadMatch[1]);
        const existing = await this.db.getNotificationById(notificationId);
        if (!existing) {
          throw new NotFoundError(`Notification "${notificationId}" not found.`);
        }

        // Authorization check:
        // A student can only mark their own notification as read
        // An admin can mark 'admin' notifications or their own as read
        if (!user.isAdmin && existing.recipientUserId !== user.sub) {
          throw new ForbiddenError('You do not have permission to modify this notification.');
        }

        const updated = await this.db.markNotificationAsRead(notificationId);
        return createJsonResponse(200, updated);
      }

      // Route: PATCH /notifications/:id/dismiss or DELETE /notifications/:id
      const notifDismissMatch = normalizedPath.match(/^\/notifications\/([^/]+)\/dismiss$/);
      const notifDeleteMatch = normalizedPath.match(/^\/notifications\/([^/]+)$/);
      if (
        (notifDismissMatch && method === 'PATCH') ||
        (notifDeleteMatch && method === 'DELETE')
      ) {
        const notificationId = decodeURIComponent(
          (notifDismissMatch ? notifDismissMatch[1] : notifDeleteMatch![1])
        );
        const existing = await this.db.getNotificationById(notificationId);
        if (!existing) {
          throw new NotFoundError(`Notification "${notificationId}" not found.`);
        }

        if (!user.isAdmin && existing.recipientUserId !== user.sub) {
          throw new ForbiddenError('You do not have permission to dismiss this notification.');
        }

        const updated = await this.db.dismissNotification(notificationId);
        return createJsonResponse(200, {
          success: true,
          notificationId: updated.notificationId,
          isDismissed: updated.isDismissed
        });
      }

      // If no route matches:
      throw new NotFoundError(`Route ${method} ${rawPath} not found.`);
    } catch (err) {
      return createErrorResponse(err);
    }
  }
}
