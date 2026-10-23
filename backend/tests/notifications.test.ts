import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  SESNotificationService,
  ISESClient,
  escapeHtml,
  formatStudentGreeting,
  formatStudentGreetingPlainText,
  getValidFrontendUrl,
  getPriorityBadgeStyles,
  getStatusBadgeStyles
} from '../src/notifications.js';
import {
  Complaint,
  BackendConfig,
  ComplaintPriority,
  ComplaintStatus
} from '../src/types.js';

describe('CampusFix Production SES Notification Service Tests', () => {
  const baseConfig: BackendConfig = {
    awsRegion: 'ap-southeast-2',
    tableName: 'CampusFixComplaints',
    cognitoUserPoolId: 'ap-southeast-2_tNhqL8tGi',
    cognitoClientId: '4oq0kq3qljmhdu8rmbjclt94sl',
    cognitoAdminGroup: 'Administrators',
    allowedOrigin: 'http://localhost:5173',
    sesSourceEmail: 'notifications@campusfix.edu',
    adminNotificationEmail: 'admin-ops@campusfix.edu,facilities@campusfix.edu',
    frontendBaseUrl: 'https://campusfix.edu'
  };

  const sampleComplaint: Complaint = {
    complaintId: 'CMP-202610-A91B',
    entityType: 'COMPLAINT',
    title: 'Water leakage in Engineering Block B washroom',
    description: 'Pipe beneath the third sink has burst and water is flooding the hallway floor.',
    category: 'Sanitation',
    priority: 'High',
    status: 'Submitted',
    location: 'Engineering Block B, 2nd Floor Washroom',
    department: 'Campus Maintenance',
    studentId: 'sub-student-123',
    studentName: 'Rohan Sharma',
    studentEmail: 'rohan.sharma@campus.edu',
    studentDepartment: 'Mechanical Engineering',
    createdAt: '2026-10-24T02:00:00.000Z',
    updatedAt: '2026-10-24T02:00:00.000Z',
    statusHistory: [],
    attachment: null
  };

  let mockSesClient: ISESClient;
  let sentCommands: any[];

  beforeEach(() => {
    sentCommands = [];
    mockSesClient = {
      send: vi.fn(async (command: any) => {
        sentCommands.push(command);
        return { MessageId: 'msg-mock-12345' };
      })
    };
  });

  describe('HTML Escaping & Sanitization', () => {
    it('escapes dangerous HTML characters in dynamic values', () => {
      const malicious = '<script>alert("xss")</script> & "quotes" \'apostrophe\' > <';
      const safe = escapeHtml(malicious);
      expect(safe).not.toContain('<script>');
      expect(safe).toContain('&lt;script&gt;');
      expect(safe).toContain('&amp;');
      expect(safe).toContain('&quot;quotes&quot;');
      expect(safe).toContain('&#039;apostrophe&#039;');
      expect(safe).toContain('&gt; &lt;');
    });

    it('escapes malicious complaint titles, descriptions, and remarks inside emails', async () => {
      const service = new SESNotificationService(baseConfig, mockSesClient);
      const attackComplaint: Complaint = {
        ...sampleComplaint,
        title: 'Projector broken <img src=x onerror=alert(1)>',
        description: 'Attack desc <script>evil()</script>',
        location: 'Room <b>101</b>'
      };

      await service.notifyAdminNewComplaint(attackComplaint);

      const html = sentCommands[0].input.Message.Body.Html.Data;
      expect(html).not.toContain('<img src=x onerror=alert(1)>');
      expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
      expect(html).not.toContain('<script>evil()</script>');
      expect(html).toContain('&lt;script&gt;evil()&lt;/script&gt;');
      expect(html).toContain('Room &lt;b&gt;101&lt;/b&gt;');
    });
  });

  describe('Student Name Greeting Validation', () => {
    it('uses the student name when a genuine name is provided', () => {
      expect(formatStudentGreeting('Alex Chen')).toBe('Hello Alex Chen,');
      expect(formatStudentGreeting('Dr. Jane Doe')).toBe('Hello Dr. Jane Doe,');
      expect(formatStudentGreetingPlainText('Alex Chen')).toBe('Hello Alex Chen,');
    });

    it('falls back to "Hello," when the student name is a Cognito UUID', () => {
      const cognitoUuid = '3f41df08-2503-705a-350d-d9ca437da504';
      expect(formatStudentGreeting(cognitoUuid)).toBe('Hello,');
      expect(formatStudentGreetingPlainText(cognitoUuid)).toBe('Hello,');
    });

    it('falls back to "Hello," when name is missing, empty, or a generic identifier', () => {
      expect(formatStudentGreeting(undefined)).toBe('Hello,');
      expect(formatStudentGreeting(null)).toBe('Hello,');
      expect(formatStudentGreeting('')).toBe('Hello,');
      expect(formatStudentGreeting('   ')).toBe('Hello,');
      expect(formatStudentGreeting('sub-student-001')).toBe('Hello,');
      expect(formatStudentGreeting('user-999')).toBe('Hello,');
      expect(formatStudentGreeting('CampusFix User')).toBe('Hello,');
      expect(formatStudentGreeting('unknown')).toBe('Hello,');

      expect(formatStudentGreetingPlainText('')).toBe('Hello,');
      expect(formatStudentGreetingPlainText('sub-student-001')).toBe('Hello,');
    });
  });

  describe('URL & Call-To-Action Handling', () => {
    it('accepts valid production URLs and trims trailing slashes', () => {
      expect(getValidFrontendUrl('https://campusfix.edu/')).toBe('https://campusfix.edu');
      expect(getValidFrontendUrl('https://portal.campusfix.edu')).toBe('https://portal.campusfix.edu');
    });

    it('strictly rejects localhost and loopback URLs for production emails', () => {
      expect(getValidFrontendUrl('http://localhost:5173')).toBeNull();
      expect(getValidFrontendUrl('http://localhost:3000/')).toBeNull();
      expect(getValidFrontendUrl('http://127.0.0.1:5173')).toBeNull();
      expect(getValidFrontendUrl('http://[::1]:5173')).toBeNull();
    });

    it('returns null for missing or malformed URLs', () => {
      expect(getValidFrontendUrl('')).toBeNull();
      expect(getValidFrontendUrl(undefined)).toBeNull();
      expect(getValidFrontendUrl('not-a-valid-url')).toBeNull();
    });

    it('renders CTA button when valid FRONTEND_BASE_URL is configured', async () => {
      const service = new SESNotificationService(baseConfig, mockSesClient);
      await service.notifyAdminNewComplaint(sampleComplaint);

      const html = sentCommands[0].input.Message.Body.Html.Data;
      const text = sentCommands[0].input.Message.Body.Text.Data;

      expect(html).toContain('https://campusfix.edu/admin/complaints/CMP-202610-A91B');
      expect(html).toContain('View Complaint');
      expect(text).toContain('View Complaint: https://campusfix.edu/admin/complaints/CMP-202610-A91B');
    });

    it('completely omits CTA button and does not generate localhost link when FRONTEND_BASE_URL is localhost or empty', async () => {
      const localhostConfig: BackendConfig = {
        ...baseConfig,
        frontendBaseUrl: 'http://localhost:5173'
      };
      const service = new SESNotificationService(localhostConfig, mockSesClient);
      await service.notifyStudentStatusUpdated(sampleComplaint, 'Submitted', 'In Progress');

      const html = sentCommands[0].input.Message.Body.Html.Data;
      const text = sentCommands[0].input.Message.Body.Text.Data;

      expect(html).not.toContain('localhost');
      expect(html).not.toContain('View My Complaint');
      expect(text).not.toContain('localhost');
      expect(text).not.toContain('View My Complaint:');
    });
  });

  describe('Badges and Visual Hierarchy', () => {
    it('supports all priority levels with accessible contrast colors', () => {
      const priorities: ComplaintPriority[] = ['Critical', 'High', 'Medium', 'Low'];
      for (const p of priorities) {
        const styles = getPriorityBadgeStyles(p);
        expect(styles.bg).toBeDefined();
        expect(styles.text).toBeDefined();
        expect(styles.border).toBeDefined();
      }
    });

    it('supports all complaint statuses with accessible contrast colors', () => {
      const statuses: ComplaintStatus[] = ['Submitted', 'Assigned', 'In Progress', 'Resolved', 'Rejected'];
      for (const s of statuses) {
        const styles = getStatusBadgeStyles(s);
        expect(styles.bg).toBeDefined();
        expect(styles.text).toBeDefined();
        expect(styles.border).toBeDefined();
      }
    });
  });

  describe('Email 1: New Complaint — Administrator', () => {
    it('generates polished email with brand header, details table, description box, and student info', async () => {
      const service = new SESNotificationService(baseConfig, mockSesClient);
      const ok = await service.notifyAdminNewComplaint(sampleComplaint);

      expect(ok).toBe(true);
      const input = sentCommands[0].input;
      expect(input.Destination.ToAddresses).toEqual(['admin-ops@campusfix.edu', 'facilities@campusfix.edu']);
      expect(input.Message.Subject.Data).toBe('[CampusFix] New Complaint: CMP-202610-A91B [High Priority]');

      const html = input.Message.Body.Html.Data;
      expect(html).toContain('CampusFix');
      expect(html).toContain('New Complaint Received');
      expect(html).toContain('#102A43'); // Deep navy
      expect(html).toContain('#EAF2F8'); // Light blue
      expect(html).toContain('CMP-202610-A91B');
      expect(html).toContain('High Priority');
      expect(html).toContain('Engineering Block B, 2nd Floor Washroom');
      expect(html).toContain('Rohan Sharma');
      expect(html).toContain('rohan.sharma@campus.edu');
      expect(html).toContain('Mechanical Engineering');
      expect(html).toContain(sampleComplaint.description);

      const text = input.Message.Body.Text.Data;
      expect(text).toContain('CAMPUSFIX - NEW COMPLAINT RECEIVED');
      expect(text).toContain('CMP-202610-A91B');
      expect(text).toContain('Priority: High');
      expect(text).toContain('Student: Rohan Sharma (rohan.sharma@campus.edu)');
    });
  });

  describe('Email 2: Complaint Status Update — Student', () => {
    it('generates status update with genuine name, status progression, and admin remarks', async () => {
      const service = new SESNotificationService(baseConfig, mockSesClient);
      const ok = await service.notifyStudentStatusUpdated(
        sampleComplaint,
        'Submitted',
        'In Progress',
        'Maintenance crew dispatched with replacement valve.'
      );

      expect(ok).toBe(true);
      const input = sentCommands[0].input;
      expect(input.Destination.ToAddresses).toEqual(['rohan.sharma@campus.edu']);
      expect(input.Message.Subject.Data).toBe('[CampusFix] Status Update: CMP-202610-A91B is now In Progress');

      const html = input.Message.Body.Html.Data;
      expect(html).toContain('Hello Rohan Sharma,');
      expect(html).toContain('Complaint Status Update');
      expect(html).toContain('Submitted');
      expect(html).toContain('Status: In Progress');
      expect(html).toContain('Maintenance crew dispatched with replacement valve.');

      const text = input.Message.Body.Text.Data;
      expect(text).toContain('Hello Rohan Sharma,');
      expect(text).toContain('Previous Status: Submitted');
      expect(text).toContain('New Status: In Progress');
      expect(text).toContain('Maintenance crew dispatched with replacement valve.');
    });

    it('falls back to "Hello," when studentName is a UUID', async () => {
      const service = new SESNotificationService(baseConfig, mockSesClient);
      const uuidComplaint = {
        ...sampleComplaint,
        studentName: 'e499d690-344c-4e56-9d62-fc43bfae9812'
      };

      await service.notifyStudentStatusUpdated(uuidComplaint, 'Submitted', 'Resolved');

      const html = sentCommands[0].input.Message.Body.Html.Data;
      const text = sentCommands[0].input.Message.Body.Text.Data;

      expect(html).toContain('Hello,');
      expect(html).not.toContain('e499d690-344c-4e56-9d62-fc43bfae9812');
      expect(text).toContain('Hello,');
      expect(text).not.toContain('e499d690-344c-4e56-9d62-fc43bfae9812');
    });
  });

  describe('Email 3: Complaint Assignment — Student', () => {
    it('generates assignment notification with department, staff member, and remarks', async () => {
      const service = new SESNotificationService(baseConfig, mockSesClient);
      const ok = await service.notifyStudentAssigned(
        sampleComplaint,
        'Campus Maintenance',
        'Vikram Singh',
        'Assigned for immediate pipe fixture inspection.'
      );

      expect(ok).toBe(true);
      const input = sentCommands[0].input;
      expect(input.Destination.ToAddresses).toEqual(['rohan.sharma@campus.edu']);
      expect(input.Message.Subject.Data).toBe('[CampusFix] Ticket Assigned: CMP-202610-A91B to Campus Maintenance');

      const html = input.Message.Body.Html.Data;
      expect(html).toContain('Hello Rohan Sharma,');
      expect(html).toContain('Complaint Assigned for Resolution');
      expect(html).toContain('Campus Maintenance');
      expect(html).toContain('Vikram Singh');
      expect(html).toContain('Assigned for immediate pipe fixture inspection.');

      const text = input.Message.Body.Text.Data;
      expect(text).toContain('Hello Rohan Sharma,');
      expect(text).toContain('Assigned Department: Campus Maintenance');
      expect(text).toContain('Assigned Staff: Vikram Singh');
      expect(text).toContain('Assigned for immediate pipe fixture inspection.');
    });
  });

  describe('Fault Tolerance & Non-Fatal Handling', () => {
    it('logs warning and returns false without throwing when SES throws sandbox or transmission errors', async () => {
      const failingSes: ISESClient = {
        send: vi.fn(async () => {
          const err = new Error('Email address is not verified in SES sandbox.');
          err.name = 'MessageRejected';
          throw err;
        })
      };

      const service = new SESNotificationService(baseConfig, failingSes);
      const ok = await service.notifyStudentStatusUpdated(sampleComplaint, 'Submitted', 'Resolved');

      expect(ok).toBe(false);
      expect(failingSes.send).toHaveBeenCalledTimes(1);
    });

    it('gracefully skips email if SES_SOURCE_EMAIL is unconfigured', async () => {
      const noSourceConfig: BackendConfig = {
        ...baseConfig,
        sesSourceEmail: ''
      };
      const service = new SESNotificationService(noSourceConfig, mockSesClient);
      const ok = await service.notifyAdminNewComplaint(sampleComplaint);

      expect(ok).toBe(false);
      expect(mockSesClient.send).not.toHaveBeenCalled();
    });
  });
});
