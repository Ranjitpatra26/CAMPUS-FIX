import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  escapeCsvCell,
  toCsvString,
  generateAnalyticsSummaryCsv,
  generateComplaintRegisterCsv,
  downloadCsvFile,
  triggerPrintReport
} from '../src/utils/exportReport';
import { calculateAnalyticsSummary } from '../src/utils/analytics';
import { Complaint } from '../src/types';

describe('Advanced Admin Analytics Report Exports (src/utils/exportReport.ts)', () => {
  const dummyStudentEmail = 'confidential.student@campus.edu';
  const dummyStudentName = 'Johnathan Doe';
  const dummyStudentId = 'ST-SECRET-8842';
  const dummyDescription = 'Sensitive personal disclosure that should never be in exported register.';

  const sampleComplaint: Complaint = {
    id: 'CMP-2026-001',
    title: 'Broken lab multimeter',
    description: dummyDescription,
    category: 'Laboratory Equipment',
    priority: 'High',
    status: 'Resolved',
    location: 'Science Block 2, Lab 4',
    department: 'Electrical Works',
    studentId: dummyStudentId,
    studentName: dummyStudentName,
    studentEmail: dummyStudentEmail,
    studentDepartment: 'Physics',
    assignedTo: 'Vikram Mehta',
    createdAt: '2026-10-01T09:00:00.000Z',
    updatedAt: '2026-10-01T15:00:00.000Z',
    resolvedAt: '2026-10-01T15:00:00.000Z',
    statusHistory: [
      {
        id: 'h1',
        previousStatus: null,
        newStatus: 'Submitted',
        timestamp: '2026-10-01T09:00:00.000Z',
        actor: { id: dummyStudentId, name: dummyStudentName, role: 'student' }
      },
      {
        id: 'h2',
        previousStatus: 'Submitted',
        newStatus: 'Assigned',
        timestamp: '2026-10-01T10:00:00.000Z',
        actor: { id: 'admin-1', name: 'Admin', role: 'admin' }
      },
      {
        id: 'h3',
        previousStatus: 'Assigned',
        newStatus: 'Resolved',
        timestamp: '2026-10-01T15:00:00.000Z',
        actor: { id: 'admin-1', name: 'Admin', role: 'admin' }
      }
    ]
  };

  describe('1. CSV Escaping & RFC 4180 Compliance', () => {
    it('handles null and undefined values by returning empty strings', () => {
      expect(escapeCsvCell(null)).toBe('');
      expect(escapeCsvCell(undefined)).toBe('');
    });

    it('leaves standard text, numbers, and booleans unquoted if no special characters exist', () => {
      expect(escapeCsvCell('IT Services')).toBe('IT Services');
      expect(escapeCsvCell(42)).toBe('42');
      expect(escapeCsvCell(true)).toBe('true');
    });

    it('wraps fields containing commas in double quotes', () => {
      expect(escapeCsvCell('Tech Tower, Block B, Room 102')).toBe('"Tech Tower, Block B, Room 102"');
    });

    it('escapes embedded double quotes by doubling them', () => {
      expect(escapeCsvCell('Repair was "successful" today')).toBe('"Repair was ""successful"" today"');
    });

    it('wraps fields containing newlines or carriage returns in quotes', () => {
      expect(escapeCsvCell("Line 1\nLine 2")).toBe('"Line 1\nLine 2"');
      expect(escapeCsvCell("CR\rLF")).toBe('"CR\rLF"');
    });
  });

  describe('2. Formula Injection Protection (CWE-1236)', () => {
    it('prefixes dangerous leading characters (=, +, -, @, \\t, \\r) with a single quote and quotes them', () => {
      // Equals: common spreadsheet formula
      expect(escapeCsvCell('=SUM(A1:B10)')).toBe('"\'=SUM(A1:B10)"');
      expect(escapeCsvCell('=1+2, "danger"')).toBe('"\'=1+2, ""danger"""');

      // Plus: can trigger command execution or formula evaluation
      expect(escapeCsvCell('+12345')).toBe('"\'\+12345"');

      // Minus: can trigger formula evaluation
      expect(escapeCsvCell('-25% discount')).toBe('"\'\-25% discount"');

      // At sign: can invoke web calls or external formulas
      expect(escapeCsvCell('@SUM(1,2)')).toBe('"\'@SUM(1,2)"');

      // Tab and carriage return
      expect(escapeCsvCell('\tIndented')).toBe('"\'\tIndented"');
      expect(escapeCsvCell('\rReturn')).toBe('"\'\rReturn"');
    });

    it('properly serializes 2D rows into CRLF-separated CSV', () => {
      const rows = [
        ['Header1', 'Header2'],
        ['Val, 1', '=2+3']
      ];
      const csv = toCsvString(rows);
      expect(csv).toBe('Header1,Header2\r\n"Val, 1","\'=2+3"');
    });
  });

  describe('3. Executive Analytics Summary CSV Export', () => {
    it('generates a structured executive report with honest metrics from real data', () => {
      const summary = calculateAnalyticsSummary([sampleComplaint]);
      const fixedDate = new Date('2026-10-24T05:00:00.000Z');
      const csv = generateAnalyticsSummaryCsv(summary, fixedDate);

      // Verifies report metadata
      expect(csv).toContain('CAMPUSFIX EXECUTIVE ANALYTICS REPORT');
      expect(csv).toContain('2026-10-24T05:00:00.000Z');

      // Verifies Section 1 KPIs
      expect(csv).toContain('Total Incidents Logged,1');
      expect(csv).toContain('Overall Resolution Rate,100%');
      expect(csv).toContain('Average Resolution Velocity,6.0 hrs');
      expect(csv).toContain('Average Triage SLA,1.0 hrs');

      // Verifies Section 2 Statuses
      expect(csv).toContain('Resolved,1,100%');
      expect(csv).toContain('Submitted,0,0%');

      // Verifies Section 3 Departments
      expect(csv).toContain('Electrical Works,1,0,0,0,1,0,100%,100%,6.0 hrs,12h,100%');

      // Verifies Section 4 Staff
      expect(csv).toContain('Vikram Mehta,0,1,1,6.0 hrs');

      // Verifies PII is absent
      expect(csv).not.toContain(dummyStudentEmail);
      expect(csv).not.toContain(dummyStudentName);
      expect(csv).not.toContain(dummyStudentId);
      expect(csv).not.toContain(dummyDescription);
    });

    it('handles empty summaries honestly without NaN or broken lines', () => {
      const emptySummary = calculateAnalyticsSummary([]);
      const csv = generateAnalyticsSummaryCsv(emptySummary);

      expect(csv).toContain('Total Incidents Logged,0');
      expect(csv).toContain('Overall Resolution Rate,0%');
      expect(csv).toContain('Average Resolution Velocity,N/A');
      expect(csv).toContain('Average Triage SLA,N/A');
      expect(csv).not.toContain('NaN');
      expect(csv).not.toContain('Infinity');
    });
  });

  describe('4. Sanitized Complaint Register CSV Export', () => {
    it('contains strictly whitelist-projected columns and suppresses all student PII', () => {
      const maliciousComplaint: Complaint = {
        ...sampleComplaint,
        id: 'CMP-DANGEROUS-99',
        title: '=cmd|"/C calc"!A0', // Formula injection attempt in title
        department: undefined, // Unassigned
        assignedTo: undefined // Unassigned
      };

      const csv = generateComplaintRegisterCsv([sampleComplaint, maliciousComplaint]);

      // Header row check
      expect(csv).toContain(
        'Complaint ID,Title,Department,Category,Priority,Status,Created At (UTC),Resolved At (UTC),Resolution Duration (Hours),Assigned Staff'
      );

      // Verifies formula injection was sanitized in malicious title
      expect(csv).toContain('"\'=cmd|""/C calc""!A0"');

      // Verifies unassigned fallbacks
      expect(csv).toContain('Unassigned');

      // CRITICAL PII & Confidentiality Verification
      expect(csv).not.toContain(dummyStudentEmail);
      expect(csv).not.toContain(dummyStudentName);
      expect(csv).not.toContain(dummyStudentId);
      expect(csv).not.toContain(dummyDescription);
      expect(csv).not.toContain('studentEmail');
      expect(csv).not.toContain('studentId');
      expect(csv).not.toContain('studentName');
      expect(csv).not.toContain('studentDepartment');
      expect(csv).not.toContain('description');
      expect(csv).not.toContain('adminRemarks');
    });

    it('handles empty complaint registers gracefully', () => {
      const csv = generateComplaintRegisterCsv([]);
      expect(csv).toBe(
        'Complaint ID,Title,Department,Category,Priority,Status,Created At (UTC),Resolved At (UTC),Resolution Duration (Hours),Assigned Staff'
      );
    });
  });

  describe('5. Browser Download & Print Interactions', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('creates Blob and anchor element to trigger download in browser', () => {
      const mockRevoke = vi.fn();
      const mockCreateObjectURL = vi.fn().mockReturnValue('blob:mock-url-123');

      const clickSpy = vi.fn();
      const mockAnchor = {
        setAttribute: vi.fn(),
        style: {},
        click: clickSpy
      } as any;

      const mockBody = {
        appendChild: vi.fn(),
        removeChild: vi.fn()
      };

      const mockDocument = {
        body: mockBody,
        createElement: vi.fn().mockReturnValue(mockAnchor)
      };

      Object.defineProperty(globalThis, 'window', {
        value: {
          URL: {
            createObjectURL: mockCreateObjectURL,
            revokeObjectURL: mockRevoke
          }
        },
        writable: true
      });

      Object.defineProperty(globalThis, 'document', {
        value: mockDocument,
        writable: true
      });

      downloadCsvFile('Test,CSV,Data', 'test-report.csv');

      expect(mockCreateObjectURL).toHaveBeenCalled();
      expect(mockAnchor.setAttribute).toHaveBeenCalledWith('download', 'test-report.csv');
      expect(mockAnchor.setAttribute).toHaveBeenCalledWith('href', 'blob:mock-url-123');
      expect(clickSpy).toHaveBeenCalled();
      expect(mockRevoke).toHaveBeenCalledWith('blob:mock-url-123');
    });

    it('triggers window.print() when triggerPrintReport is called', () => {
      const printSpy = vi.fn();
      Object.defineProperty(globalThis, 'window', {
        value: { print: printSpy },
        writable: true
      });

      triggerPrintReport();
      expect(printSpy).toHaveBeenCalled();
    });
  });
});
