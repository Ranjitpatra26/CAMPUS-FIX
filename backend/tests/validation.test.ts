import { describe, it, expect } from 'vitest';
import {
  validateCreateComplaintInput,
  validateUpdateStatusInput,
  validateAssignComplaintInput,
  isValidStatusTransition
} from '../src/validation.js';

describe('Backend Request Validation & Status Transition Matrix', () => {
  describe('validateCreateComplaintInput', () => {
    const validPayload = {
      title: 'Water cooler leaking in Academic Block 2',
      description: 'Continuous dripping has created a puddle across the main corridor.',
      location: 'Block 2, Level 1',
      category: 'Sanitation',
      priority: 'High',
      department: 'Campus Maintenance'
    };

    it('accepts well-formed complaint input', () => {
      const validated = validateCreateComplaintInput(validPayload);
      expect(validated.title).toBe(validPayload.title);
      expect(validated.category).toBe('Sanitation');
      expect(validated.priority).toBe('High');
      expect(validated.department).toBe('Campus Maintenance');
    });

    it('rejects titles that are too short or too long', () => {
      expect(() =>
        validateCreateComplaintInput({ ...validPayload, title: 'Wtr' })
      ).toThrow(/Complaint title must be between 5 and 120 characters/);

      expect(() =>
        validateCreateComplaintInput({ ...validPayload, title: 'A'.repeat(121) })
      ).toThrow(/Complaint title must be between 5 and 120 characters/);
    });

    it('rejects descriptions that are too short', () => {
      expect(() =>
        validateCreateComplaintInput({ ...validPayload, description: 'Too brief text' })
      ).toThrow(/Complaint description must be between 20 and 1500 characters/);
    });

    it('rejects invalid complaint categories', () => {
      expect(() =>
        validateCreateComplaintInput({ ...validPayload, category: 'NonExistentCategory' })
      ).toThrow(/Invalid category "NonExistentCategory"/);
    });

    it('rejects invalid complaint priorities', () => {
      expect(() =>
        validateCreateComplaintInput({ ...validPayload, priority: 'SuperUrgent' })
      ).toThrow(/Invalid priority "SuperUrgent"/);
    });

    it('rejects invalid departments', () => {
      expect(() =>
        validateCreateComplaintInput({ ...validPayload, department: 'FakeDepartment' })
      ).toThrow(/Invalid department "FakeDepartment"/);
    });
  });

  describe('Status Transition Matrix (isValidStatusTransition)', () => {
    it('allows valid state progression: Submitted -> Assigned -> In Progress -> Resolved', () => {
      expect(isValidStatusTransition('Submitted', 'Assigned')).toBe(true);
      expect(isValidStatusTransition('Assigned', 'In Progress')).toBe(true);
      expect(isValidStatusTransition('In Progress', 'Resolved')).toBe(true);
    });

    it('allows direct progression: Submitted -> In Progress or Submitted -> Rejected', () => {
      expect(isValidStatusTransition('Submitted', 'In Progress')).toBe(true);
      expect(isValidStatusTransition('Submitted', 'Rejected')).toBe(true);
    });

    it('allows re-opening a Resolved complaint to In Progress', () => {
      expect(isValidStatusTransition('Resolved', 'In Progress')).toBe(true);
    });

    it('blocks invalid backward or arbitrary jumps', () => {
      // Resolved cannot directly jump back to Submitted or Assigned
      expect(isValidStatusTransition('Resolved', 'Submitted')).toBe(false);
      expect(isValidStatusTransition('Resolved', 'Assigned')).toBe(false);
      // Assigned cannot jump directly to Submitted
      expect(isValidStatusTransition('Assigned', 'Submitted')).toBe(false);
    });
  });

  describe('validateUpdateStatusInput', () => {
    it('requires explanation remark when rejecting a complaint', () => {
      expect(() =>
        validateUpdateStatusInput({ newStatus: 'Rejected' }, 'Submitted')
      ).toThrow(/Administrative rejection requires an explanation remark/);

      const validRejection = validateUpdateStatusInput(
        { newStatus: 'Rejected', remark: 'Duplicate issue already logged in CMP-1002.' },
        'Submitted'
      );
      expect(validRejection.newStatus).toBe('Rejected');
      expect(validRejection.remark).toBe('Duplicate issue already logged in CMP-1002.');
    });

    it('rejects illegal status transitions', () => {
      expect(() =>
        validateUpdateStatusInput({ newStatus: 'Submitted' }, 'Resolved')
      ).toThrow(/Invalid status transition/);
    });
  });

  describe('validateAssignComplaintInput', () => {
    it('accepts valid department and assignee name', () => {
      const valid = validateAssignComplaintInput({
        department: 'Electrical Works',
        assignedTo: 'Rajesh Kumar',
        remark: 'Assigned to chief electrician.'
      });
      expect(valid.department).toBe('Electrical Works');
      expect(valid.assignedTo).toBe('Rajesh Kumar');
    });

    it('rejects empty or missing assignee name', () => {
      expect(() =>
        validateAssignComplaintInput({ department: 'Electrical Works', assignedTo: ' ' })
      ).toThrow(/Field "assignedTo" must be a valid assignee name/);
    });

    it('rejects remarks longer than 1000 characters', () => {
      expect(() =>
        validateAssignComplaintInput({
          department: 'Electrical Works',
          assignedTo: 'Rajesh Kumar',
          remark: 'A'.repeat(1001)
        })
      ).toThrow(/Field "remark" must not exceed 1000 characters/);
    });
  });

  describe('Security boundary and payload size enforcement', () => {
    it('rejects studentDepartment exceeding 80 characters', () => {
      expect(() =>
        validateCreateComplaintInput({
          title: 'Valid Complaint Title',
          description: 'A detailed description that exceeds the 20 characters minimum requirement.',
          location: 'Building A, Room 101',
          category: 'Sanitation',
          priority: 'Medium',
          studentDepartment: 'X'.repeat(81)
        })
      ).toThrow(/Field "studentDepartment" must not exceed 80 characters/);
    });

    it('rejects status update remark exceeding 1000 characters', () => {
      expect(() =>
        validateUpdateStatusInput(
          { newStatus: 'In Progress', remark: 'R'.repeat(1001) },
          'Submitted'
        )
      ).toThrow(/Field "remark" must not exceed 1000 characters/);
    });
  });
});
