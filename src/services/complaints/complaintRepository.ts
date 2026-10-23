import {
  Complaint,
  ComplaintStatus,
  ComplaintFilterOptions,
  CreateComplaintInput,
  DepartmentName,
  User
} from '../../types';

export interface ComplaintStatistics {
  total: number;
  submitted: number;
  assigned: number;
  inProgress: number;
  resolved: number;
  rejected: number;
  critical: number;
}

export interface IComplaintRepository {
  getAllComplaints(filters?: ComplaintFilterOptions): Promise<Complaint[]>;
  getAnalyticsComplaints(filters?: ComplaintFilterOptions): Promise<Complaint[]>;
  getMyComplaints(studentId: string, filters?: ComplaintFilterOptions): Promise<Complaint[]>;
  getComplaintById(id: string): Promise<Complaint | null>;
  createComplaint(input: CreateComplaintInput, student: User): Promise<Complaint>;
  updateComplaintStatus(
    id: string,
    newStatus: ComplaintStatus,
    actor: User,
    remark?: string
  ): Promise<Complaint>;
  assignComplaint(
    id: string,
    department: DepartmentName,
    assignedTo: string,
    actor: User,
    remark?: string
  ): Promise<Complaint>;
  addAdministratorRemark(id: string, remark: string, actor: User): Promise<Complaint>;
  resetToDefaults(): Promise<void>;
  getStatistics(studentId?: string): Promise<ComplaintStatistics>;
}

// Business Rules & Status Transition Validation
export const ALLOWED_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  Submitted: ['Assigned', 'In Progress', 'Rejected'],
  Assigned: ['In Progress', 'Resolved', 'Rejected'],
  'In Progress': ['Resolved', 'Rejected'],
  Resolved: ['In Progress'], // Re-open if problem recurs
  Rejected: ['Assigned', 'In Progress'] // Admin reconsider
};

export function isValidStatusTransition(current: ComplaintStatus, next: ComplaintStatus): boolean {
  if (current === next) return true;
  const allowed = ALLOWED_TRANSITIONS[current] || [];
  return allowed.includes(next);
}
