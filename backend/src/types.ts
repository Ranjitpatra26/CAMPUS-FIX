export type UserRole = 'student' | 'admin';

export type ComplaintStatus =
  | 'Submitted'
  | 'Assigned'
  | 'In Progress'
  | 'Resolved'
  | 'Rejected';

export type ComplaintPriority =
  | 'Low'
  | 'Medium'
  | 'High'
  | 'Critical';

export type ComplaintCategory =
  | 'IT and Wi-Fi'
  | 'Laboratory Equipment'
  | 'Electrical Maintenance'
  | 'Classroom Facilities'
  | 'Sanitation'
  | 'Administration'
  | 'Fees and Accounts'
  | 'Other';

export type DepartmentName =
  | 'IT Services'
  | 'Campus Maintenance'
  | 'Electrical Works'
  | 'Classroom Support'
  | 'Sanitation & Health'
  | 'Academic Affairs'
  | 'Finance & Accounts'
  | 'General Administration';

export interface StatusHistoryEntry {
  id: string;
  previousStatus: ComplaintStatus | null;
  newStatus: ComplaintStatus;
  timestamp: string; // ISO 8601 UTC
  actor: {
    id: string; // Cognito sub
    name: string;
    role: UserRole;
  };
  remark?: string;
}

export interface AttachmentPlaceholder {
  id: string;
  name: string;
  size: string;
  type: string;
}

export interface Complaint {
  complaintId: string; // Partition Key (e.g. "CMP-20261023-4819")
  entityType: 'COMPLAINT'; // Static partition key for Admin GSI
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  location: string;
  department?: DepartmentName;
  studentId: string; // Cognito sub (GSI partition key)
  studentName: string;
  studentEmail: string;
  studentDepartment?: string;
  createdAt: string; // ISO 8601 UTC (GSI sort key)
  updatedAt: string; // ISO 8601 UTC
  statusHistory: StatusHistoryEntry[];
  adminRemarks?: string;
  assignedTo?: string;
  resolvedAt?: string | null;
  attachment?: AttachmentPlaceholder | null;
}

export interface CreateComplaintInput {
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  location: string;
  department?: DepartmentName;
  studentDepartment?: string;
  attachment?: AttachmentPlaceholder | null;
}

export interface UpdateStatusInput {
  newStatus: ComplaintStatus;
  remark?: string;
}

export interface AssignComplaintInput {
  department: DepartmentName;
  assignedTo: string;
  remark?: string;
}

export interface ComplaintFilterOptions {
  status?: ComplaintStatus | 'All';
  priority?: ComplaintPriority | 'All';
  category?: ComplaintCategory | 'All';
  department?: DepartmentName | 'All';
  limit?: number;
  nextToken?: string;
}

export interface AuthUser {
  sub: string;
  email: string;
  name: string;
  groups: string[];
  isAdmin: boolean;
}
