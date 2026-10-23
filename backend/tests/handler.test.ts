import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import { AppRouter } from '../src/router.js';
import { CognitoAuthService, ITokenVerifier } from '../src/auth.js';
import { DynamoDBComplaintRepository } from '../src/db.js';
import { BackendConfig } from '../src/config.js';
import { INotificationService } from '../src/notifications.js';
import { InMemoryDynamoClient } from './mockDynamo.js';
import {
  createJsonResponse,
  createErrorResponse,
  buildCorsHeaders,
  BadRequestError
} from '../src/errors.js';

describe('CampusFixBackendFunction End-to-End Endpoint & Security Tests', () => {
  const testConfig: BackendConfig = {
    awsRegion: 'ap-southeast-2',
    tableName: 'CampusFixComplaints',
    cognitoUserPoolId: 'ap-southeast-2_tNhqL8tGi',
    cognitoClientId: '4oq0kq3qljmhdu8rmbjclt94sl',
    cognitoAdminGroup: 'Administrators',
    allowedOrigin: 'http://localhost:5173, https://campus-fix-ten-iota.vercel.app',
    sesSourceEmail: 'notifications@campusfix.edu',
    adminNotificationEmail: 'admin@campusfix.edu',
    frontendBaseUrl: ''
  };

  const mockVerifier: ITokenVerifier = {
    verify: async (token: string) => {
      if (token === 'student_token_1') {
        return {
          sub: 'student-sub-001',
          email: 'student1@campus.edu',
          name: 'Student One',
          'cognito:groups': ['Students'],
          token_use: 'id'
        } as any;
      }
      if (token === 'student_token_2') {
        return {
          sub: 'student-sub-002',
          email: 'student2@campus.edu',
          name: 'Student Two',
          'cognito:groups': ['Students'],
          token_use: 'id'
        } as any;
      }
      if (token === 'admin_token') {
        return {
          sub: 'admin-sub-999',
          email: 'chief.admin@campusfix.edu',
          name: 'Dr. Aris Thorne',
          'cognito:groups': ['Administrators'],
          token_use: 'id'
        } as any;
      }
      throw new Error('Invalid token');
    }
  };

  let mockClient: InMemoryDynamoClient;
  let db: DynamoDBComplaintRepository;
  let authService: CognitoAuthService;
  let mockNotificationService: INotificationService;
  let router: AppRouter;

  beforeEach(() => {
    mockClient = new InMemoryDynamoClient();
    db = new DynamoDBComplaintRepository(testConfig, mockClient);
    authService = new CognitoAuthService(testConfig, mockVerifier);
    mockNotificationService = {
      notifyAdminNewComplaint: vi.fn().mockResolvedValue(true),
      notifyStudentStatusUpdated: vi.fn().mockResolvedValue(true),
      notifyStudentAssigned: vi.fn().mockResolvedValue(true)
    };
    router = new AppRouter(testConfig, authService, db, mockNotificationService);
  });

  function createEvent(options: {
    method: string;
    path: string;
    token?: string;
    body?: any;
    queryParams?: Record<string, string>;
    headers?: Record<string, string>;
  }): APIGatewayProxyEventV2 {
    const headers: Record<string, string> = {
      'content-type': 'application/json',
      ...(options.headers || {})
    };
    if (options.token) {
      headers['authorization'] = `Bearer ${options.token}`;
    }

    return {
      version: '2.0',
      routeKey: `${options.method} ${options.path}`,
      rawPath: options.path,
      rawQueryString: '',
      headers,
      queryStringParameters: options.queryParams,
      requestContext: {
        accountId: '123456789012',
        apiId: 'mock-api-id',
        domainName: 'mock.lambda-url.ap-southeast-2.on.aws',
        domainPrefix: 'mock',
        http: {
          method: options.method,
          path: options.path,
          protocol: 'HTTP/1.1',
          sourceIp: '127.0.0.1',
          userAgent: 'vitest-agent'
        },
        requestId: 'req-001',
        routeKey: `${options.method} ${options.path}`,
        stage: '$default',
        time: '23/Oct/2026:12:00:00 +0000',
        timeEpoch: 1792670400000
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      isBase64Encoded: false
    };
  }

  it('handles CORS OPTIONS preflight request with 204 and correct CORS headers', async () => {
    const event = createEvent({
      method: 'OPTIONS',
      path: '/complaints',
      headers: { Origin: 'https://campus-fix-ten-iota.vercel.app' }
    });
    const res = await router.dispatch(event);

    expect(res.statusCode).toBe(204);
    expect((res as any).headers['Access-Control-Allow-Origin']).toBe('https://campus-fix-ten-iota.vercel.app');
    expect((res as any).headers['Access-Control-Allow-Methods']).toContain('GET, POST, PATCH, OPTIONS');
    expect((res as any).headers['Access-Control-Allow-Headers']).toContain('Authorization, Content-Type');
  });

  it('ensures application-level JSON responses do NOT emit Access-Control-Allow-Origin to prevent duplicate headers with AWS Function URL CORS', async () => {
    // 1. Health check response
    const healthEvent = createEvent({
      method: 'GET',
      path: '/health',
      headers: { Origin: 'https://campus-fix-ten-iota.vercel.app' }
    });
    const healthRes = await router.dispatch(healthEvent);
    expect(healthRes.statusCode).toBe(200);
    expect((healthRes as any).headers['Content-Type']).toBe('application/json');
    expect((healthRes as any).headers['Access-Control-Allow-Origin']).toBeUndefined();
    expect((healthRes as any).headers['Access-Control-Allow-Methods']).toBeUndefined();

    // 2. Authenticated GET /complaints/my
    const myComplaintsEvent = createEvent({
      method: 'GET',
      path: '/complaints/my',
      token: 'student_token_1',
      headers: { Origin: 'https://campus-fix-ten-iota.vercel.app' }
    });
    const myRes = await router.dispatch(myComplaintsEvent);
    expect(myRes.statusCode).toBe(200);
    expect((myRes as any).headers['Content-Type']).toBe('application/json');
    expect((myRes as any).headers['Access-Control-Allow-Origin']).toBeUndefined();

    // 3. Authenticated POST /complaints
    const postEvent = createEvent({
      method: 'POST',
      path: '/complaints',
      token: 'student_token_1',
      headers: { Origin: 'https://campus-fix-ten-iota.vercel.app' },
      body: {
        title: 'Projector broken in CS-101',
        description: 'HDMI port is loose and no display is output.',
        location: 'CS Department, Room 101',
        category: 'Classroom Facilities',
        priority: 'High'
      }
    });
    const postRes = await router.dispatch(postEvent);
    expect(postRes.statusCode).toBe(201);
    expect((postRes as any).headers['Content-Type']).toBe('application/json');
    expect((postRes as any).headers['Access-Control-Allow-Origin']).toBeUndefined();
  });

  it('ensures application-level error responses do NOT emit Access-Control-Allow-Origin', async () => {
    // 1. 401 Unauthorized (missing token)
    const unauthorizedEvent = createEvent({
      method: 'GET',
      path: '/complaints/my',
      headers: { Origin: 'https://campus-fix-ten-iota.vercel.app' }
    });
    const unauthRes = await router.dispatch(unauthorizedEvent);
    expect(unauthRes.statusCode).toBe(401);
    expect((unauthRes as any).headers['Content-Type']).toBe('application/json');
    expect((unauthRes as any).headers['Access-Control-Allow-Origin']).toBeUndefined();

    // 2. 404 Not Found (invalid route with authenticated caller)
    const notFoundEvent = createEvent({
      method: 'GET',
      path: '/non-existent-endpoint',
      token: 'student_token_1',
      headers: { Origin: 'https://campus-fix-ten-iota.vercel.app' }
    });
    const notFoundRes = await router.dispatch(notFoundEvent);
    expect(notFoundRes.statusCode).toBe(404);
    expect((notFoundRes as any).headers['Content-Type']).toBe('application/json');
    expect((notFoundRes as any).headers['Access-Control-Allow-Origin']).toBeUndefined();

    // 3. 400 Bad Request (invalid payload)
    const badRequestEvent = createEvent({
      method: 'POST',
      path: '/complaints',
      token: 'student_token_1',
      headers: { Origin: 'https://campus-fix-ten-iota.vercel.app' },
      body: { title: '' } // Missing description, category, etc.
    });
    const badRequestRes = await router.dispatch(badRequestEvent);
    expect(badRequestRes.statusCode).toBe(400);
    expect((badRequestRes as any).headers['Content-Type']).toBe('application/json');
    expect((badRequestRes as any).headers['Access-Control-Allow-Origin']).toBeUndefined();
  });

  it('direct unit tests for createJsonResponse, createErrorResponse, and buildCorsHeaders', () => {
    // createJsonResponse provides Content-Type: application/json without CORS headers
    const jsonRes = createJsonResponse(200, { success: true });
    expect(jsonRes.statusCode).toBe(200);
    expect((jsonRes as any).headers['Content-Type']).toBe('application/json');
    expect((jsonRes as any).headers['Access-Control-Allow-Origin']).toBeUndefined();

    // createErrorResponse provides Content-Type: application/json without CORS headers
    const errRes = createErrorResponse(new BadRequestError('Invalid input parameter'));
    expect(errRes.statusCode).toBe(400);
    expect((errRes as any).headers['Content-Type']).toBe('application/json');
    expect((errRes as any).headers['Access-Control-Allow-Origin']).toBeUndefined();

    // buildCorsHeaders explicitly constructs full CORS headers for OPTIONS preflight
    const corsHeaders = buildCorsHeaders('https://campus-fix-ten-iota.vercel.app');
    expect(corsHeaders['Access-Control-Allow-Origin']).toBe('https://campus-fix-ten-iota.vercel.app');
    expect(corsHeaders['Access-Control-Allow-Methods']).toContain('GET, POST, PATCH, OPTIONS');
    expect(corsHeaders['Access-Control-Allow-Headers']).toContain('Authorization, Content-Type');
  });

  it('serves unauthenticated health check', async () => {
    const event = createEvent({ method: 'GET', path: '/health' });
    const res = await router.dispatch(event);

    expect(res.statusCode).toBe(200);
    const body = JSON.parse((res as any).body);
    expect(body.status).toBe('HEALTHY');
  });

  it('rejects unauthenticated requests to protected endpoints with 401', async () => {
    const event = createEvent({ method: 'GET', path: '/complaints/my' });
    const res = await router.dispatch(event);

    expect(res.statusCode).toBe(401);
    const body = JSON.parse((res as any).body);
    expect(body.error).toBe('UnauthorizedError');
  });

  it('POST /complaints creates complaint and enforces verified Cognito identity against forgery', async () => {
    const forgedPayload = {
      title: 'Lab 4 Microscope light failure',
      description: 'The halogen light bulb on station 3 has burnt out during practical session.',
      location: 'Science Building, Lab 4',
      category: 'Laboratory Equipment',
      priority: 'Medium',
      department: 'Campus Maintenance',
      // Attacker attempts to spoof student identity & status in body:
      studentId: 'victim-sub-999',
      studentEmail: 'victim@campus.edu',
      role: 'admin',
      status: 'Resolved'
    };

    const event = createEvent({
      method: 'POST',
      path: '/complaints',
      token: 'student_token_1',
      body: forgedPayload
    });

    const res = await router.dispatch(event);
    expect(res.statusCode).toBe(201);

    const created = JSON.parse((res as any).body);
    expect(created.complaintId).toMatch(/^CMP-\d+-[A-Z0-9]+$/);
    expect(created.status).toBe('Submitted'); // Attacker spoofing 'Resolved' was rejected

    // Confirms student identity was strictly derived from token claims, NOT body
    expect(created.studentId).toBe('student-sub-001');
    expect(created.studentEmail).toBe('student1@campus.edu');
    expect(created.studentName).toBe('Student One');

    // Confirms statusHistory actor is student-sub-001 with role 'student'
    expect(created.statusHistory).toHaveLength(1);
    expect(created.statusHistory[0].actor.id).toBe('student-sub-001');
    expect(created.statusHistory[0].actor.role).toBe('student');
  });

  it('GET /complaints/my returns only the complaints belonging to caller sub', async () => {
    // 1. Create a ticket for Student 1
    await router.dispatch(
      createEvent({
        method: 'POST',
        path: '/complaints',
        token: 'student_token_1',
        body: {
          title: 'Student 1 Air conditioner noisy',
          description: 'Rattling noise in library study room 204.',
          location: 'Library 2nd Floor',
          category: 'Classroom Facilities',
          priority: 'Low'
        }
      })
    );

    // 2. Create a ticket for Student 2
    await router.dispatch(
      createEvent({
        method: 'POST',
        path: '/complaints',
        token: 'student_token_2',
        body: {
          title: 'Student 2 Projector broken',
          description: 'Projector turns off after 5 minutes of operation.',
          location: 'Seminar Room 1',
          category: 'Classroom Facilities',
          priority: 'Medium'
        }
      })
    );

    // 3. Student 1 queries /complaints/my
    const res1 = await router.dispatch(
      createEvent({
        method: 'GET',
        path: '/complaints/my',
        token: 'student_token_1'
      })
    );
    expect(res1.statusCode).toBe(200);
    const body1 = JSON.parse((res1 as any).body);
    expect(body1.complaints).toHaveLength(1);
    expect(body1.complaints[0].studentId).toBe('student-sub-001');
    expect(body1.complaints[0].title).toBe('Student 1 Air conditioner noisy');

    // 4. Student 2 queries /complaints/my
    const res2 = await router.dispatch(
      createEvent({
        method: 'GET',
        path: '/complaints/my',
        token: 'student_token_2'
      })
    );
    expect(res2.statusCode).toBe(200);
    const body2 = JSON.parse((res2 as any).body);
    expect(body2.complaints).toHaveLength(1);
    expect(body2.complaints[0].studentId).toBe('student-sub-002');
  });

  it('enforces Student Data Isolation on GET /complaints/:id (403 for other students)', async () => {
    // Create complaint as Student 1
    const createRes = await router.dispatch(
      createEvent({
        method: 'POST',
        path: '/complaints',
        token: 'student_token_1',
        body: {
          title: 'Confidential grade query or private issue',
          description: 'Personal issue requiring discreet attention from administration.',
          location: 'Main Office',
          category: 'Administration',
          priority: 'High'
        }
      })
    );
    const created = JSON.parse((createRes as any).body);
    const id = created.complaintId;

    // Student 1 (owner) can view their ticket:
    const ownerRes = await router.dispatch(
      createEvent({ method: 'GET', path: `/complaints/${id}`, token: 'student_token_1' })
    );
    expect(ownerRes.statusCode).toBe(200);

    // Student 2 attempts to view Student 1's ticket -> MUST be 403 Forbidden!
    const intruderRes = await router.dispatch(
      createEvent({ method: 'GET', path: `/complaints/${id}`, token: 'student_token_2' })
    );
    expect(intruderRes.statusCode).toBe(403);
    const intruderBody = JSON.parse((intruderRes as any).body);
    expect(intruderBody.error).toBe('ForbiddenError');
    expect(intruderBody.message).toContain('You do not have permission to view another student\'s complaint');

    // Administrator CAN view Student 1's ticket:
    const adminRes = await router.dispatch(
      createEvent({ method: 'GET', path: `/complaints/${id}`, token: 'admin_token' })
    );
    expect(adminRes.statusCode).toBe(200);
  });

  it('GET /complaints/all rejects students with 403 and permits administrators', async () => {
    // Student tries to view all complaints:
    const studentRes = await router.dispatch(
      createEvent({ method: 'GET', path: '/complaints/all', token: 'student_token_1' })
    );
    expect(studentRes.statusCode).toBe(403);

    // Admin views all complaints:
    const adminRes = await router.dispatch(
      createEvent({ method: 'GET', path: '/complaints/all', token: 'admin_token' })
    );
    expect(adminRes.statusCode).toBe(200);
    const body = JSON.parse((adminRes as any).body);
    expect(Array.isArray(body.complaints)).toBe(true);
  });

  it('PATCH /complaints/:id/status rejects students with 403 and applies admin status updates', async () => {
    // 1. Create a ticket
    const createRes = await router.dispatch(
      createEvent({
        method: 'POST',
        path: '/complaints',
        token: 'student_token_1',
        body: {
          title: 'Damaged Ethernet port in library room',
          description: 'RJ45 socket has snapped and will not hold network cable.',
          location: 'Library Desk 12',
          category: 'IT and Wi-Fi',
          priority: 'Medium'
        }
      })
    );
    const id = JSON.parse((createRes as any).body).complaintId;

    // 2. Student attempts status update -> 403 Forbidden
    const studentAttempt = await router.dispatch(
      createEvent({
        method: 'PATCH',
        path: `/complaints/${id}/status`,
        token: 'student_token_1',
        body: { newStatus: 'Resolved' }
      })
    );
    expect(studentAttempt.statusCode).toBe(403);

    // 3. Admin attempts invalid transition (Submitted -> Resolved directly is illegal without In Progress / Assigned)
    const invalidTrans = await router.dispatch(
      createEvent({
        method: 'PATCH',
        path: `/complaints/${id}/status`,
        token: 'admin_token',
        body: { newStatus: 'Resolved' }
      })
    );
    expect(invalidTrans.statusCode).toBe(400);

    // 4. Admin performs valid transition: Submitted -> In Progress
    const validTrans = await router.dispatch(
      createEvent({
        method: 'PATCH',
        path: `/complaints/${id}/status`,
        token: 'admin_token',
        body: {
          newStatus: 'In Progress',
          remark: 'Network engineer dispatched.'
        }
      })
    );
    expect(validTrans.statusCode).toBe(200);
    const updated = JSON.parse((validTrans as any).body);
    expect(updated.status).toBe('In Progress');
    expect(updated.adminRemarks).toBe('Network engineer dispatched.');
    expect(updated.statusHistory).toHaveLength(2);
    expect(updated.statusHistory[1].newStatus).toBe('In Progress');
    expect(updated.statusHistory[1].actor.role).toBe('admin');
  });

  it('PATCH /complaints/:id/assign assigns department and transitions Submitted to Assigned', async () => {
    // 1. Create a ticket
    const createRes = await router.dispatch(
      createEvent({
        method: 'POST',
        path: '/complaints',
        token: 'student_token_1',
        body: {
          title: 'Flickering fluorescent tube in chemistry lab',
          description: 'The tube light flashes intermittently making experiments difficult.',
          location: 'Chemistry Lab B',
          category: 'Electrical Maintenance',
          priority: 'Low'
        }
      })
    );
    const id = JSON.parse((createRes as any).body).complaintId;

    // 2. Admin assigns department
    const assignRes = await router.dispatch(
      createEvent({
        method: 'PATCH',
        path: `/complaints/${id}/assign`,
        token: 'admin_token',
        body: {
          department: 'Electrical Works',
          assignedTo: 'Vikram Singh',
          remark: 'Dispatched electrician with replacement ballast.'
        }
      })
    );
    expect(assignRes.statusCode).toBe(200);

    const updated = JSON.parse((assignRes as any).body);
    expect(updated.department).toBe('Electrical Works');
    expect(updated.assignedTo).toBe('Vikram Singh');
    expect(updated.status).toBe('Assigned'); // Automatically transitioned from Submitted to Assigned
    expect(updated.statusHistory).toHaveLength(2);
    expect(updated.statusHistory[1].newStatus).toBe('Assigned');
  });

  it('PATCH /complaints/:id/assign strictly rejects students with 403 Forbidden', async () => {
    // 1. Create a ticket
    const createRes = await router.dispatch(
      createEvent({
        method: 'POST',
        path: '/complaints',
        token: 'student_token_1',
        body: {
          title: 'Broken chair in lecture hall 3',
          description: 'The wooden backrest is split and presents a hazard for seated students.',
          location: 'Lecture Hall 3',
          category: 'Classroom Facilities',
          priority: 'Low'
        }
      })
    );
    const id = JSON.parse((createRes as any).body).complaintId;

    // 2. Student attempts assignment -> 403
    const assignRes = await router.dispatch(
      createEvent({
        method: 'PATCH',
        path: `/complaints/${id}/assign`,
        token: 'student_token_1',
        body: {
          department: 'Campus Maintenance',
          assignedTo: 'Unauthorized User'
        }
      })
    );
    expect(assignRes.statusCode).toBe(403);
    const body = JSON.parse((assignRes as any).body);
    expect(body.error).toBe('ForbiddenError');
  });

  it('sanitizes unexpected internal database errors without exposing stack traces', async () => {
    // Force database failure by breaking docClient
    mockClient.send = async () => {
      throw new Error('FATAL DynamoDB internal connection reset at 10.0.0.12:443 [Stack trace: at Socket.connect]');
    };

    const res = await router.dispatch(
      createEvent({
        method: 'GET',
        path: '/complaints/my',
        token: 'student_token_1'
      })
    );

    expect(res.statusCode).toBe(500);
    const body = JSON.parse((res as any).body);
    expect(body.error).toBe('InternalServerError');
    expect(body.message).toBe('An unexpected internal server error occurred.');
    // Must NOT contain internal IP, stack trace or DB details
    expect(JSON.stringify(body)).not.toContain('FATAL DynamoDB');
    expect(JSON.stringify(body)).not.toContain('10.0.0.12');
  });

  describe('Transactional Email Notification Integration & Fault Tolerance', () => {
    it('notifies administrators upon successful POST /complaints', async () => {
      const res = await router.dispatch(
        createEvent({
          method: 'POST',
          path: '/complaints',
          token: 'student_token_1',
          body: {
            title: 'Projector ceiling bracket loose',
            description: 'Ceiling mount bracket for projector in Room 102 is vibrating loose.',
            location: 'Room 102',
            category: 'Classroom Facilities',
            priority: 'High'
          }
        })
      );

      expect(res.statusCode).toBe(201);
      const created = JSON.parse((res as any).body);
      expect(mockNotificationService.notifyAdminNewComplaint).toHaveBeenCalledTimes(1);
      expect(mockNotificationService.notifyAdminNewComplaint).toHaveBeenCalledWith(
        expect.objectContaining({
          complaintId: created.complaintId,
          title: 'Projector ceiling bracket loose',
          studentEmail: 'student1@campus.edu'
        })
      );
    });

    it('treats admin notification errors on POST /complaints as non-fatal', async () => {
      // Notification service throws or rejects (e.g. SES Sandbox issue or network error)
      mockNotificationService.notifyAdminNewComplaint = vi.fn().mockRejectedValue(
        new Error('SES Sandbox Error: Recipient address is not verified.')
      );

      const res = await router.dispatch(
        createEvent({
          method: 'POST',
          path: '/complaints',
          token: 'student_token_1',
          body: {
            title: 'Water cooler leaking',
            description: 'Water cooler near staff room is leaking continuously on the floor.',
            location: 'Staff Room corridor',
            category: 'Sanitation',
            priority: 'Medium'
          }
        })
      );

      // Must still succeed with 201 Created and return the created complaint
      expect(res.statusCode).toBe(201);
      const created = JSON.parse((res as any).body);
      expect(created.status).toBe('Submitted');
      expect(mockNotificationService.notifyAdminNewComplaint).toHaveBeenCalledTimes(1);
    });

    it('notifies student upon PATCH /complaints/:id/status using trusted studentEmail from DynamoDB', async () => {
      // 1. Create complaint as Student 1 (studentEmail: student1@campus.edu)
      const createRes = await router.dispatch(
        createEvent({
          method: 'POST',
          path: '/complaints',
          token: 'student_token_1',
          body: {
            title: 'Broken window latch in physics lab',
            description: 'Window latch is broken causing window to bang against frame in wind.',
            location: 'Physics Lab',
            category: 'Classroom Facilities',
            priority: 'Medium'
          }
        })
      );
      const complaintId = JSON.parse((createRes as any).body).complaintId;

      // 2. Admin updates status
      const updateRes = await router.dispatch(
        createEvent({
          method: 'PATCH',
          path: `/complaints/${complaintId}/status`,
          token: 'admin_token',
          body: {
            newStatus: 'In Progress',
            remark: 'Carpenter assigned for repairs.'
          }
        })
      );

      expect(updateRes.statusCode).toBe(200);
      expect(mockNotificationService.notifyStudentStatusUpdated).toHaveBeenCalledTimes(1);
      expect(mockNotificationService.notifyStudentStatusUpdated).toHaveBeenCalledWith(
        expect.objectContaining({
          complaintId,
          studentEmail: 'student1@campus.edu'
        }),
        'Submitted',
        'In Progress',
        'Carpenter assigned for repairs.'
      );
    });

    it('treats student status notification errors as non-fatal on PATCH /status', async () => {
      const createRes = await router.dispatch(
        createEvent({
          method: 'POST',
          path: '/complaints',
          token: 'student_token_1',
          body: {
            title: 'Laboratory gas valve leaking smell',
            description: 'Slight gas odor detected near station 4 gas shutoff valve.',
            location: 'Chemistry Lab',
            category: 'Laboratory Equipment',
            priority: 'Critical'
          }
        })
      );
      const complaintId = JSON.parse((createRes as any).body).complaintId;

      mockNotificationService.notifyStudentStatusUpdated = vi.fn().mockRejectedValue(
        new Error('SES Connection Timeout')
      );

      const updateRes = await router.dispatch(
        createEvent({
          method: 'PATCH',
          path: `/complaints/${complaintId}/status`,
          token: 'admin_token',
          body: {
            newStatus: 'In Progress',
            remark: 'Safety officer on scene.'
          }
        })
      );

      expect(updateRes.statusCode).toBe(200);
      const updated = JSON.parse((updateRes as any).body);
      expect(updated.status).toBe('In Progress');
    });

    it('notifies student upon PATCH /complaints/:id/assign', async () => {
      const createRes = await router.dispatch(
        createEvent({
          method: 'POST',
          path: '/complaints',
          token: 'student_token_1',
          body: {
            title: 'Overhead light fixture hum',
            description: 'Buzzing ballast in overhead tube light in Room 304.',
            location: 'Room 304',
            category: 'Electrical Maintenance',
            priority: 'Low'
          }
        })
      );
      const complaintId = JSON.parse((createRes as any).body).complaintId;

      const assignRes = await router.dispatch(
        createEvent({
          method: 'PATCH',
          path: `/complaints/${complaintId}/assign`,
          token: 'admin_token',
          body: {
            department: 'Electrical Works',
            assignedTo: 'Anil Mehta',
            remark: 'Electrician dispatched.'
          }
        })
      );

      expect(assignRes.statusCode).toBe(200);
      expect(mockNotificationService.notifyStudentAssigned).toHaveBeenCalledTimes(1);
      expect(mockNotificationService.notifyStudentAssigned).toHaveBeenCalledWith(
        expect.objectContaining({
          complaintId,
          studentEmail: 'student1@campus.edu'
        }),
        'Electrical Works',
        'Anil Mehta',
        'Electrician dispatched.'
      );
    });
  });
});
