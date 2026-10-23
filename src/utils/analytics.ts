import {
  Complaint,
  ComplaintStatus,
  DepartmentName,
  DepartmentInfo
} from '../types';
import { INITIAL_DEPARTMENTS } from '../services/mock-data/departments';

export interface StatusCounts {
  Submitted: number;
  Assigned: number;
  'In Progress': number;
  Resolved: number;
  Rejected: number;
}

export interface DepartmentMetric {
  department: DepartmentName | 'Unassigned';
  total: number;
  submitted: number;
  assigned: number;
  inProgress: number;
  resolved: number;
  rejected: number;
  critical: number;
  resolutionRate: number; // 0 to 100
  percentageOfTotal: number; // 0 to 100
  averageResolutionHours: number | null; // null if no valid resolved tickets
  targetSlaHours: number | null; // null if not configured
  slaComplianceRate: number | null; // null if no target SLA or no valid resolved tickets
}

export interface MonthlyTrendMetric {
  monthKey: string; // "YYYY-MM"
  label: string; // e.g. "Oct 2026"
  total: number;
  resolved: number;
  critical: number;
}

export interface StaffWorkloadMetric {
  staffName: string; // e.g. "Vikram Mehta" or "Unassigned"
  totalTickets: number;
  activeTickets: number; // Assigned or In Progress
  resolvedTickets: number; // Resolved
  averageResolutionHours: number | null; // null if no resolved tickets with valid time
}

export interface DepartmentSlaHealth {
  department: DepartmentName;
  targetSlaHours: number;
  resolvedCount: number;
  withinSlaCount: number;
  complianceRate: number | null; // null if 0 valid resolved tickets
  averageResolutionHours: number | null;
}

export interface AnalyticsSummary {
  totalComplaints: number;
  statusCounts: StatusCounts;
  overallResolutionRate: number; // percentage (0 - 100)
  criticalCount: number;

  // Timing metrics (in hours, null if unavailable)
  averageResolutionHours: number | null;
  medianResolutionHours: number | null;
  averageTriageHours: number | null;

  // Granular distributions
  departmentDistribution: DepartmentMetric[];
  monthlyTrends: MonthlyTrendMetric[];
  staffWorkload: StaffWorkloadMetric[];
  departmentSlaHealth: DepartmentSlaHealth[];
}

/**
 * Extracts a reliable resolution duration (in hours) for a complaint.
 * 
 * Rules:
 * 1. Only complaints with status === 'Resolved' can have a resolution duration.
 * 2. Checks c.resolvedAt first; if missing/invalid, falls back to the latest
 *    'Resolved' entry in c.statusHistory.
 * 3. Both creation and resolution timestamps must be valid ISO dates.
 * 4. resolvedMs must be >= createdMs (rejects negative time intervals).
 * 
 * Returns duration in decimal hours, or null if unresolvable/invalid.
 */
export function getResolutionDurationHours(complaint: Complaint): number | null {
  if (complaint.status !== 'Resolved') {
    return null;
  }

  const createdMs = new Date(complaint.createdAt).getTime();
  if (Number.isNaN(createdMs)) {
    return null;
  }

  let resolvedMs: number | null = null;

  if (complaint.resolvedAt) {
    const parsed = new Date(complaint.resolvedAt).getTime();
    if (!Number.isNaN(parsed)) {
      resolvedMs = parsed;
    }
  }

  // Fallback to statusHistory if resolvedAt was not provided or was invalid
  if (resolvedMs === null && Array.isArray(complaint.statusHistory)) {
    const resolvedEntry = [...complaint.statusHistory]
      .reverse()
      .find(h => h.newStatus === 'Resolved' && h.timestamp);

    if (resolvedEntry) {
      const parsed = new Date(resolvedEntry.timestamp).getTime();
      if (!Number.isNaN(parsed)) {
        resolvedMs = parsed;
      }
    }
  }

  if (resolvedMs === null) {
    return null;
  }

  const diffMs = resolvedMs - createdMs;
  if (diffMs < 0) {
    // Clock drift or corrupt data; reject negative time interval
    return null;
  }

  return diffMs / (1000 * 60 * 60);
}

/**
 * Extracts a reliable triage duration (in hours) for a complaint.
 * 
 * Rules:
 * 1. Evaluates the duration from createdAt to the first entry in statusHistory
 *    where newStatus === 'Assigned'.
 * 2. Timestamps must be valid and assignedMs >= createdMs.
 * 
 * Returns duration in decimal hours, or null if no valid assignment history exists.
 */
export function getTriageDurationHours(complaint: Complaint): number | null {
  const createdMs = new Date(complaint.createdAt).getTime();
  if (Number.isNaN(createdMs) || !Array.isArray(complaint.statusHistory)) {
    return null;
  }

  const assignmentEntry = complaint.statusHistory.find(
    h => h.newStatus === 'Assigned' && h.timestamp
  );

  if (!assignmentEntry) {
    return null;
  }

  const assignedMs = new Date(assignmentEntry.timestamp).getTime();
  if (Number.isNaN(assignedMs)) {
    return null;
  }

  const diffMs = assignedMs - createdMs;
  if (diffMs < 0) {
    return null;
  }

  return diffMs / (1000 * 60 * 60);
}

/**
 * Helper to compute arithmetic mean of a numbers array.
 * Returns null if array is empty.
 */
function calculateMean(numbers: number[]): number | null {
  if (numbers.length === 0) return null;
  const sum = numbers.reduce((acc, val) => acc + val, 0);
  return sum / numbers.length;
}

/**
 * Helper to compute median of a numbers array.
 * Returns null if array is empty.
 */
function calculateMedian(numbers: number[]): number | null {
  if (numbers.length === 0) return null;
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

/**
 * Primary pure calculation engine for Advanced Admin Analytics.
 * 
 * @param complaints Array of complaint records from backend / repository.
 * @param departmentConfigs Optional array of configured departments with SLA targets.
 *                           Defaults to INITIAL_DEPARTMENTS.
 */
export function calculateAnalyticsSummary(
  complaints: Complaint[],
  departmentConfigs: DepartmentInfo[] = INITIAL_DEPARTMENTS
): AnalyticsSummary {
  const totalComplaints = complaints.length;

  // 1. Complaint counts by status
  const statusCounts: StatusCounts = {
    Submitted: 0,
    Assigned: 0,
    'In Progress': 0,
    Resolved: 0,
    Rejected: 0
  };

  let criticalCount = 0;
  const resolutionTimes: number[] = [];
  const triageTimes: number[] = [];

  // Map for department SLAs
  const slaMap = new Map<string, number>();
  departmentConfigs.forEach(d => {
    if (d.slaHours && d.slaHours > 0) {
      slaMap.set(d.name, d.slaHours);
    }
  });

  // Trackers for breakdowns
  const departmentMap = new Map<string, Complaint[]>();
  const monthlyMap = new Map<string, { total: number; resolved: number; critical: number }>();
  const staffMap = new Map<string, Complaint[]>();

  for (const c of complaints) {
    // Status counting
    if (statusCounts[c.status] !== undefined) {
      statusCounts[c.status]++;
    }

    if (c.priority === 'Critical') {
      criticalCount++;
    }

    // Resolution time
    const resHours = getResolutionDurationHours(c);
    if (resHours !== null) {
      resolutionTimes.push(resHours);
    }

    // Triage time
    const triageHours = getTriageDurationHours(c);
    if (triageHours !== null) {
      triageTimes.push(triageHours);
    }

    // Department grouping
    const deptKey = (c.department && c.department.trim()) ? c.department.trim() : 'Unassigned';
    const deptList = departmentMap.get(deptKey) || [];
    deptList.push(c);
    departmentMap.set(deptKey, deptList);

    // Monthly trends grouping
    const createdDate = new Date(c.createdAt);
    if (!Number.isNaN(createdDate.getTime())) {
      const year = createdDate.getUTCFullYear();
      const month = String(createdDate.getUTCMonth() + 1).padStart(2, '0');
      const monthKey = `${year}-${month}`;

      const currMonth = monthlyMap.get(monthKey) || { total: 0, resolved: 0, critical: 0 };
      currMonth.total++;
      if (c.status === 'Resolved') {
        currMonth.resolved++;
      }
      if (c.priority === 'Critical') {
        currMonth.critical++;
      }
      monthlyMap.set(monthKey, currMonth);
    }

    // Staff workload grouping
    const staffKey = (c.assignedTo && c.assignedTo.trim()) ? c.assignedTo.trim() : 'Unassigned';
    const staffList = staffMap.get(staffKey) || [];
    staffList.push(c);
    staffMap.set(staffKey, staffList);
  }

  // Overall Resolution Rate (0 if no complaints)
  const overallResolutionRate = totalComplaints > 0
    ? Math.round((statusCounts.Resolved / totalComplaints) * 100)
    : 0;

  // 2. Department-wise distribution
  const departmentDistribution: DepartmentMetric[] = [];
  departmentMap.forEach((deptComplaints, deptKey) => {
    const deptTotal = deptComplaints.length;
    const resolvedInDept = deptComplaints.filter(c => c.status === 'Resolved').length;
    const criticalInDept = deptComplaints.filter(c => c.priority === 'Critical').length;
    const submittedInDept = deptComplaints.filter(c => c.status === 'Submitted').length;
    const assignedInDept = deptComplaints.filter(c => c.status === 'Assigned').length;
    const inProgressInDept = deptComplaints.filter(c => c.status === 'In Progress').length;
    const rejectedInDept = deptComplaints.filter(c => c.status === 'Rejected').length;

    const deptResolutionTimes = deptComplaints
      .map(getResolutionDurationHours)
      .filter((h): h is number => h !== null);

    const avgRes = calculateMean(deptResolutionTimes);
    const targetSla = slaMap.get(deptKey) ?? null;

    let slaComplianceRate: number | null = null;
    if (targetSla !== null && deptResolutionTimes.length > 0) {
      const withinSlaCount = deptResolutionTimes.filter(h => h <= targetSla).length;
      slaComplianceRate = Math.round((withinSlaCount / deptResolutionTimes.length) * 100);
    }

    departmentDistribution.push({
      department: deptKey as DepartmentName | 'Unassigned',
      total: deptTotal,
      submitted: submittedInDept,
      assigned: assignedInDept,
      inProgress: inProgressInDept,
      resolved: resolvedInDept,
      rejected: rejectedInDept,
      critical: criticalInDept,
      resolutionRate: deptTotal > 0 ? Math.round((resolvedInDept / deptTotal) * 100) : 0,
      percentageOfTotal: totalComplaints > 0 ? Math.round((deptTotal / totalComplaints) * 100) : 0,
      averageResolutionHours: avgRes !== null ? Number(avgRes.toFixed(1)) : null,
      targetSlaHours: targetSla,
      slaComplianceRate
    });
  });

  // Sort department distribution: Unassigned at the end, highest volume first
  departmentDistribution.sort((a, b) => {
    if (a.department === 'Unassigned') return 1;
    if (b.department === 'Unassigned') return -1;
    return b.total - a.total;
  });

  // 3. Monthly trends (sorted chronologically)
  const sortedMonthKeys = Array.from(monthlyMap.keys()).sort();
  const monthlyTrends: MonthlyTrendMetric[] = sortedMonthKeys.map(key => {
    const [yearStr, monthStr] = key.split('-');
    const monthIndex = parseInt(monthStr, 10) - 1;
    const monthName = MONTH_NAMES[monthIndex] || monthStr;
    const label = `${monthName} ${yearStr}`;
    const data = monthlyMap.get(key)!;

    return {
      monthKey: key,
      label,
      total: data.total,
      resolved: data.resolved,
      critical: data.critical
    };
  });

  // 4. Staff Workload & Performance
  const staffWorkload: StaffWorkloadMetric[] = [];
  staffMap.forEach((staffComplaints, staffName) => {
    const totalTickets = staffComplaints.length;
    const activeTickets = staffComplaints.filter(
      c => c.status === 'Assigned' || c.status === 'In Progress'
    ).length;
    const resolvedTickets = staffComplaints.filter(c => c.status === 'Resolved').length;

    const staffResTimes = staffComplaints
      .map(getResolutionDurationHours)
      .filter((h): h is number => h !== null);

    const avgStaffRes = calculateMean(staffResTimes);

    staffWorkload.push({
      staffName,
      totalTickets,
      activeTickets,
      resolvedTickets,
      averageResolutionHours: avgStaffRes !== null ? Number(avgStaffRes.toFixed(1)) : null
    });
  });

  // Sort staff workload: active workload descending, with "Unassigned" positioned distinctly
  staffWorkload.sort((a, b) => {
    if (a.staffName === 'Unassigned') return 1;
    if (b.staffName === 'Unassigned') return -1;
    return b.activeTickets - a.activeTickets || b.totalTickets - a.totalTickets;
  });

  // 5. Department SLA Health Index
  // Evaluates only known configured departments
  const departmentSlaHealth: DepartmentSlaHealth[] = [];
  departmentConfigs.forEach(deptConfig => {
    const hasSla = Boolean(deptConfig.slaHours && deptConfig.slaHours > 0);
    const deptComplaints = departmentMap.get(deptConfig.name) || [];
    const validResTimes = deptComplaints
      .map(getResolutionDurationHours)
      .filter((h): h is number => h !== null);

    const withinSlaCount = hasSla
      ? validResTimes.filter(h => h <= deptConfig.slaHours).length
      : 0;
    const avgRes = calculateMean(validResTimes);

    departmentSlaHealth.push({
      department: deptConfig.name,
      targetSlaHours: deptConfig.slaHours || 0,
      resolvedCount: validResTimes.length,
      withinSlaCount,
      complianceRate: (hasSla && validResTimes.length > 0)
        ? Math.round((withinSlaCount / validResTimes.length) * 100)
        : null,
      averageResolutionHours: avgRes !== null ? Number(avgRes.toFixed(1)) : null
    });
  });

  // Overall timing metrics
  const avgResHours = calculateMean(resolutionTimes);
  const medianResHours = calculateMedian(resolutionTimes);
  const avgTriageHours = calculateMean(triageTimes);

  return {
    totalComplaints,
    statusCounts,
    overallResolutionRate,
    criticalCount,
    averageResolutionHours: avgResHours !== null ? Number(avgResHours.toFixed(1)) : null,
    medianResolutionHours: medianResHours !== null ? Number(medianResHours.toFixed(1)) : null,
    averageTriageHours: avgTriageHours !== null ? Number(avgTriageHours.toFixed(1)) : null,
    departmentDistribution,
    monthlyTrends,
    staffWorkload,
    departmentSlaHealth
  };
}

/**
 * Display formatter for hour intervals.
 * Distinguishes genuine zero from unavailable metrics.
 */
export function formatHours(hours: number | null | undefined): string {
  if (hours === null || hours === undefined) {
    return 'N/A';
  }
  if (hours === 0) {
    return '0.0 hrs';
  }
  if (hours < 1) {
    const mins = Math.round(hours * 60);
    return `${mins}m`;
  }
  return `${hours.toFixed(1)} hrs`;
}

/**
 * Display formatter for percentage metrics.
 */
export function formatPercentage(percentage: number | null | undefined): string {
  if (percentage === null || percentage === undefined) {
    return 'N/A';
  }
  return `${Math.round(percentage)}%`;
}
