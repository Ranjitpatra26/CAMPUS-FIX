export type UserRole = 'student' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  studentId?: string;
  department: string;
  avatar?: string;
  joinedDate?: string;
}

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
  timestamp: string; // ISO string
  actor: {
    id: string;
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
  id: string; // e.g. "CMP-1001"
  title: string;
  description: string;
  category: ComplaintCategory;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  location: string; // Building / Room / Area
  department?: DepartmentName;
  studentId: string;
  studentName: string;
  studentEmail: string;
  studentDepartment: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  statusHistory: StatusHistoryEntry[];
  adminRemarks?: string;
  assignedTo?: string; // staff/admin name
  resolvedAt?: string;
  attachment?: AttachmentPlaceholder;
}

export interface DepartmentInfo {
  id: string;
  name: DepartmentName;
  headName: string;
  email: string;
  openTickets: number;
  resolvedTickets: number;
  slaHours: number;
  location: string;
}

export interface CreateComplaintInput {
  title: string;
  category: ComplaintCategory;
  description: string;
  priority: ComplaintPriority;
  location: string;
  department?: DepartmentName;
  attachment?: AttachmentPlaceholder;
}

export interface ComplaintFilterOptions {
  search?: string;
  status?: ComplaintStatus | 'All';
  priority?: ComplaintPriority | 'All';
  category?: ComplaintCategory | 'All';
  department?: DepartmentName | 'All';
  sortBy?: 'newest' | 'oldest' | 'priority' | 'status';
}

export type NotificationType =
  | 'ticket_update'
  | 'system'
  | 'assignment'
  | 'submission';

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: NotificationType;
  ticketId?: string;
  createdAt?: string;
  isDismissed?: boolean;
}
