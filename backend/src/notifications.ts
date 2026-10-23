import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Complaint, ComplaintPriority, ComplaintStatus, DepartmentName } from './types.js';
import { BackendConfig, config as defaultConfig } from './config.js';

export interface ISESClient {
  send(command: any): Promise<any>;
}

export interface INotificationService {
  notifyAdminNewComplaint(complaint: Complaint): Promise<boolean>;
  notifyStudentStatusUpdated(
    complaint: Complaint,
    previousStatus: ComplaintStatus,
    newStatus: ComplaintStatus,
    remark?: string
  ): Promise<boolean>;
  notifyStudentAssigned(
    complaint: Complaint,
    department: DepartmentName,
    assignedTo: string,
    remark?: string
  ): Promise<boolean>;
}

/**
 * Escapes characters for safe HTML inclusion to prevent injection attacks.
 */
export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Generates an appropriate greeting for students.
 * Crucially: Never displays a raw Cognito subject/UUID as the student's name.
 */
export function formatStudentGreeting(studentName?: string | null): string {
  if (!studentName) return 'Hello,';
  const trimmed = studentName.trim();
  if (!trimmed) return 'Hello,';

  // Check if studentName matches a standard UUID or Cognito sub identifier
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
  const isGeneric = /^(sub-|user-|campusfix user|unknown|anonymous)/i.test(trimmed);

  if (isUuid || isGeneric) {
    return 'Hello,';
  }
  return `Hello ${escapeHtml(trimmed)},`;
}

/**
 * Plain-text greeting generator matching the same genuine name validation.
 */
export function formatStudentGreetingPlainText(studentName?: string | null): string {
  if (!studentName) return 'Hello,';
  const trimmed = studentName.trim();
  if (!trimmed) return 'Hello,';

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(trimmed);
  const isGeneric = /^(sub-|user-|campusfix user|unknown|anonymous)/i.test(trimmed);

  if (isUuid || isGeneric) {
    return 'Hello,';
  }
  return `Hello ${trimmed},`;
}

/**
 * Validates and normalizes the frontend base URL.
 * Strictly avoids generating localhost or loopback links for production emails.
 */
export function getValidFrontendUrl(rawUrl?: string): string | null {
  if (!rawUrl) return null;
  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // Never generate a localhost or loopback link for production emails
  if (/localhost|127\.0\.0\.1|::1/i.test(trimmed)) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return trimmed.replace(/\/+$/, '');
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Priority badge visual styles with high-contrast, accessible colours.
 */
export function getPriorityBadgeStyles(priority: ComplaintPriority): { bg: string; text: string; border: string } {
  switch (priority) {
    case 'Critical':
      return { bg: '#FFE3E3', text: '#9C1414', border: '#F87171' };
    case 'High':
      return { bg: '#FFEDD5', text: '#9A3412', border: '#FDBA74' };
    case 'Medium':
      return { bg: '#FEF3C7', text: '#854D0E', border: '#FDE047' };
    case 'Low':
    default:
      return { bg: '#E2E8F0', text: '#334E68', border: '#CBD5E1' };
  }
}

/**
 * Status badge visual styles with accessible colours.
 */
export function getStatusBadgeStyles(status: ComplaintStatus): { bg: string; text: string; border: string } {
  switch (status) {
    case 'Submitted':
      return { bg: '#EAF2F8', text: '#102A43', border: '#BCCCDC' };
    case 'Assigned':
      return { bg: '#EEF2FF', text: '#3730A3', border: '#C7D2FE' };
    case 'In Progress':
      return { bg: '#FEF3C7', text: '#92400E', border: '#FDE68A' };
    case 'Resolved':
      return { bg: '#DCFCE7', text: '#166534', border: '#86EFAC' };
    case 'Rejected':
      return { bg: '#FFE4E6', text: '#9F1239', border: '#FDA4AF' };
    default:
      return { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' };
  }
}

/**
 * Wraps content in the unified CampusFix responsive email shell.
 * System fonts, deep navy (#102A43), light blue (#EAF2F8), and neutral card styling.
 */
function wrapEmailLayout(subject: string, bodyContentHtml: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F7FA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #102A43; -webkit-font-smoothing: antialiased; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F4F7FA; padding: 32px 16px 40px 16px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #FFFFFF; border: 1px solid #D9E2EC; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(16, 42, 67, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #102A43; padding: 24px 32px; text-align: left;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td>
                    <span style="font-size: 22px; font-weight: 800; color: #FFFFFF; letter-spacing: 0.5px;">CampusFix</span>
                    <span style="display: block; font-size: 11px; color: #BAC7D5; margin-top: 3px; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 600;">College Incident Management</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 32px 32px 28px 32px;">
              ${bodyContentHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 20px 32px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #334E68;">CampusFix College Complaint Management System</p>
              <p style="margin: 0; font-size: 12px; color: #627D98; line-height: 1.5;">Automated campus operations notification &bull; Please do not reply directly to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();
}

/**
 * Builds an email-compatible call-to-action button table.
 * If no valid URL is configured, returns an empty string.
 */
function renderCtaButton(url: string | null, text: string): string {
  if (!url) return '';
  return `
<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin: 28px 0 12px 0;">
  <tr>
    <td align="left" style="border-radius: 6px; background-color: #102A43;">
      <a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" style="font-size: 14px; font-weight: 600; color: #FFFFFF; text-decoration: none; padding: 12px 28px; border-radius: 6px; display: inline-block; background-color: #102A43; border: 1px solid #102A43;">
        ${escapeHtml(text)} &rarr;
      </a>
    </td>
  </tr>
</table>
`.trim();
}

export class SESNotificationService implements INotificationService {
  private sesClient: ISESClient;
  private config: BackendConfig;

  constructor(config: BackendConfig = defaultConfig, customSesClient?: ISESClient) {
    this.config = config;
    if (customSesClient) {
      this.sesClient = customSesClient;
    } else {
      this.sesClient = new SESClient({ region: config.awsRegion });
    }
  }

  /**
   * Helper to execute SES SendEmailCommand with non-fatal error handling.
   */
  private async sendEmail(
    recipients: string[],
    subject: string,
    textBody: string,
    htmlBody: string
  ): Promise<boolean> {
    if (!this.config.sesSourceEmail) {
      console.warn('[CampusFix SES] SES_SOURCE_EMAIL is not configured. Skipping email notification.');
      return false;
    }

    const validRecipients = recipients
      .map(r => r.trim())
      .filter(r => r.length > 0 && r.includes('@'));

    if (validRecipients.length === 0) {
      console.warn('[CampusFix SES] No valid recipient email addresses provided. Skipping email delivery.');
      return false;
    }

    try {
      const command = new SendEmailCommand({
        Source: this.config.sesSourceEmail,
        Destination: {
          ToAddresses: validRecipients
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8'
          },
          Body: {
            Text: {
              Data: textBody,
              Charset: 'UTF-8'
            },
            Html: {
              Data: htmlBody,
              Charset: 'UTF-8'
            }
          }
        }
      });

      await this.sesClient.send(command);
      return true;
    } catch (err) {
      // Non-fatal error handling: log warning and continue without throwing
      console.warn('[CampusFix SES Error] Failed to send email via Amazon SES:', err);
      return false;
    }
  }

  /**
   * 1. Notify Administrators when a new complaint is submitted.
   */
  public async notifyAdminNewComplaint(complaint: Complaint): Promise<boolean> {
    if (!this.config.adminNotificationEmail) {
      console.warn('[CampusFix SES] ADMIN_NOTIFICATION_EMAIL is not configured. Skipping admin notification.');
      return false;
    }

    const adminRecipients = this.config.adminNotificationEmail
      .split(',')
      .map(e => e.trim())
      .filter(Boolean);

    const subject = `[CampusFix] New Complaint: ${complaint.complaintId} [${complaint.priority} Priority]`;

    // Construct valid frontend URL if configured (never localhost)
    const validBaseUrl = getValidFrontendUrl(this.config.frontendBaseUrl);
    const ctaUrl = validBaseUrl ? `${validBaseUrl}/admin/complaints/${encodeURIComponent(complaint.complaintId)}` : null;

    const priorityBadge = getPriorityBadgeStyles(complaint.priority);

    const textBody = `
CAMPUSFIX - NEW COMPLAINT RECEIVED
==================================

A new campus complaint has been registered and is pending administrative triage.

Complaint ID: ${complaint.complaintId}
Title: ${complaint.title}
Priority: ${complaint.priority}
Category: ${complaint.category}
Location: ${complaint.location}
Department: ${complaint.department || 'Unassigned'}
Student: ${complaint.studentName} (${complaint.studentEmail})
${complaint.studentDepartment ? `Student Department: ${complaint.studentDepartment}\n` : ''}Submitted At: ${complaint.createdAt}

Description:
${complaint.description}
${ctaUrl ? `\nView Complaint: ${ctaUrl}\n` : ''}
---
CampusFix College Complaint Management System
Automated notification. Please do not reply directly to this email.
`.trim();

    const contentHtml = `
      <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #102A43;">New Complaint Received</h2>
      <p style="margin: 0 0 24px 0; font-size: 14px; color: #486581; line-height: 1.5;">
        A new campus issue has been submitted and registered into the queue for administrative triage and resolution.
      </p>

      <!-- Details Table -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin-bottom: 24px;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; font-weight: 600; color: #627D98; width: 32%;">Complaint ID</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 14px; font-weight: 700; color: #102A43;">${escapeHtml(complaint.complaintId)}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; font-weight: 600; color: #627D98;">Title</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 14px; font-weight: 600; color: #102A43;">${escapeHtml(complaint.title)}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; font-weight: 600; color: #627D98;">Priority</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 14px;">
            <span style="display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; background-color: ${priorityBadge.bg}; color: ${priorityBadge.text}; border: 1px solid ${priorityBadge.border}; text-transform: uppercase;">
              ${escapeHtml(complaint.priority)} Priority
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; font-weight: 600; color: #627D98;">Category</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 14px; color: #102A43;">${escapeHtml(complaint.category)}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; font-weight: 600; color: #627D98;">Location</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 14px; color: #102A43;">${escapeHtml(complaint.location)}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; font-weight: 600; color: #627D98;">Department</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 14px; color: #102A43;">${escapeHtml(complaint.department || 'Unassigned')}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; font-weight: 600; color: #627D98;">Student</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 14px; color: #102A43;">
            ${escapeHtml(complaint.studentName)}
            <span style="font-size: 13px; color: #627D98;">(${escapeHtml(complaint.studentEmail)})</span>
          </td>
        </tr>
        ${complaint.studentDepartment ? `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; font-weight: 600; color: #627D98;">Student Dept</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 14px; color: #102A43;">${escapeHtml(complaint.studentDepartment)}</td>
        </tr>` : ''}
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; font-weight: 600; color: #627D98;">Submitted At</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; color: #627D98;">${escapeHtml(complaint.createdAt)}</td>
        </tr>
      </table>

      <!-- Description Section -->
      <div style="margin-bottom: 20px;">
        <div style="font-size: 12px; font-weight: 700; color: #486581; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 8px;">Complaint Description</div>
        <div style="background-color: #EAF2F8; border-left: 4px solid #102A43; border-radius: 4px; padding: 14px 18px; font-size: 14px; color: #102A43; line-height: 1.6;">
          ${escapeHtml(complaint.description)}
        </div>
      </div>

      ${renderCtaButton(ctaUrl, 'View Complaint')}
`.trim();

    const htmlBody = wrapEmailLayout(subject, contentHtml);
    return this.sendEmail(adminRecipients, subject, textBody, htmlBody);
  }

  /**
   * 2. Notify Student when an administrator changes their complaint status.
   */
  public async notifyStudentStatusUpdated(
    complaint: Complaint,
    previousStatus: ComplaintStatus,
    newStatus: ComplaintStatus,
    remark?: string
  ): Promise<boolean> {
    const studentEmail = complaint.studentEmail?.trim();
    if (!studentEmail) {
      console.warn(`[CampusFix SES] Complaint ${complaint.complaintId} has no studentEmail. Skipping notification.`);
      return false;
    }

    const subject = `[CampusFix] Status Update: ${complaint.complaintId} is now ${newStatus}`;

    const validBaseUrl = getValidFrontendUrl(this.config.frontendBaseUrl);
    const ctaUrl = validBaseUrl ? `${validBaseUrl}/student/complaints/${encodeURIComponent(complaint.complaintId)}` : null;

    const newStatusBadge = getStatusBadgeStyles(newStatus);
    const updatedAt = new Date().toISOString();

    const textBody = `
${formatStudentGreetingPlainText(complaint.studentName)}

The status of your CampusFix complaint has been updated by an administrator.

Complaint ID: ${complaint.complaintId}
Title: ${complaint.title}
Previous Status: ${previousStatus}
New Status: ${newStatus}
${remark ? `Administrator Remarks: ${remark}\n` : ''}Updated At: ${updatedAt}
${ctaUrl ? `\nView My Complaint: ${ctaUrl}\n` : ''}
---
CampusFix College Complaint Management System
Automated notification. Please do not reply directly to this email.
`.trim();

    const contentHtml = `
      <p style="margin: 0 0 16px 0; font-size: 15px; font-weight: 600; color: #102A43;">
        ${formatStudentGreeting(complaint.studentName)}
      </p>

      <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #102A43;">Complaint Status Update</h2>
      <p style="margin: 0 0 24px 0; font-size: 14px; color: #486581; line-height: 1.5;">
        The status of your campus incident report has been reviewed and updated by campus administration.
      </p>

      <!-- Status Banner -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #F8FAFC; border: 1px solid #D9E2EC; border-radius: 6px; padding: 18px 20px; margin-bottom: 24px;">
        <tr>
          <td align="center">
            <div style="font-size: 11px; font-weight: 700; color: #627D98; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px;">
              Status Progression
            </div>
            <div style="font-size: 14px; color: #334E68;">
              <span style="color: #627D98;">${escapeHtml(previousStatus)}</span>
              <span style="margin: 0 10px; color: #9FB3C8;">&rarr;</span>
              <span style="display: inline-block; padding: 4px 14px; border-radius: 9999px; font-size: 13px; font-weight: 700; background-color: ${newStatusBadge.bg}; color: ${newStatusBadge.text}; border: 1px solid ${newStatusBadge.border}; text-transform: uppercase;">
                Status: ${escapeHtml(newStatus)}
              </span>
            </div>
          </td>
        </tr>
      </table>

      <!-- Ticket Details -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin-bottom: 20px;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; font-weight: 600; color: #627D98; width: 32%;">Complaint ID</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 14px; font-weight: 700; color: #102A43;">${escapeHtml(complaint.complaintId)}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; font-weight: 600; color: #627D98;">Title</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 14px; font-weight: 600; color: #102A43;">${escapeHtml(complaint.title)}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; font-weight: 600; color: #627D98;">Updated At</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; color: #627D98;">${escapeHtml(updatedAt)}</td>
        </tr>
      </table>

      ${remark ? `
      <!-- Remarks Box -->
      <div style="margin-bottom: 20px;">
        <div style="font-size: 12px; font-weight: 700; color: #486581; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 6px;">Administrator Remarks</div>
        <div style="background-color: #F8FAFC; border-left: 4px solid #102A43; border-radius: 4px; padding: 14px 18px; font-size: 14px; color: #102A43; line-height: 1.6;">
          ${escapeHtml(remark)}
        </div>
      </div>
      ` : ''}

      ${renderCtaButton(ctaUrl, 'View My Complaint')}
`.trim();

    const htmlBody = wrapEmailLayout(subject, contentHtml);
    return this.sendEmail([studentEmail], subject, textBody, htmlBody);
  }

  /**
   * 3. Notify Student when complaint assignment is made or modified.
   */
  public async notifyStudentAssigned(
    complaint: Complaint,
    department: DepartmentName,
    assignedTo: string,
    remark?: string
  ): Promise<boolean> {
    const studentEmail = complaint.studentEmail?.trim();
    if (!studentEmail) {
      console.warn(`[CampusFix SES] Complaint ${complaint.complaintId} has no studentEmail. Skipping notification.`);
      return false;
    }

    const subject = `[CampusFix] Ticket Assigned: ${complaint.complaintId} to ${department}`;

    const validBaseUrl = getValidFrontendUrl(this.config.frontendBaseUrl);
    const ctaUrl = validBaseUrl ? `${validBaseUrl}/student/complaints/${encodeURIComponent(complaint.complaintId)}` : null;

    const currentStatusBadge = getStatusBadgeStyles(complaint.status);

    const textBody = `
${formatStudentGreetingPlainText(complaint.studentName)}

Your CampusFix complaint has been assigned to a department for action.

Complaint ID: ${complaint.complaintId}
Title: ${complaint.title}
Assigned Department: ${department}
Assigned Staff: ${assignedTo}
Current Status: ${complaint.status}
${remark ? `Remarks: ${remark}\n` : ''}
${ctaUrl ? `\nView My Complaint: ${ctaUrl}\n` : ''}
---
CampusFix College Complaint Management System
Automated notification. Please do not reply directly to this email.
`.trim();

    const contentHtml = `
      <p style="margin: 0 0 16px 0; font-size: 15px; font-weight: 600; color: #102A43;">
        ${formatStudentGreeting(complaint.studentName)}
      </p>

      <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 700; color: #102A43;">Complaint Assigned for Resolution</h2>
      <p style="margin: 0 0 24px 0; font-size: 14px; color: #486581; line-height: 1.5;">
        Your campus complaint has been assigned to a campus department and staff specialist for resolution.
      </p>

      <!-- Assignment Details -->
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin-bottom: 24px;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; font-weight: 600; color: #627D98; width: 34%;">Complaint ID</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 14px; font-weight: 700; color: #102A43;">${escapeHtml(complaint.complaintId)}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; font-weight: 600; color: #627D98;">Title</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 14px; font-weight: 600; color: #102A43;">${escapeHtml(complaint.title)}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; font-weight: 600; color: #627D98;">Department</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 14px; font-weight: 700; color: #102A43;">${escapeHtml(department)}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; font-weight: 600; color: #627D98;">Assigned Staff</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 14px; font-weight: 600; color: #102A43;">${escapeHtml(assignedTo)}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 13px; font-weight: 600; color: #627D98;">Status</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #F1F5F9; font-size: 14px;">
            <span style="display: inline-block; padding: 3px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; background-color: ${currentStatusBadge.bg}; color: ${currentStatusBadge.text}; border: 1px solid ${currentStatusBadge.border}; text-transform: uppercase;">
              Status: ${escapeHtml(complaint.status)}
            </span>
          </td>
        </tr>
      </table>

      ${remark ? `
      <!-- Remarks Box -->
      <div style="margin-bottom: 20px;">
        <div style="font-size: 12px; font-weight: 700; color: #486581; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 6px;">Assignment Remarks</div>
        <div style="background-color: #F8FAFC; border-left: 4px solid #102A43; border-radius: 4px; padding: 14px 18px; font-size: 14px; color: #102A43; line-height: 1.6;">
          ${escapeHtml(remark)}
        </div>
      </div>
      ` : ''}

      ${renderCtaButton(ctaUrl, 'View My Complaint')}
`.trim();

    const htmlBody = wrapEmailLayout(subject, contentHtml);
    return this.sendEmail([studentEmail], subject, textBody, htmlBody);
  }
}

export const defaultNotificationService = new SESNotificationService();
