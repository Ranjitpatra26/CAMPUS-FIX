import { describe, it, expect } from 'vitest';
import {
  calculateAnalyticsSummary,
  getResolutionDurationHours,
  getTriageDurationHours,
  formatHours,
  formatPercentage
} from '../src/utils/analytics';
import { Complaint, DepartmentInfo } from '../src/types';

describe('Advanced Admin Analytics Utility (src/utils/analytics.ts)', () => {
  const baseComplaint: Complaint = {
    id: 'CMP-1001',
    title: 'Faulty projector in lecture hall',
    description: 'The projector turns off automatically after 5 minutes of usage.',
    category: 'Classroom Facilities',
    priority: 'Medium',
    status: 'Submitted',
    location: 'Building A, Room 101',
    department: 'Classroom Support',
    studentId: 'usr-student-1',
    studentName: 'Alice Student',
    studentEmail: 'alice@campus.edu',
    studentDepartment: 'Physics',
    createdAt: '2026-10-01T10:00:00.000Z',
    updatedAt: '2026-10-01T10:00:00.000Z',
    statusHistory: [
      {
        id: 'hist-1',
        previousStatus: null,
        newStatus: 'Submitted',
        timestamp: '2026-10-01T10:00:00.000Z',
        actor: { id: 'usr-student-1', name: 'Alice Student', role: 'student' }
      }
    ]
  };

  describe('1. Empty Dataset Handling', () => {
    it('returns clean zero and null values without NaN or Infinity when complaints array is empty', () => {
      const summary = calculateAnalyticsSummary([]);

      expect(summary.totalComplaints).toBe(0);
      expect(summary.overallResolutionRate).toBe(0);
      expect(summary.criticalCount).toBe(0);
      expect(summary.statusCounts).toEqual({
        Submitted: 0,
        Assigned: 0,
        'In Progress': 0,
        Resolved: 0,
        Rejected: 0
      });

      // Timing metrics must be null (unavailable), never NaN or 0
      expect(summary.averageResolutionHours).toBeNull();
      expect(summary.medianResolutionHours).toBeNull();
      expect(summary.averageTriageHours).toBeNull();

      expect(summary.departmentDistribution).toHaveLength(0);
      expect(summary.monthlyTrends).toHaveLength(0);
      expect(summary.staffWorkload).toHaveLength(0);

      // Department SLA health reflects configured departments with null compliance
      expect(summary.departmentSlaHealth.length).toBeGreaterThan(0);
      for (const dept of summary.departmentSlaHealth) {
        expect(dept.resolvedCount).toBe(0);
        expect(dept.complianceRate).toBeNull();
        expect(dept.averageResolutionHours).toBeNull();
      }
    });

    it('formats null and zero values appropriately in display helpers', () => {
      expect(formatHours(null)).toBe('N/A');
      expect(formatHours(undefined)).toBe('N/A');
      expect(formatHours(0)).toBe('0.0 hrs');
      expect(formatHours(0.5)).toBe('30m');
      expect(formatHours(2.456)).toBe('2.5 hrs');

      expect(formatPercentage(null)).toBe('N/A');
      expect(formatPercentage(undefined)).toBe('N/A');
      expect(formatPercentage(0)).toBe('0%');
      expect(formatPercentage(94.2)).toBe('94%');
    });
  });

  describe('2. Resolution Duration & Timestamp Validation', () => {
    it('calculates duration in hours using resolvedAt when valid', () => {
      const resolved: Complaint = {
        ...baseComplaint,
        status: 'Resolved',
        createdAt: '2026-10-01T10:00:00.000Z',
        resolvedAt: '2026-10-01T14:30:00.000Z' // 4.5 hours later
      };

      const duration = getResolutionDurationHours(resolved);
      expect(duration).toBeCloseTo(4.5, 2);
    });

    it('falls back to statusHistory timestamp if resolvedAt is missing', () => {
      const resolvedWithoutField: Complaint = {
        ...baseComplaint,
        status: 'Resolved',
        createdAt: '2026-10-01T10:00:00.000Z',
        resolvedAt: undefined,
        statusHistory: [
          ...baseComplaint.statusHistory,
          {
            id: 'hist-res',
            previousStatus: 'In Progress',
            newStatus: 'Resolved',
            timestamp: '2026-10-02T16:00:00.000Z', // 30 hours later
            actor: { id: 'admin-1', name: 'Admin', role: 'admin' }
          }
        ]
      };

      const duration = getResolutionDurationHours(resolvedWithoutField);
      expect(duration).toBeCloseTo(30, 2);
    });

    it('returns null and does not count unresolved complaints as resolved', () => {
      const openComplaint: Complaint = {
        ...baseComplaint,
        status: 'In Progress',
        resolvedAt: '2026-10-01T12:00:00.000Z' // Even if resolvedAt is accidentally present
      };

      expect(getResolutionDurationHours(openComplaint)).toBeNull();
    });

    it('rejects invalid or negative time intervals (e.g. clock drift / corrupt data)', () => {
      const negativeTime: Complaint = {
        ...baseComplaint,
        status: 'Resolved',
        createdAt: '2026-10-05T12:00:00.000Z',
        resolvedAt: '2026-10-04T12:00:00.000Z' // 1 day BEFORE creation
      };

      expect(getResolutionDurationHours(negativeTime)).toBeNull();

      const corruptDate: Complaint = {
        ...baseComplaint,
        status: 'Resolved',
        createdAt: 'invalid-date',
        resolvedAt: '2026-10-05T12:00:00.000Z'
      };

      expect(getResolutionDurationHours(corruptDate)).toBeNull();
    });

    it('calculates mean and median resolution times accurately', () => {
      const c1: Complaint = {
        ...baseComplaint,
        id: 'c1',
        status: 'Resolved',
        createdAt: '2026-10-01T10:00:00.000Z',
        resolvedAt: '2026-10-01T12:00:00.000Z' // 2 hrs
      };
      const c2: Complaint = {
        ...baseComplaint,
        id: 'c2',
        status: 'Resolved',
        createdAt: '2026-10-01T10:00:00.000Z',
        resolvedAt: '2026-10-01T16:00:00.000Z' // 6 hrs
      };
      const c3: Complaint = {
        ...baseComplaint,
        id: 'c3',
        status: 'Resolved',
        createdAt: '2026-10-01T10:00:00.000Z',
        resolvedAt: '2026-10-01T20:00:00.000Z' // 10 hrs
      };

      const summary = calculateAnalyticsSummary([c1, c2, c3]);
      // Mean: (2 + 6 + 10) / 3 = 6.0
      expect(summary.averageResolutionHours).toBe(6.0);
      // Median: 6.0
      expect(summary.medianResolutionHours).toBe(6.0);
    });
  });

  describe('3. Triage Time Calculations', () => {
    it('calculates average triage time using the first assignment timestamp in status history', () => {
      const c1: Complaint = {
        ...baseComplaint,
        id: 'c1',
        createdAt: '2026-10-01T08:00:00.000Z',
        statusHistory: [
          ...baseComplaint.statusHistory,
          {
            id: 'hist-assign-1',
            previousStatus: 'Submitted',
            newStatus: 'Assigned',
            timestamp: '2026-10-01T10:00:00.000Z', // 2 hours later
            actor: { id: 'admin-1', name: 'Admin', role: 'admin' }
          }
        ]
      };

      const c2: Complaint = {
        ...baseComplaint,
        id: 'c2',
        createdAt: '2026-10-01T08:00:00.000Z',
        statusHistory: [
          ...baseComplaint.statusHistory,
          {
            id: 'hist-assign-2',
            previousStatus: 'Submitted',
            newStatus: 'Assigned',
            timestamp: '2026-10-01T14:00:00.000Z', // 6 hours later
            actor: { id: 'admin-1', name: 'Admin', role: 'admin' }
          }
        ]
      };

      const summary = calculateAnalyticsSummary([c1, c2]);
      // Average triage: (2 + 6) / 2 = 4.0 hrs
      expect(summary.averageTriageHours).toBe(4.0);
    });

    it('returns null for triage time if no assignment history entries exist', () => {
      const unassigned: Complaint = {
        ...baseComplaint,
        status: 'Submitted'
      };

      const summary = calculateAnalyticsSummary([unassigned]);
      expect(summary.averageTriageHours).toBeNull();
    });

    it('ignores invalid or negative triage intervals', () => {
      const corruptTriage: Complaint = {
        ...baseComplaint,
        createdAt: '2026-10-01T12:00:00.000Z',
        statusHistory: [
          {
            id: 'h1',
            previousStatus: 'Submitted',
            newStatus: 'Assigned',
            timestamp: '2026-10-01T10:00:00.000Z', // 2 hours before creation
            actor: { id: 'a', name: 'Admin', role: 'admin' }
          }
        ]
      };

      expect(getTriageDurationHours(corruptTriage)).toBeNull();
    });
  });

  describe('4. Department-Wise Grouping & Unassigned Handling', () => {
    it('accurately aggregates complaints across departments and includes unassigned items', () => {
      const c1: Complaint = {
        ...baseComplaint,
        id: 'c1',
        department: 'Electrical Works',
        status: 'Resolved',
        createdAt: '2026-10-01T10:00:00.000Z',
        resolvedAt: '2026-10-01T16:00:00.000Z'
      };
      const c2: Complaint = {
        ...baseComplaint,
        id: 'c2',
        department: 'Electrical Works',
        status: 'In Progress'
      };
      const c3: Complaint = {
        ...baseComplaint,
        id: 'c3',
        department: undefined, // Unassigned department
        status: 'Submitted'
      };

      const summary = calculateAnalyticsSummary([c1, c2, c3]);

      expect(summary.departmentDistribution).toHaveLength(2);

      const elec = summary.departmentDistribution.find(d => d.department === 'Electrical Works');
      expect(elec).toBeDefined();
      expect(elec?.total).toBe(2);
      expect(elec?.resolved).toBe(1);
      expect(elec?.inProgress).toBe(1);
      expect(elec?.resolutionRate).toBe(50); // 1 of 2 resolved
      expect(elec?.percentageOfTotal).toBe(67); // 2 of 3 (66.6%)

      const unassigned = summary.departmentDistribution.find(d => d.department === 'Unassigned');
      expect(unassigned).toBeDefined();
      expect(unassigned?.total).toBe(1);
      expect(unassigned?.submitted).toBe(1);
      expect(unassigned?.targetSlaHours).toBeNull();
      expect(unassigned?.slaComplianceRate).toBeNull();
    });
  });

  describe('5. Monthly Submission Trends Across Year Boundaries', () => {
    it('groups complaints by YYYY-MM in proper chronological sequence across year boundaries', () => {
      const c2025_Dec: Complaint = {
        ...baseComplaint,
        id: 'c-dec-25',
        createdAt: '2025-12-15T09:00:00.000Z',
        status: 'Resolved'
      };
      const c2026_Jan: Complaint = {
        ...baseComplaint,
        id: 'c-jan-26',
        createdAt: '2026-01-10T14:00:00.000Z',
        status: 'Submitted'
      };
      const c2026_Feb: Complaint = {
        ...baseComplaint,
        id: 'c-feb-26',
        createdAt: '2026-02-05T11:00:00.000Z',
        status: 'In Progress'
      };

      // Pass in random order
      const summary = calculateAnalyticsSummary([c2026_Feb, c2025_Dec, c2026_Jan]);

      expect(summary.monthlyTrends).toHaveLength(3);
      expect(summary.monthlyTrends[0].monthKey).toBe('2025-12');
      expect(summary.monthlyTrends[0].label).toBe('Dec 2025');
      expect(summary.monthlyTrends[0].total).toBe(1);
      expect(summary.monthlyTrends[0].resolved).toBe(1);

      expect(summary.monthlyTrends[1].monthKey).toBe('2026-01');
      expect(summary.monthlyTrends[1].label).toBe('Jan 2026');

      expect(summary.monthlyTrends[2].monthKey).toBe('2026-02');
      expect(summary.monthlyTrends[2].label).toBe('Feb 2026');
    });
  });

  describe('6. Staff Workload & Performance', () => {
    it('aggregates workload by assignedTo string and categorizes unassigned tickets', () => {
      const c1: Complaint = {
        ...baseComplaint,
        id: 'c1',
        assignedTo: 'Eng. Sarah Jenkins',
        status: 'In Progress'
      };
      const c2: Complaint = {
        ...baseComplaint,
        id: 'c2',
        assignedTo: 'Eng. Sarah Jenkins',
        status: 'Resolved',
        createdAt: '2026-10-01T10:00:00.000Z',
        resolvedAt: '2026-10-01T14:00:00.000Z' // 4 hrs
      };
      const c3: Complaint = {
        ...baseComplaint,
        id: 'c3',
        assignedTo: 'Vikram Mehta',
        status: 'Assigned'
      };
      const c4: Complaint = {
        ...baseComplaint,
        id: 'c4',
        assignedTo: undefined, // Unassigned
        status: 'Submitted'
      };

      const summary = calculateAnalyticsSummary([c1, c2, c3, c4]);

      expect(summary.staffWorkload).toHaveLength(3);

      const sarah = summary.staffWorkload.find(s => s.staffName === 'Eng. Sarah Jenkins');
      expect(sarah).toBeDefined();
      expect(sarah?.totalTickets).toBe(2);
      expect(sarah?.activeTickets).toBe(1);
      expect(sarah?.resolvedTickets).toBe(1);
      expect(sarah?.averageResolutionHours).toBe(4.0);

      const vikram = summary.staffWorkload.find(s => s.staffName === 'Vikram Mehta');
      expect(vikram).toBeDefined();
      expect(vikram?.totalTickets).toBe(1);
      expect(vikram?.activeTickets).toBe(1);
      expect(vikram?.resolvedTickets).toBe(0);
      expect(vikram?.averageResolutionHours).toBeNull();

      const unassigned = summary.staffWorkload.find(s => s.staffName === 'Unassigned');
      expect(unassigned).toBeDefined();
      expect(unassigned?.totalTickets).toBe(1);
      expect(unassigned?.activeTickets).toBe(0);
    });
  });

  describe('7. Department SLA Compliance with Target Configurations', () => {
    it('evaluates compliance only where valid SLA targets and resolved timestamps exist', () => {
      const customConfigs: DepartmentInfo[] = [
        {
          id: 'dept-elec',
          name: 'Electrical Works',
          headName: 'Vikram',
          email: 'elec@campus.edu',
          openTickets: 0,
          resolvedTickets: 0,
          slaHours: 12, // 12h target
          location: 'Block A'
        },
        {
          id: 'dept-no-sla',
          name: 'General Administration',
          headName: 'Admin',
          email: 'admin@campus.edu',
          openTickets: 0,
          resolvedTickets: 0,
          slaHours: 0, // No SLA configured (0)
          location: 'Block B'
        }
      ];

      // c1: Electrical, resolved in 8 hours (<= 12h -> within SLA)
      const c1: Complaint = {
        ...baseComplaint,
        id: 'c1',
        department: 'Electrical Works',
        status: 'Resolved',
        createdAt: '2026-10-01T08:00:00.000Z',
        resolvedAt: '2026-10-01T16:00:00.000Z'
      };

      // c2: Electrical, resolved in 20 hours (> 12h -> breached SLA)
      const c2: Complaint = {
        ...baseComplaint,
        id: 'c2',
        department: 'Electrical Works',
        status: 'Resolved',
        createdAt: '2026-10-01T08:00:00.000Z',
        resolvedAt: '2026-10-02T04:00:00.000Z'
      };

      // c3: General Administration, resolved in 10 hours but has no SLA configured
      const c3: Complaint = {
        ...baseComplaint,
        id: 'c3',
        department: 'General Administration',
        status: 'Resolved',
        createdAt: '2026-10-01T08:00:00.000Z',
        resolvedAt: '2026-10-01T18:00:00.000Z'
      };

      const summary = calculateAnalyticsSummary([c1, c2, c3], customConfigs);

      const elecHealth = summary.departmentSlaHealth.find(d => d.department === 'Electrical Works');
      expect(elecHealth).toBeDefined();
      expect(elecHealth?.resolvedCount).toBe(2);
      expect(elecHealth?.withinSlaCount).toBe(1);
      expect(elecHealth?.complianceRate).toBe(50); // 1 of 2 within 12h

      const genHealth = summary.departmentSlaHealth.find(d => d.department === 'General Administration');
      expect(genHealth).toBeDefined();
      expect(genHealth?.complianceRate).toBeNull(); // SLA target not configured
    });

    it('accurately counts rejected complaints without treating them as resolved', () => {
      const submitted: Complaint = { ...baseComplaint, id: 'c-sub', status: 'Submitted' };
      const resolved: Complaint = {
        ...baseComplaint,
        id: 'c-res',
        status: 'Resolved',
        createdAt: '2026-10-01T10:00:00.000Z',
        resolvedAt: '2026-10-01T14:00:00.000Z'
      };
      const rejected: Complaint = {
        ...baseComplaint,
        id: 'c-rej',
        status: 'Rejected',
        statusHistory: [
          ...baseComplaint.statusHistory,
          {
            id: 'h-rej',
            previousStatus: 'Submitted',
            newStatus: 'Rejected',
            timestamp: '2026-10-01T11:00:00.000Z',
            actor: { id: 'admin-1', name: 'Admin', role: 'admin' }
          }
        ]
      };

      const summary = calculateAnalyticsSummary([submitted, resolved, rejected]);

      expect(summary.totalComplaints).toBe(3);
      expect(summary.statusCounts.Submitted).toBe(1);
      expect(summary.statusCounts.Resolved).toBe(1);
      expect(summary.statusCounts.Rejected).toBe(1);
      // Overall resolution rate: 1 resolved out of 3 = 33%
      expect(summary.overallResolutionRate).toBe(33);
      expect(getResolutionDurationHours(rejected)).toBeNull();
    });

    it('correctly tracks triage time in a multi-step lifecycle (Submitted -> Assigned -> In Progress -> Resolved)', () => {
      const fullLifecycle: Complaint = {
        ...baseComplaint,
        id: 'c-full',
        status: 'Resolved',
        createdAt: '2026-10-01T08:00:00.000Z',
        resolvedAt: '2026-10-01T20:00:00.000Z', // 12 hrs
        statusHistory: [
          {
            id: 'h1',
            previousStatus: null,
            newStatus: 'Submitted',
            timestamp: '2026-10-01T08:00:00.000Z',
            actor: { id: 's1', name: 'Student', role: 'student' }
          },
          {
            id: 'h2',
            previousStatus: 'Submitted',
            newStatus: 'Assigned',
            timestamp: '2026-10-01T09:30:00.000Z', // 1.5 hrs
            actor: { id: 'a1', name: 'Admin', role: 'admin' }
          },
          {
            id: 'h3',
            previousStatus: 'Assigned',
            newStatus: 'In Progress',
            timestamp: '2026-10-01T11:00:00.000Z',
            actor: { id: 'a1', name: 'Admin', role: 'admin' }
          },
          {
            id: 'h4',
            previousStatus: 'In Progress',
            newStatus: 'Resolved',
            timestamp: '2026-10-01T20:00:00.000Z',
            actor: { id: 'a1', name: 'Admin', role: 'admin' }
          }
        ]
      };

      const summary = calculateAnalyticsSummary([fullLifecycle]);

      expect(summary.averageTriageHours).toBe(1.5);
      expect(summary.averageResolutionHours).toBe(12.0);
    });
  });
});
