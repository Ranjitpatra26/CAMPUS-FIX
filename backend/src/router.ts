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
  StatusHistoryEntry
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
      if (rawPath === '/health' || rawPath === '/') {
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
      if (rawPath === '/complaints/my' && method === 'GET') {
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
      if (rawPath === '/complaints' && method === 'POST') {
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
          console.warn('[CampusFix Notification Warning] Failed to send admin notification:', notificationErr);
        }

        return createJsonResponse(201, newComplaint);
      }

      // Route: GET /admin/analytics/summary (Admin Only)
      if (rawPath === '/admin/analytics/summary' && method === 'GET') {
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
      if (rawPath === '/complaints/all' && method === 'GET') {
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
      const statusMatch = rawPath.match(/^\/complaints\/([^/]+)\/status$/);
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

        return createJsonResponse(200, updated);
      }

      // Route: PATCH /complaints/:id/assign (Admin Only)
      const assignMatch = rawPath.match(/^\/complaints\/([^/]+)\/assign$/);
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

        return createJsonResponse(200, updated);
      }

      // Route: GET /complaints/:id
      const singleMatch = rawPath.match(/^\/complaints\/([^/]+)$/);
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

      // If no route matches:
      throw new NotFoundError(`Route ${method} ${rawPath} not found.`);
    } catch (err) {
      return createErrorResponse(err);
    }
  }
}
