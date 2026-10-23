import {
  ComplaintCategory,
  ComplaintPriority,
  ComplaintStatus,
  CreateComplaintInput,
  DepartmentName,
  UpdateStatusInput,
  AssignComplaintInput
} from './types.js';
import { BadRequestError } from './errors.js';

export const VALID_CATEGORIES: ComplaintCategory[] = [
  'IT and Wi-Fi',
  'Laboratory Equipment',
  'Electrical Maintenance',
  'Classroom Facilities',
  'Sanitation',
  'Administration',
  'Fees and Accounts',
  'Other'
];

export const VALID_PRIORITIES: ComplaintPriority[] = [
  'Low',
  'Medium',
  'High',
  'Critical'
];

export const VALID_DEPARTMENTS: DepartmentName[] = [
  'IT Services',
  'Campus Maintenance',
  'Electrical Works',
  'Classroom Support',
  'Sanitation & Health',
  'Academic Affairs',
  'Finance & Accounts',
  'General Administration'
];

export const VALID_STATUSES: ComplaintStatus[] = [
  'Submitted',
  'Assigned',
  'In Progress',
  'Resolved',
  'Rejected'
];

export const ALLOWED_TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  Submitted: ['Assigned', 'In Progress', 'Rejected'],
  Assigned: ['In Progress', 'Resolved', 'Rejected'],
  'In Progress': ['Resolved', 'Rejected'],
  Resolved: ['In Progress'], // Re-open
  Rejected: ['Assigned', 'In Progress'] // Admin reconsider
};

export function isValidStatusTransition(current: ComplaintStatus, next: ComplaintStatus): boolean {
  if (current === next) return true;
  const allowed = ALLOWED_TRANSITIONS[current] || [];
  return allowed.includes(next);
}

export function validateCreateComplaintInput(body: unknown): CreateComplaintInput {
  if (!body || typeof body !== 'object') {
    throw new BadRequestError('Request body must be a valid JSON object.');
  }

  const input = body as Record<string, unknown>;

  const title = typeof input.title === 'string' ? input.title.trim() : '';
  if (title.length < 5 || title.length > 120) {
    throw new BadRequestError('Complaint title must be between 5 and 120 characters.');
  }

  const description = typeof input.description === 'string' ? input.description.trim() : '';
  if (description.length < 20 || description.length > 1500) {
    throw new BadRequestError('Complaint description must be between 20 and 1500 characters.');
  }

  const location = typeof input.location === 'string' ? input.location.trim() : '';
  if (location.length < 2 || location.length > 100) {
    throw new BadRequestError('Complaint location must be between 2 and 100 characters.');
  }

  const category = input.category as ComplaintCategory;
  if (!VALID_CATEGORIES.includes(category)) {
    throw new BadRequestError(
      `Invalid category "${input.category}". Allowed categories: ${VALID_CATEGORIES.join(', ')}.`
    );
  }

  const priority = input.priority as ComplaintPriority;
  if (!VALID_PRIORITIES.includes(priority)) {
    throw new BadRequestError(
      `Invalid priority "${input.priority}". Allowed priorities: ${VALID_PRIORITIES.join(', ')}.`
    );
  }

  let department: DepartmentName | undefined = undefined;
  if (input.department !== undefined && input.department !== null && input.department !== '') {
    if (!VALID_DEPARTMENTS.includes(input.department as DepartmentName)) {
      throw new BadRequestError(
        `Invalid department "${input.department}". Allowed departments: ${VALID_DEPARTMENTS.join(', ')}.`
      );
    }
    department = input.department as DepartmentName;
  }

  let studentDepartment: string | undefined = undefined;
  if (input.studentDepartment !== undefined && input.studentDepartment !== null && input.studentDepartment !== '') {
    if (typeof input.studentDepartment !== 'string' || input.studentDepartment.trim().length > 80) {
      throw new BadRequestError('Field "studentDepartment" must not exceed 80 characters.');
    }
    studentDepartment = input.studentDepartment.trim();
  }

  return {
    title,
    description,
    location,
    category,
    priority,
    department,
    studentDepartment,
    attachment: null
  };
}

export function validateUpdateStatusInput(body: unknown, currentStatus: ComplaintStatus): UpdateStatusInput {
  if (!body || typeof body !== 'object') {
    throw new BadRequestError('Request body must be a valid JSON object.');
  }

  const input = body as Record<string, unknown>;
  const newStatus = input.newStatus as ComplaintStatus;

  if (!VALID_STATUSES.includes(newStatus)) {
    throw new BadRequestError(
      `Invalid status "${input.newStatus}". Allowed statuses: ${VALID_STATUSES.join(', ')}.`
    );
  }

  if (!isValidStatusTransition(currentStatus, newStatus)) {
    throw new BadRequestError(
      `Invalid status transition from "${currentStatus}" to "${newStatus}".`
    );
  }

  const remark = typeof input.remark === 'string' ? input.remark.trim() : undefined;

  if (remark && remark.length > 1000) {
    throw new BadRequestError('Field "remark" must not exceed 1000 characters.');
  }

  if (newStatus === 'Rejected' && (!remark || remark.length < 5)) {
    throw new BadRequestError('Administrative rejection requires an explanation remark of at least 5 characters.');
  }

  return {
    newStatus,
    remark
  };
}

export function validateAssignComplaintInput(body: unknown): AssignComplaintInput {
  if (!body || typeof body !== 'object') {
    throw new BadRequestError('Request body must be a valid JSON object.');
  }

  const input = body as Record<string, unknown>;

  const department = input.department as DepartmentName;
  if (!VALID_DEPARTMENTS.includes(department)) {
    throw new BadRequestError(
      `Invalid department "${input.department}". Allowed departments: ${VALID_DEPARTMENTS.join(', ')}.`
    );
  }

  const assignedTo = typeof input.assignedTo === 'string' ? input.assignedTo.trim() : '';
  if (assignedTo.length < 2 || assignedTo.length > 80) {
    throw new BadRequestError('Field "assignedTo" must be a valid assignee name between 2 and 80 characters.');
  }

  const remark = typeof input.remark === 'string' ? input.remark.trim() : undefined;
  if (remark && remark.length > 1000) {
    throw new BadRequestError('Field "remark" must not exceed 1000 characters.');
  }

  return {
    department,
    assignedTo,
    remark
  };
}
