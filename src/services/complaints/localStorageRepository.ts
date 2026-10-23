import {
  Complaint,
  ComplaintFilterOptions,
  ComplaintStatus,
  CreateComplaintInput,
  DepartmentName,
  StatusHistoryEntry,
  User
} from '../../types';
import { INITIAL_COMPLAINTS } from '../mock-data/initialComplaints';
import {
  IComplaintRepository,
  ComplaintStatistics,
  isValidStatusTransition
} from './complaintRepository';

const STORAGE_KEY = 'campusfix_mock_complaints_v1';

export class LocalStorageComplaintRepository implements IComplaintRepository {
  private inMemoryComplaints: Complaint[] | null = null;

  private loadComplaints(): Complaint[] {
    if (this.inMemoryComplaints !== null) {
      return this.inMemoryComplaints;
    }

    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            this.inMemoryComplaints = parsed;
            return parsed;
          }
        }
      }
    } catch (e) {
      console.warn('Could not read from localStorage, using memory storage', e);
    }

    // Default seed
    this.inMemoryComplaints = [...INITIAL_COMPLAINTS];
    this.saveComplaints(this.inMemoryComplaints);
    return this.inMemoryComplaints;
  }

  private saveComplaints(complaints: Complaint[]): void {
    this.inMemoryComplaints = complaints;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
      }
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
  }

  private applyFilters(complaints: Complaint[], filters?: ComplaintFilterOptions): Complaint[] {
    if (!filters) return complaints;

    let result = [...complaints];

    if (filters.search && filters.search.trim() !== '') {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        c =>
          c.id.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.studentName.toLowerCase().includes(q) ||
          (c.department && c.department.toLowerCase().includes(q))
      );
    }

    if (filters.status && filters.status !== 'All') {
      result = result.filter(c => c.status === filters.status);
    }

    if (filters.priority && filters.priority !== 'All') {
      result = result.filter(c => c.priority === filters.priority);
    }

    if (filters.category && filters.category !== 'All') {
      result = result.filter(c => c.category === filters.category);
    }

    if (filters.department && filters.department !== 'All') {
      result = result.filter(c => c.department === filters.department);
    }

    if (filters.sortBy) {
      if (filters.sortBy === 'newest') {
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else if (filters.sortBy === 'oldest') {
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      } else if (filters.sortBy === 'priority') {
        const priorityWeight = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        result.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
      } else if (filters.sortBy === 'status') {
        result.sort((a, b) => a.status.localeCompare(b.status));
      }
    } else {
      // Default: newest first
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }

  async getAllComplaints(filters?: ComplaintFilterOptions): Promise<Complaint[]> {
    const list = this.loadComplaints();
    return this.applyFilters(list, filters);
  }

  async getMyComplaints(studentId: string, filters?: ComplaintFilterOptions): Promise<Complaint[]> {
    const list = this.loadComplaints().filter(c => c.studentId === studentId);
    return this.applyFilters(list, filters);
  }

  async getComplaintById(id: string): Promise<Complaint | null> {
    const list = this.loadComplaints();
    const found = list.find(c => c.id.toLowerCase() === id.toLowerCase());
    return found ? { ...found } : null;
  }

  async createComplaint(input: CreateComplaintInput, student: User): Promise<Complaint> {
    if (!input.title || input.title.trim().length < 5 || input.title.trim().length > 120) {
      throw new Error('Validation failed: Complaint title must be between 5 and 120 characters.');
    }
    if (!input.description || input.description.trim().length < 20 || input.description.trim().length > 1500) {
      throw new Error('Validation failed: Complaint description must be between 20 and 1500 characters.');
    }
    if (!input.location || input.location.trim().length < 2 || input.location.trim().length > 100) {
      throw new Error('Validation failed: Complaint location must be between 2 and 100 characters.');
    }

    const list = this.loadComplaints();
    
    // Generate next ticket ID: CMP-XXXX
    let nextNum = 1001;
    list.forEach(c => {
      const match = c.id.match(/CMP-(\d+)/);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n >= nextNum) nextNum = n + 1;
      }
    });

    const newId = `CMP-${nextNum}`;
    const now = new Date().toISOString();

    const initialHistory: StatusHistoryEntry = {
      id: `hist-${Date.now()}-1`,
      previousStatus: null,
      newStatus: 'Submitted',
      timestamp: now,
      actor: {
        id: student.id,
        name: student.name,
        role: student.role
      },
      remark: 'Ticket created and registered in system queue.'
    };

    const newComplaint: Complaint = {
      id: newId,
      title: input.title.trim(),
      description: input.description.trim(),
      category: input.category,
      priority: input.priority,
      status: 'Submitted',
      location: input.location.trim(),
      department: input.department,
      studentId: student.id,
      studentName: student.name,
      studentEmail: student.email,
      studentDepartment: student.department,
      createdAt: now,
      updatedAt: now,
      statusHistory: [initialHistory],
      attachment: input.attachment
    };

    const updatedList = [newComplaint, ...list];
    this.saveComplaints(updatedList);
    return newComplaint;
  }

  async updateComplaintStatus(
    id: string,
    newStatus: ComplaintStatus,
    actor: User,
    remark?: string
  ): Promise<Complaint> {
    if (actor.role !== 'admin') {
      throw new Error('Unauthorized: Only administrators can update complaint status.');
    }

    const list = this.loadComplaints();
    const index = list.findIndex(c => c.id.toLowerCase() === id.toLowerCase());
    if (index === -1) {
      throw new Error(`Complaint with ID ${id} not found.`);
    }

    const current = list[index];
    if (!isValidStatusTransition(current.status, newStatus)) {
      throw new Error(
        `Invalid status transition from "${current.status}" to "${newStatus}".`
      );
    }

    if (newStatus === 'Rejected' && (!remark || remark.trim() === '')) {
      throw new Error('Administrative rejection requires a detailed explanation remark.');
    }

    const now = new Date().toISOString();
    const historyEntry: StatusHistoryEntry = {
      id: `hist-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      previousStatus: current.status,
      newStatus,
      timestamp: now,
      actor: {
        id: actor.id,
        name: actor.name,
        role: actor.role
      },
      remark: remark?.trim()
    };

    const updatedComplaint: Complaint = {
      ...current,
      status: newStatus,
      updatedAt: now,
      statusHistory: [...current.statusHistory, historyEntry],
      adminRemarks: remark?.trim() || current.adminRemarks,
      resolvedAt: newStatus === 'Resolved' ? now : current.resolvedAt
    };

    list[index] = updatedComplaint;
    this.saveComplaints([...list]);
    return updatedComplaint;
  }

  async assignComplaint(
    id: string,
    department: DepartmentName,
    assignedTo: string,
    actor: User,
    remark?: string
  ): Promise<Complaint> {
    if (actor.role !== 'admin') {
      throw new Error('Unauthorized: Only administrators can assign departments.');
    }

    const list = this.loadComplaints();
    const index = list.findIndex(c => c.id.toLowerCase() === id.toLowerCase());
    if (index === -1) {
      throw new Error(`Complaint with ID ${id} not found.`);
    }

    const current = list[index];
    const now = new Date().toISOString();
    
    // If currently 'Submitted', assignment transitions it to 'Assigned'
    let nextStatus: ComplaintStatus = current.status;
    const historyUpdates: StatusHistoryEntry[] = [];

    if (current.status === 'Submitted') {
      nextStatus = 'Assigned';
      historyUpdates.push({
        id: `hist-${Date.now()}-assign`,
        previousStatus: 'Submitted',
        newStatus: 'Assigned',
        timestamp: now,
        actor: {
          id: actor.id,
          name: actor.name,
          role: actor.role
        },
        remark: remark?.trim() || `Assigned to ${department} (${assignedTo})`
      });
    }

    const updatedComplaint: Complaint = {
      ...current,
      department,
      assignedTo,
      status: nextStatus,
      updatedAt: now,
      statusHistory: [...current.statusHistory, ...historyUpdates],
      adminRemarks: remark?.trim() || current.adminRemarks
    };

    list[index] = updatedComplaint;
    this.saveComplaints([...list]);
    return updatedComplaint;
  }

  async addAdministratorRemark(id: string, remark: string, actor: User): Promise<Complaint> {
    if (actor.role !== 'admin') {
      throw new Error('Unauthorized: Only administrators can add administrative remarks.');
    }

    const list = this.loadComplaints();
    const index = list.findIndex(c => c.id.toLowerCase() === id.toLowerCase());
    if (index === -1) {
      throw new Error(`Complaint with ID ${id} not found.`);
    }

    const current = list[index];
    const now = new Date().toISOString();

    const updatedComplaint: Complaint = {
      ...current,
      adminRemarks: remark.trim(),
      updatedAt: now
    };

    list[index] = updatedComplaint;
    this.saveComplaints([...list]);
    return updatedComplaint;
  }

  async resetToDefaults(): Promise<void> {
    this.inMemoryComplaints = [...INITIAL_COMPLAINTS];
    this.saveComplaints(this.inMemoryComplaints);
  }

  async getStatistics(studentId?: string): Promise<ComplaintStatistics> {
    const list = this.loadComplaints();
    const filtered = studentId ? list.filter(c => c.studentId === studentId) : list;

    return {
      total: filtered.length,
      submitted: filtered.filter(c => c.status === 'Submitted').length,
      assigned: filtered.filter(c => c.status === 'Assigned').length,
      inProgress: filtered.filter(c => c.status === 'In Progress').length,
      resolved: filtered.filter(c => c.status === 'Resolved').length,
      rejected: filtered.filter(c => c.status === 'Rejected').length,
      critical: filtered.filter(c => c.priority === 'Critical').length
    };
  }
}

import { ApiComplaintRepository } from './apiComplaintRepository';

export class CompositeComplaintRepository implements IComplaintRepository {
  private localRepo: LocalStorageComplaintRepository;
  private apiRepo: ApiComplaintRepository;
  private mockOverride?: boolean;

  constructor(options?: { mockEnabled?: boolean; apiBaseUrl?: string }) {
    this.localRepo = new LocalStorageComplaintRepository();
    this.apiRepo = new ApiComplaintRepository(options?.apiBaseUrl);
    this.mockOverride = options?.mockEnabled;
  }

  isMockEnabled(): boolean {
    if (this.mockOverride !== undefined) {
      return this.mockOverride;
    }
    if (import.meta.env.PROD) {
      return false;
    }
    const raw = import.meta.env.VITE_ENABLE_MOCK_AUTH;
    return raw !== 'false' && raw !== false;
  }

  public getApiRepo(): ApiComplaintRepository {
    return this.apiRepo;
  }

  public getLocalRepo(): LocalStorageComplaintRepository {
    return this.localRepo;
  }

  private getActiveRepo(): IComplaintRepository {
    if (this.isMockEnabled()) {
      return this.localRepo;
    }
    return this.apiRepo;
  }

  async getAllComplaints(filters?: ComplaintFilterOptions): Promise<Complaint[]> {
    return this.getActiveRepo().getAllComplaints(filters);
  }

  async getMyComplaints(studentId: string, filters?: ComplaintFilterOptions): Promise<Complaint[]> {
    return this.getActiveRepo().getMyComplaints(studentId, filters);
  }

  async getComplaintById(id: string): Promise<Complaint | null> {
    return this.getActiveRepo().getComplaintById(id);
  }

  async createComplaint(input: CreateComplaintInput, student: User): Promise<Complaint> {
    // When mock is disabled (cloud mode), this calls ApiComplaintRepository.
    // If the API / DynamoDB request fails, the error is thrown directly to the caller.
    // It NEVER silently falls back to localStorage.
    return this.getActiveRepo().createComplaint(input, student);
  }

  async updateComplaintStatus(
    id: string,
    newStatus: ComplaintStatus,
    actor: User,
    remark?: string
  ): Promise<Complaint> {
    return this.getActiveRepo().updateComplaintStatus(id, newStatus, actor, remark);
  }

  async assignComplaint(
    id: string,
    department: DepartmentName,
    assignedTo: string,
    actor: User,
    remark?: string
  ): Promise<Complaint> {
    return this.getActiveRepo().assignComplaint(id, department, assignedTo, actor, remark);
  }

  async addAdministratorRemark(id: string, remark: string, actor: User): Promise<Complaint> {
    return this.getActiveRepo().addAdministratorRemark(id, remark, actor);
  }

  async resetToDefaults(): Promise<void> {
    return this.getActiveRepo().resetToDefaults();
  }

  async getStatistics(studentId?: string): Promise<ComplaintStatistics> {
    return this.getActiveRepo().getStatistics(studentId);
  }
}

// Master repository instance routing to DynamoDB/Lambda in cloud mode and LocalStorage in mock mode
export const complaintRepository = new CompositeComplaintRepository();
