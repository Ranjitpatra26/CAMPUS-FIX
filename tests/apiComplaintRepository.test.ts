import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { ApiComplaintRepository } from '../src/services/complaints/apiComplaintRepository';
import { CompositeComplaintRepository } from '../src/services/complaints/compositeRepository';
import { authService } from '../src/services/auth/authService';
import { CreateComplaintInput, User } from '../src/types';

describe('ApiComplaintRepository & DynamoDB Integration', () => {
  const dummyUser: User = {
    id: 'sub-student-alex-99',
    name: 'Alex Chen',
    email: 'alex.chen@campus.edu',
    role: 'student',
    studentId: 'CS-2026-101',
    department: 'Computer Science'
  };

  const validComplaintInput: CreateComplaintInput = {
    title: 'Broken air conditioning in Seminar Hall 2',
    category: 'Electrical Maintenance',
    priority: 'High',
    location: 'Engineering Block 3, Room 204',
    department: 'Electrical Works',
    description: 'The main compressor unit in Seminar Hall 2 has stopped functioning and is emitting a burning odor.'
  };

  const testApiUrl = 'https://ipsptjyvvdr7qovskjlrcof2hq0moqvl.lambda-url.ap-southeast-2.on.aws';

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('sends POST /complaints with Bearer ID token and correct payload to Lambda Function URL', async () => {
    // 1. Mock Cognito ID token
    vi.spyOn(authService, 'getIdToken').mockResolvedValue('valid.cognito.id_token.xyz');

    // 2. Mock fetch response from Lambda
    const mockCreated = {
      complaintId: 'CMP-123456-ABCD',
      entityType: 'COMPLAINT',
      title: validComplaintInput.title,
      description: validComplaintInput.description,
      location: validComplaintInput.location,
      category: validComplaintInput.category,
      priority: validComplaintInput.priority,
      department: validComplaintInput.department,
      status: 'Submitted',
      studentId: dummyUser.id,
      studentName: dummyUser.name,
      studentEmail: dummyUser.email,
      studentDepartment: dummyUser.department,
      createdAt: '2026-10-23T12:00:00.000Z',
      updatedAt: '2026-10-23T12:00:00.000Z',
      statusHistory: []
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => mockCreated
    } as Response);

    const repo = new ApiComplaintRepository(testApiUrl);
    const result = await repo.createComplaint(validComplaintInput, dummyUser);

    // Verify fetch call URL and method
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [callUrl, callOptions] = fetchSpy.mock.calls[0];
    expect(callUrl).toBe(`${testApiUrl}/complaints`);
    expect(callOptions?.method).toBe('POST');

    // Verify Authorization: Bearer <id_token> header
    const headers = callOptions?.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer valid.cognito.id_token.xyz');
    expect(headers['Content-Type']).toBe('application/json');

    // Verify payload structure matches Lambda router expectation
    const parsedBody = JSON.parse(callOptions?.body as string);
    expect(parsedBody.title).toBe(validComplaintInput.title);
    expect(parsedBody.description).toBe(validComplaintInput.description);
    expect(parsedBody.location).toBe(validComplaintInput.location);
    expect(parsedBody.category).toBe(validComplaintInput.category);
    expect(parsedBody.priority).toBe(validComplaintInput.priority);
    expect(parsedBody.department).toBe(validComplaintInput.department);
    expect(parsedBody.studentDepartment).toBe(dummyUser.department);

    // Verify returned complaint normalizes complaintId to id
    expect(result.id).toBe('CMP-123456-ABCD');
    expect(result.status).toBe('Submitted');
  });

  it('throws an error and rejects submission when Cognito ID token is missing', async () => {
    vi.spyOn(authService, 'getIdToken').mockResolvedValue(null);

    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const repo = new ApiComplaintRepository(testApiUrl);

    await expect(repo.createComplaint(validComplaintInput, dummyUser)).rejects.toThrow(
      /Missing Cognito ID token/
    );

    // Request must NOT be dispatched without credentials
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('never reports success when DynamoDB backend write fails (e.g. HTTP 500)', async () => {
    vi.spyOn(authService, 'getIdToken').mockResolvedValue('valid.cognito.id_token.xyz');

    // Simulate DynamoDB write failure returned by Lambda
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({
        error: 'InternalServerError',
        message: 'DynamoDB Service Unavailable: ProvisionedThroughputExceededException',
        statusCode: 500
      })
    } as Response);

    const repo = new ApiComplaintRepository(testApiUrl);

    await expect(repo.createComplaint(validComplaintInput, dummyUser)).rejects.toThrow(
      /DynamoDB save failed: DynamoDB Service Unavailable/
    );
  });

  it('correctly retrieves student complaints via GET /complaints/my with Bearer header', async () => {
    vi.spyOn(authService, 'getIdToken').mockResolvedValue('valid.cognito.id_token.xyz');

    const mockItems = [
      {
        complaintId: 'CMP-STUDENT-001',
        title: 'Network outage in Block A',
        status: 'In Progress',
        createdAt: '2026-10-23T10:00:00.000Z'
      }
    ];

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        complaints: mockItems
      })
    } as Response);

    const repo = new ApiComplaintRepository(testApiUrl);
    const complaints = await repo.getMyComplaints(dummyUser.id);

    expect(fetchSpy).toHaveBeenCalledWith(
      `${testApiUrl}/complaints/my?limit=100`,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer valid.cognito.id_token.xyz'
        })
      })
    );

    expect(complaints).toHaveLength(1);
    expect(complaints[0].id).toBe('CMP-STUDENT-001');
    expect(complaints[0].title).toBe('Network outage in Block A');
  });

  it('correctly retrieves all complaints for administrator via GET /complaints/all', async () => {
    vi.spyOn(authService, 'getIdToken').mockResolvedValue('valid.admin.id_token.xyz');

    const mockAll = [
      { complaintId: 'CMP-ADMIN-001', title: 'Power surge in library', status: 'Assigned', createdAt: '2026-10-23T08:00:00.000Z' },
      { complaintId: 'CMP-ADMIN-002', title: 'Broken tap in washroom', status: 'Submitted', createdAt: '2026-10-23T09:00:00.000Z' }
    ];

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        complaints: mockAll
      })
    } as Response);

    const repo = new ApiComplaintRepository(testApiUrl);
    const complaints = await repo.getAllComplaints();

    expect(fetchSpy).toHaveBeenCalledWith(
      `${testApiUrl}/complaints/all?limit=100`,
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer valid.admin.id_token.xyz'
        })
      })
    );

    expect(complaints).toHaveLength(2);
    expect(complaints[0].id).toBe('CMP-ADMIN-001');
    expect(complaints[1].id).toBe('CMP-ADMIN-002');
  });

  it('CompositeComplaintRepository routes to ApiComplaintRepository when mock is disabled and does NOT fall back to localStorage on failure', async () => {
    vi.spyOn(authService, 'getIdToken').mockResolvedValue('valid.id_token.xyz');

    // Simulate backend rejection
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: 'BadRequestError',
        message: 'Complaint title must be between 5 and 120 characters.',
        statusCode: 400
      })
    } as Response);

    const composite = new CompositeComplaintRepository({
      mockEnabled: false,
      apiBaseUrl: testApiUrl
    });

    expect(composite.isMockEnabled()).toBe(false);

    // Must throw the API error directly and NOT silently write to localStorage
    await expect(composite.createComplaint(validComplaintInput, dummyUser)).rejects.toThrow(
      /Complaint title must be between 5 and 120 characters/
    );

    // Verify local storage was NOT modified with the failed complaint
    const localComplaints = composite.getLocalRepo()['loadComplaints']();
    const foundInLocal = localComplaints.find(c => c.title === validComplaintInput.title);
    expect(foundInLocal).toBeUndefined();
  });

  it('routes through /api dev proxy when running in browser on localhost', () => {
    (globalThis as any).window = {
      location: { hostname: 'localhost' }
    };

    try {
      const repo = new ApiComplaintRepository();
      expect(repo.getBaseUrl()).toBe('/api');
    } finally {
      delete (globalThis as any).window;
    }
  });

  it('throws an explicit Access Denied (403 Forbidden) error when non-admin accesses GET /complaints/all', async () => {
    vi.spyOn(authService, 'getIdToken').mockResolvedValue('valid.student.id_token.xyz');

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        error: 'ForbiddenError',
        message: 'Administrative access required. User is not a member of the "Administrators" group.',
        statusCode: 403
      })
    } as Response);

    const repo = new ApiComplaintRepository(testApiUrl);

    await expect(repo.getAllComplaints()).rejects.toThrow(
      /Access Denied \(403 Forbidden\): Administrative access required/
    );
  });

  it('strictly separates student and admin endpoints: students call /complaints/my and admins call /complaints/all', async () => {
    vi.spyOn(authService, 'getIdToken').mockResolvedValue('valid.token.xyz');

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ complaints: [] })
    } as Response);

    const repo = new ApiComplaintRepository(testApiUrl);

    // Student ticket listing
    await repo.getMyComplaints('sub-student-123');
    expect(fetchSpy).toHaveBeenLastCalledWith(
      `${testApiUrl}/complaints/my?limit=100`,
      expect.objectContaining({ method: 'GET' })
    );

    // Admin central repository listing
    await repo.getAllComplaints();
    expect(fetchSpy).toHaveBeenLastCalledWith(
      `${testApiUrl}/complaints/all?limit=100`,
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('guarantees LandingPage does not import complaintRepository or request admin complaints', async () => {
    const fs = await import('fs');
    const landingContent = fs.readFileSync('src/pages/public/LandingPage.tsx', 'utf-8');
    expect(landingContent).not.toContain('complaintRepository');
    expect(landingContent).not.toContain('/complaints/all');
  });

  it('surfaces 403 Forbidden when unauthorized user calls updateComplaintStatus or assignComplaint', async () => {
    vi.spyOn(authService, 'getIdToken').mockResolvedValue('student.jwt');

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        error: 'ForbiddenError',
        message: 'Administrative access required.',
        statusCode: 403
      })
    } as Response);

    const repo = new ApiComplaintRepository(testApiUrl);

    await expect(
      repo.updateComplaintStatus('CMP-001', 'In Progress', dummyUser, 'Testing remark')
    ).rejects.toThrow(/Access Denied \(403 Forbidden\): Administrative access required/);

    await expect(
      repo.assignComplaint('CMP-001', 'Electrical Works', 'Technician A', dummyUser)
    ).rejects.toThrow(/Access Denied \(403 Forbidden\): Administrative access required/);
  });

  it('surfaces 403 Forbidden when a student attempts to view another student\'s ticket via getComplaintById', async () => {
    vi.spyOn(authService, 'getIdToken').mockResolvedValue('student.jwt');

    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({
        error: 'ForbiddenError',
        message: 'You do not have permission to view another student\'s complaint.',
        statusCode: 403
      })
    } as Response);

    const repo = new ApiComplaintRepository(testApiUrl);

    await expect(repo.getComplaintById('CMP-CONFIDENTIAL-001')).rejects.toThrow(
      /Access Denied \(403 Forbidden\): You do not have permission to view another student's complaint/
    );
  });

  describe('Phase 3: Pagination & Dedicated Analytics Endpoint Integration', () => {
    it('getAllComplaints retrieves all records across multiple pages using continuation tokens', async () => {
      vi.spyOn(authService, 'getIdToken').mockResolvedValue('admin.jwt');

      let callCount = 0;
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(async (url: any) => {
        callCount++;
        const urlStr = String(url);

        if (callCount === 1) {
          expect(urlStr).toContain('/complaints/all?limit=100');
          expect(urlStr).not.toContain('nextToken');
          return {
            ok: true,
            status: 200,
            json: async () => ({
              complaints: [
                { complaintId: 'CMP-P1-01', title: 'Issue 1', status: 'Submitted', category: 'IT and Wi-Fi', priority: 'High', createdAt: '2026-10-23T10:00:00Z' },
                { complaintId: 'CMP-P1-02', title: 'Issue 2', status: 'Assigned', category: 'Sanitation', priority: 'Medium', createdAt: '2026-10-23T10:05:00Z' }
              ],
              nextToken: 'token-for-page-2'
            })
          } as Response;
        }

        if (callCount === 2) {
          expect(urlStr).toContain('nextToken=token-for-page-2');
          return {
            ok: true,
            status: 200,
            json: async () => ({
              complaints: [
                { complaintId: 'CMP-P2-03', title: 'Issue 3', status: 'Resolved', category: 'Electrical Maintenance', priority: 'Low', createdAt: '2026-10-23T10:10:00Z' }
              ],
              nextToken: undefined
            })
          } as Response;
        }

        throw new Error('Unexpected extra call');
      });

      const repo = new ApiComplaintRepository(testApiUrl);
      const results = await repo.getAllComplaints();

      expect(fetchSpy).toHaveBeenCalledTimes(2);
      expect(results.length).toBe(3);
      expect(results[0].id).toBe('CMP-P1-01');
      expect(results[1].id).toBe('CMP-P1-02');
      expect(results[2].id).toBe('CMP-P2-03');
    });

    it('getAllComplaints handles empty intermediate pages cleanly', async () => {
      vi.spyOn(authService, 'getIdToken').mockResolvedValue('admin.jwt');

      let callCount = 0;
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        callCount++;
        if (callCount === 1) {
          return {
            ok: true,
            status: 200,
            json: async () => ({
              complaints: [], // Empty intermediate page from DynamoDB
              nextToken: 'token-page-2'
            })
          } as Response;
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({
            complaints: [
              { complaintId: 'CMP-PAGE-2', title: 'Found in page 2', status: 'Submitted', category: 'Other', priority: 'Low', createdAt: '2026-10-23T12:00:00Z' }
            ],
            nextToken: undefined
          })
        } as Response;
      });

      const repo = new ApiComplaintRepository(testApiUrl);
      const results = await repo.getAllComplaints();

      expect(results.length).toBe(1);
      expect(results[0].id).toBe('CMP-PAGE-2');
    });

    it('getAllComplaints prevents infinite pagination loops on cyclic tokens', async () => {
      vi.spyOn(authService, 'getIdToken').mockResolvedValue('admin.jwt');

      let callCount = 0;
      vi.spyOn(globalThis, 'fetch').mockImplementation(async () => {
        callCount++;
        return {
          ok: true,
          status: 200,
          json: async () => ({
            complaints: [{ complaintId: `CMP-LOOP-${callCount}`, title: 'Loop item', status: 'Submitted', category: 'Other', priority: 'Low', createdAt: '2026-10-23T12:00:00Z' }],
            nextToken: 'cyclic-token' // Always returns the same token
          })
        } as Response;
      });

      const repo = new ApiComplaintRepository(testApiUrl);
      const results = await repo.getAllComplaints();

      // First call saw 'cyclic-token', second call received 'cyclic-token' which is already visited -> terminates!
      expect(callCount).toBe(2);
      expect(results.length).toBe(2);
    });

    it('getAnalyticsComplaints queries /admin/analytics/summary and strips student PII', async () => {
      vi.spyOn(authService, 'getIdToken').mockResolvedValue('admin.jwt');

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          items: [
            {
              complaintId: 'CMP-ANL-01',
              title: 'Server Room Cooling Failure',
              status: 'Resolved',
              department: 'IT Services',
              category: 'IT and Wi-Fi',
              priority: 'Critical',
              createdAt: '2026-10-20T08:00:00Z',
              resolvedAt: '2026-10-20T10:30:00Z',
              assignedTo: 'Vikram Mehta',
              statusHistory: [
                { newStatus: 'Assigned', timestamp: '2026-10-20T08:30:00Z' },
                { newStatus: 'Resolved', timestamp: '2026-10-20T10:30:00Z' }
              ]
            }
          ],
          nextToken: undefined
        })
      } as Response);

      const repo = new ApiComplaintRepository(testApiUrl);
      const results = await repo.getAnalyticsComplaints();

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const [url] = fetchSpy.mock.calls[0];
      expect(String(url)).toContain('/admin/analytics/summary?limit=100');

      expect(results.length).toBe(1);
      const rec = results[0];
      expect(rec.id).toBe('CMP-ANL-01');
      expect(rec.department).toBe('IT Services');
      expect(rec.assignedTo).toBe('Vikram Mehta');
      expect(rec.resolvedAt).toBe('2026-10-20T10:30:00Z');

      // Privacy verification: student PII and description are omitted
      expect(rec.studentEmail).toBe('');
      expect(rec.studentId).toBe('');
      expect(rec.studentName).toBe('Anonymous Student');
      expect(rec.description).toBe('');
      expect(rec.location).toBe('');
    });

    it('getAnalyticsComplaints surfaces 403 Forbidden when called by unauthorized student', async () => {
      vi.spyOn(authService, 'getIdToken').mockResolvedValue('student.jwt');

      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({
          error: 'ForbiddenError',
          message: 'Administrator group membership required.',
          statusCode: 403
        })
      } as Response);

      const repo = new ApiComplaintRepository(testApiUrl);
      await expect(repo.getAnalyticsComplaints()).rejects.toThrow(
        /Access Denied \(403 Forbidden\): Administrator group membership required/
      );
    });
  });
});
