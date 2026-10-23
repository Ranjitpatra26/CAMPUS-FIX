import { Complaint } from '../types';
import {
  AnalyticsSummary,
  formatHours,
  formatPercentage,
  getResolutionDurationHours
} from './analytics';

/**
 * Escapes a cell value strictly conforming to RFC 4180 with robust formula injection protection.
 * 
 * Rules:
 * 1. Convert null / undefined to empty string.
 * 2. Sanitize against spreadsheet formula injection (CWE-1236 / CSV Injection):
 *    If the text begins with '=', '+', '-', '@', '\t', or '\r', prefix with a single quote (').
 * 3. Enclose formula-sanitized strings or strings with commas, quotes, and newlines in double quotes,
 *    and escape internal quotes by doubling ("").
 */
export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  let str = String(value);

  // Guard against CSV / Formula Injection
  const firstChar = str.charAt(0);
  const isFormulaTrigger = (
    firstChar === '=' ||
    firstChar === '+' ||
    firstChar === '-' ||
    firstChar === '@' ||
    firstChar === '\t' ||
    firstChar === '\r'
  );

  if (isFormulaTrigger) {
    str = `'${str}`;
  }

  // RFC 4180 escaping for quotes, commas, line breaks, or formula-sanitized cells
  if (
    isFormulaTrigger ||
    str.includes(',') ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r')
  ) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Converts a 2D array of rows into an RFC 4180 CSV string.
 */
export function toCsvString(rows: (string | number | boolean | null | undefined)[][]): string {
  return rows.map(row => row.map(escapeCsvCell).join(',')).join('\r\n');
}

/**
 * Generates the Executive Analytics Summary CSV string.
 * Includes:
 * - Report Metadata & Timestamp
 * - Overall KPIs (Total, Resolved, Velocity, Triage, Critical)
 * - Status Distribution
 * - Department-Wise Performance & Available SLA Compliance
 * - Monthly Intake Trends
 * - Staff Workload & Turnaround
 * 
 * Excludes all student PII and confidential descriptions.
 */
export function generateAnalyticsSummaryCsv(
  summary: AnalyticsSummary,
  generatedAt: Date = new Date()
): string {
  const timestampIso = generatedAt.toISOString();
  const rows: (string | number | null | undefined)[][] = [];

  // Report Header
  rows.push(['CAMPUSFIX EXECUTIVE ANALYTICS REPORT']);
  rows.push(['Generated At (UTC)', timestampIso]);
  rows.push(['Scope', 'Campus-Wide Complaint Analytics & SLA Velocity']);
  rows.push(['Confidentiality', 'Strictly Internal - Campus Administration Only']);
  rows.push([]);

  // Section 1: Executive KPIs
  rows.push(['--- SECTION 1: KEY PERFORMANCE INDICATORS ---']);
  rows.push(['Metric', 'Value', 'Context / Description']);
  rows.push(['Total Incidents Logged', summary.totalComplaints, 'All-time central incident register volume']);
  rows.push([
    'Overall Resolution Rate',
    formatPercentage(summary.overallResolutionRate),
    `${summary.statusCounts.Resolved} of ${summary.totalComplaints} tickets completed`
  ]);
  rows.push([
    'Average Resolution Velocity',
    formatHours(summary.averageResolutionHours),
    summary.averageResolutionHours !== null
      ? 'Calculated from valid resolved timestamps'
      : 'No resolved tickets with valid timestamps'
  ]);
  rows.push([
    'Median Resolution Velocity',
    formatHours(summary.medianResolutionHours),
    summary.medianResolutionHours !== null
      ? 'Median turnaround for completed tickets'
      : 'No resolved tickets with valid timestamps'
  ]);
  rows.push([
    'Average Triage SLA',
    formatHours(summary.averageTriageHours),
    summary.averageTriageHours !== null
      ? 'Time from submission to department assignment'
      : 'No assignment history recorded'
  ]);
  rows.push(['Critical Priority Incidents', summary.criticalCount, 'Urgent health, safety, and infrastructure tickets']);
  rows.push([]);

  // Section 2: Status Distribution
  rows.push(['--- SECTION 2: WORKFLOW STATUS DISTRIBUTION ---']);
  rows.push(['Status', 'Ticket Count', 'Percentage of Total Volume']);
  const statuses = ['Submitted', 'Assigned', 'In Progress', 'Resolved', 'Rejected'] as const;
  for (const st of statuses) {
    const count = summary.statusCounts[st];
    const pct = summary.totalComplaints > 0 ? Math.round((count / summary.totalComplaints) * 100) : 0;
    rows.push([st, count, `${pct}%`]);
  }
  rows.push([]);

  // Section 3: Department Breakdown & SLA Compliance
  rows.push(['--- SECTION 3: DEPARTMENTAL VOLUME & SLA COMPLIANCE ---']);
  rows.push([
    'Department',
    'Total Volume',
    'Submitted',
    'Assigned',
    'In Progress',
    'Resolved',
    'Rejected',
    'Resolution Rate',
    'Campus Share',
    'Avg Turnaround',
    'Target SLA',
    'SLA Compliance Rate'
  ]);
  for (const dept of summary.departmentDistribution) {
    rows.push([
      dept.department,
      dept.total,
      dept.submitted,
      dept.assigned,
      dept.inProgress,
      dept.resolved,
      dept.rejected,
      `${dept.resolutionRate}%`,
      `${dept.percentageOfTotal}%`,
      formatHours(dept.averageResolutionHours),
      dept.targetSlaHours !== null ? `${dept.targetSlaHours}h` : 'N/A',
      dept.slaComplianceRate !== null ? `${dept.slaComplianceRate}%` : 'N/A'
    ]);
  }
  rows.push([]);

  // Section 4: Monthly Submission Trends
  rows.push(['--- SECTION 4: MONTHLY INTAKE & BACKLOG TRENDS ---']);
  rows.push(['Month Key', 'Month Label', 'Total Logged', 'Resolved Count', 'Critical Count']);
  if (summary.monthlyTrends.length === 0) {
    rows.push(['N/A', 'No monthly data', 0, 0, 0]);
  } else {
    for (const m of summary.monthlyTrends) {
      rows.push([m.monthKey, m.label, m.total, m.resolved, m.critical]);
    }
  }
  rows.push([]);

  // Section 5: Staff Workload & Performance
  rows.push(['--- SECTION 5: STAFF WORKLOAD & RESOLUTION VELOCITY ---']);
  rows.push(['Staff Handler', 'Active Caseload', 'Resolved Tickets', 'Total Managed', 'Avg Turnaround']);
  if (summary.staffWorkload.length === 0) {
    rows.push(['N/A', 0, 0, 0, 'N/A']);
  } else {
    for (const staff of summary.staffWorkload) {
      rows.push([
        staff.staffName,
        staff.activeTickets,
        staff.resolvedTickets,
        staff.totalTickets,
        formatHours(staff.averageResolutionHours)
      ]);
    }
  }

  return toCsvString(rows);
}

/**
 * Generates the Sanitized Complaint Register CSV string.
 * 
 * Projected columns:
 * - Complaint ID
 * - Title
 * - Department
 * - Category
 * - Priority
 * - Status
 * - Created timestamp
 * - Resolved timestamp
 * - Resolution duration (hours)
 * - Assigned staff
 * 
 * Strictly excludes: studentEmail, studentId, studentName, studentDepartment, description.
 */
export function generateComplaintRegisterCsv(complaints: Complaint[]): string {
  const rows: (string | number | null | undefined)[][] = [];

  rows.push([
    'Complaint ID',
    'Title',
    'Department',
    'Category',
    'Priority',
    'Status',
    'Created At (UTC)',
    'Resolved At (UTC)',
    'Resolution Duration (Hours)',
    'Assigned Staff'
  ]);

  for (const c of complaints) {
    const duration = getResolutionDurationHours(c);
    const durationStr = duration !== null ? duration.toFixed(1) : 'N/A';

    let resolvedTimestamp = '';
    if (c.status === 'Resolved') {
      if (c.resolvedAt) {
        resolvedTimestamp = c.resolvedAt;
      } else if (Array.isArray(c.statusHistory)) {
        const hist = [...c.statusHistory].reverse().find(h => h.newStatus === 'Resolved');
        resolvedTimestamp = hist?.timestamp || '';
      }
    }

    rows.push([
      c.id,
      c.title,
      c.department || 'Unassigned',
      c.category,
      c.priority,
      c.status,
      c.createdAt,
      resolvedTimestamp || 'N/A',
      durationStr,
      c.assignedTo || 'Unassigned'
    ]);
  }

  return toCsvString(rows);
}

/**
 * Triggers native CSV file download in the browser with UTF-8 BOM.
 */
export function downloadCsvFile(csvContent: string, filename: string): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return;
  }

  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = (window.URL || URL).createObjectURL(blob);
  const link = document.createElement('a');

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  (window.URL || URL).revokeObjectURL(url);
}

/**
 * Triggers browser print-to-PDF dialogue.
 */
export function triggerPrintReport(): void {
  if (typeof window !== 'undefined' && typeof window.print === 'function') {
    window.print();
  }
}
