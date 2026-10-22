import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageComplaintRepository } from '../src/services/complaints/localStorageRepository';
import { isValidStatusTransition, ALLOWED_TRANSITIONS } from '../src/services/complaints/complaintRepository';
import { ComplaintStatus, User, CreateComplaintInput } from '../src/types';

// Mock in-memory localStorage for clean isolation
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

describe('Complaint Repository & Status Transition Matrix', () => {
  let repo: LocalStorageComplaintRepository;
  const mockStorage = new MockLocalStorage();

  const testStudent: User = {
    id: 'usr-test-student',
    name: 'Alice Cooper',
    email: 'alice@campus.edu',
    role: 'student',
    studentId: 'ST-999',
    department: 'Computer Science'
  };

  const testAdmin: User = {
    id: 'usr-test-admin',
    name: 'Dr. Administrator',
    email: 'admin@campus.edu',
    role: 'admin',
    department: 'Campus Operations'
  };

  beforeEach(() => {
    mockStorage.clear();
    // Stub global localStorage
    Object.defineProperty(globalThis, 'window', {
      value: { localStorage: mockStorage },
      writable: true
    });
    repo = new LocalStorageComplaintRepository();
  });

  describe('Status Transition Validation Rules', () => {
    it('allows valid transitions from Submitted', () => {
      expect(isValidStatusTransition('Submitted', 'Assigned')).toBe(true);
      expect(isValidStatusTransition('Submitted', 'In Progress')).toBe(true);
      expect(isValidStatusTransition('Submitted', 'Rejected')).toBe(true);
      expect(isValidStatusTransition('Submitted', 'Submitted')).toBe(true); // Self
    });

    it('rejects premature resolution directly from Submitted', () => {
      expect(isValidStatusTransition('Submitted', 'Resolved')).toBe(false);
    });

    it('allows valid transitions from Assigned', () => {
      expect(isValidStatusTransition('Assigned', 'In Progress')).toBe(true);
      expect(isValidStatusTransition('Assigned', 'Resolved')).toBe(true);
      expect(isValidStatusTransition('Assigned', 'Rejected')).toBe(true);
    });

    it('allows In Progress to transition to Resolved or Rejected', () => {
      expect(isValidStatusTransition('In Progress', 'Resolved')).toBe(true);
      expect(isValidStatusTransition('In Progress', 'Rejected')).toBe(true);
      expect(isValidStatusTransition('In Progress', 'Submitted')).toBe(false);
    });

    it('allows Resolved tickets to be reopened into In Progress if problem recurs', () => {
      expect(isValidStatusTransition('Resolved', 'In Progress')).toBe(true);
      expect(isValidStatusTransition('Resolved', 'Submitted')).toBe(false);
      expect(isValidStatusTransition('Resolved', 'Assigned')).toBe(false);
    });

    it('allows Rejected tickets to be reconsidered into Assigned or In Progress', () => {
      expect(isValidStatusTransition('Rejected', 'Assigned')).toBe(true);
      expect(isValidStatusTransition('Rejected', 'In Progress')).toBe(true);
      expect(isValidStatusTransition('Rejected', 'Resolved')).toBe(false);
    });
  });

  describe('Repository Operations & Lifecycle', () => {
    it('loads the initial 16 seeded complaints on first access', async () => {
      const all = await repo.getAllComplaints();
      expect(all.length).toBeGreaterThanOrEqual(16);
      expect(all[0]).toHaveProperty('id');
      expect(all[0]).toHaveProperty('statusHistory');
    });

    it('creates a new complaint with an auto-incrementing CMP-XXXX ticket ID', async () => {
      const input: CreateComplaintInput = {
        title: 'Projector bulb blown in Lecture Hall 3',
        category: 'Classroom Facilities',
        priority: 'High',
        location: 'Lecture Hall 3, Row F',
        description: 'Bulb burst with a loud pop during Physics lecture. Hall is dark.'
      };

      const created = await repo.createComplaint(input, testStudent);
      expect(created.id).toMatch(/^CMP-\d{4,}$/);
      expect(created.title).toBe(input.title);
      expect(created.status).toBe('Submitted');
      expect(created.studentId).toBe(testStudent.id);
      expect(created.statusHistory.length).toBe(1);
      expect(created.statusHistory[0].newStatus).toBe('Submitted');
      expect(created.statusHistory[0].actor.id).toBe(testStudent.id);

      // Verify retrieval
      const fetched = await repo.getComplaintById(created.id);
      expect(fetched).not.toBeNull();
      expect(fetched?.id).toBe(created.id);
    });

    it('enforces mandatory detailed explanation remark when rejecting a complaint', async () => {
      const all = await repo.getAllComplaints();
      const target = all.find(c => c.status === 'Submitted') || all[0];

      // Rejection with empty remark should throw
      await expect(
        repo.updateComplaintStatus(target.id, 'Rejected', testAdmin, '')
      ).rejects.toThrow(/Administrative rejection requires a detailed explanation remark/);

      await expect(
        repo.updateComplaintStatus(target.id, 'Rejected', testAdmin, '   ')
      ).rejects.toThrow(/Administrative rejection requires a detailed explanation remark/);

      // Rejection with valid remark should succeed
      const updated = await repo.updateComplaintStatus(
        target.id,
        'Rejected',
        testAdmin,
        'Duplicate request; work order WO-4401 is already addressing this circuit breaker.'
      );
      expect(updated.status).toBe('Rejected');
      expect(updated.adminRemarks).toContain('Duplicate request');
      expect(updated.statusHistory[updated.statusHistory.length - 1].newStatus).toBe('Rejected');
    });

    it('updates status and appends an auditable history entry', async () => {
      const input: CreateComplaintInput = {
        title: 'Water filter leaking near gym',
        category: 'Sanitation',
        priority: 'Medium',
        location: 'Sports Complex Floor 1',
        description: 'Continuous puddle forming around the drinking water cooler.'
      };

      const complaint = await repo.createComplaint(input, testStudent);
      expect(complaint.status).toBe('Submitted');

      // Admin assigns
      const assigned = await repo.assignComplaint(
        complaint.id,
        'Sanitation & Health',
        'Officer Dave',
        testAdmin,
        'Plumber dispatched'
      );
      expect(assigned.status).toBe('Assigned');
      expect(assigned.department).toBe('Sanitation & Health');
      expect(assigned.assignedTo).toBe('Officer Dave');

      // Admin moves to In Progress
      const inProgress = await repo.updateComplaintStatus(
        complaint.id,
        'In Progress',
        testAdmin,
        'Valve replacement in progress'
      );
      expect(inProgress.status).toBe('In Progress');

      // Admin resolves
      const resolved = await repo.updateComplaintStatus(
        complaint.id,
        'Resolved',
        testAdmin,
        'Gasket replaced and leak tested for 30 minutes.'
      );
      expect(resolved.status).toBe('Resolved');
      expect(resolved.resolvedAt).toBeDefined();
      expect(resolved.statusHistory.length).toBe(4); // Submitted, Assigned, In Progress, Resolved
    });

    it('calculates correct aggregate statistics', async () => {
      const stats = await repo.getStatistics();
      expect(stats.total).toBeGreaterThan(0);
      expect(stats.submitted + stats.assigned + stats.inProgress + stats.resolved + stats.rejected).toBe(stats.total);
    });

    it('gracefully handles malformed localStorage data without crashing', async () => {
      mockStorage.setItem('campusfix_mock_complaints_v1', 'CORRUPT_NOT_JSON{{{');
      const freshRepo = new LocalStorageComplaintRepository();
      const all = await freshRepo.getAllComplaints();
      expect(all.length).toBeGreaterThanOrEqual(16); // Falls back to INITIAL_COMPLAINTS
    });

    it('rejects status updates attempted by non-admin actors', async () => {
      await expect(
        repo.updateComplaintStatus('CMP-1001', 'Assigned', testStudent)
      ).rejects.toThrow(/Unauthorized: Only administrators can update complaint status/);
    });

    it('rejects department assignments attempted by non-admin actors', async () => {
      await expect(
        repo.assignComplaint('CMP-1001', 'IT Services', 'Officer Dave', testStudent)
      ).rejects.toThrow(/Unauthorized: Only administrators can assign departments/);
    });

    it('rejects administrative remarks attempted by non-admin actors', async () => {
      await expect(
        repo.addAdministratorRemark('CMP-1001', 'Unauthorized note', testStudent)
      ).rejects.toThrow(/Unauthorized: Only administrators can add administrative remarks/);
    });

    it('rejects complaint creation with invalid or out-of-bound inputs', async () => {
      await expect(
        repo.createComplaint({
          title: 'Bad',
          category: 'IT and Wi-Fi',
          priority: 'Low',
          location: 'Lab',
          description: 'This is a long enough description for the test to check title validation.'
        }, testStudent)
      ).rejects.toThrow(/Validation failed: Complaint title must be between 5 and 120 characters/);
    });
  });
});
