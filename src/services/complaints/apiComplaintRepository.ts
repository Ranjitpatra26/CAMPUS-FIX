import {
  Complaint,
  ComplaintStatus,
  ComplaintFilterOptions,
  CreateComplaintInput,
  DepartmentName,
  User
} from '../../types';
import { IComplaintRepository, ComplaintStatistics } from './complaintRepository';
import { authService } from '../auth/authService';

export class ApiComplaintRepository implements IComplaintRepository {
  private baseUrl: string;
  private isCustomBaseUrl: boolean;

  constructor(customBaseUrl?: string) {
    this.isCustomBaseUrl = Boolean(customBaseUrl);
    const raw = customBaseUrl || import.meta.env.VITE_API_BASE_URL || '';
    this.baseUrl = raw.trim().replace(/\/+$/, '');
  }

  public getBaseUrl(): string {
    // If a custom URL was explicitly passed (e.g. in tests), honor it directly
    if (this.isCustomBaseUrl) {
      return this.baseUrl;
    }

    // In local development on localhost, route through Vite's local dev proxy /api
    // to eliminate cross-origin browser CORS preflight blocking
    if (
      typeof window !== 'undefined' &&
      window.location &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
      this.baseUrl.includes('lambda-url')
    ) {
      return '/api';
    }
    return this.baseUrl;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const idToken = await authService.getIdToken();
    if (!idToken) {
      throw new Error(
        'Authentication required: Missing Cognito ID token. Please sign in with CampusFix SSO.'
      );
    }
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`
    };
  }

  private mapBackendComplaint(raw: any): Complaint {
    return {
      ...raw,
      id: raw.complaintId || raw.id,
      studentDepartment: raw.studentDepartment || 'General'
    };
  }

  async createComplaint(input: CreateComplaintInput, student: User): Promise<Complaint> {
    if (!this.baseUrl) {
      throw new Error('Backend API URL is not configured (VITE_API_BASE_URL).');
    }

    const baseUrl = this.getBaseUrl();
    const headers = await this.getAuthHeaders();
    const payload = {
      title: input.title.trim(),
      description: input.description.trim(),
      location: input.location.trim(),
      category: input.category,
      priority: input.priority,
      department: input.department || undefined,
      studentDepartment: student.department || undefined
    };

    let response: Response;
    try {
      response = await fetch(`${baseUrl}/complaints`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });
    } catch (networkErr: any) {
      throw new Error(`Failed to reach backend API: ${networkErr?.message || 'Network connection failed'}`);
    }

    if (!response.ok) {
      let errorMessage = `Server error (status ${response.status})`;
      try {
        const errorData = await response.json();
        errorMessage = errorData?.message || errorData?.error || errorMessage;
      } catch {
        // Fallback to default message
      }
      throw new Error(`DynamoDB save failed: ${errorMessage}`);
    }

    const data = await response.json();
    return this.mapBackendComplaint(data);
  }

  async getMyComplaints(studentId: string, filters?: ComplaintFilterOptions): Promise<Complaint[]> {
    if (!this.baseUrl) {
      throw new Error('Backend API URL is not configured (VITE_API_BASE_URL).');
    }

    const baseUrl = this.getBaseUrl();
    const headers = await this.getAuthHeaders();
    let response: Response;
    try {
      response = await fetch(`${baseUrl}/complaints/my`, {
        method: 'GET',
        headers
      });
    } catch (networkErr: any) {
      throw new Error(`Failed to reach backend API: ${networkErr?.message || 'Network connection failed'}`);
    }

    if (!response.ok) {
      let errorMessage = `Server error (status ${response.status})`;
      try {
        const errorData = await response.json();
        errorMessage = errorData?.message || errorData?.error || errorMessage;
      } catch {
        // Fallback
      }
      if (response.status === 403) {
        throw new Error(`Access Denied (403 Forbidden): ${errorMessage}`);
      }
      if (response.status === 401) {
        throw new Error(`Unauthorized (401): ${errorMessage}`);
      }
      throw new Error(`Failed to retrieve complaints from DynamoDB: ${errorMessage}`);
    }

    const data = await response.json();
    const rawItems: any[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.complaints)
      ? data.complaints
      : Array.isArray(data?.items)
      ? data.items
      : [];

    const complaints = rawItems.map(item => this.mapBackendComplaint(item));
    return this.applyClientFilters(complaints, filters);
  }

  async getAllComplaints(filters?: ComplaintFilterOptions): Promise<Complaint[]> {
    if (!this.baseUrl) {
      throw new Error('Backend API URL is not configured (VITE_API_BASE_URL).');
    }

    const baseUrl = this.getBaseUrl();
    const headers = await this.getAuthHeaders();
    let response: Response;
    try {
      response = await fetch(`${baseUrl}/complaints/all`, {
        method: 'GET',
        headers
      });
    } catch (networkErr: any) {
      throw new Error(`Failed to reach backend API: ${networkErr?.message || 'Network connection failed'}`);
    }

    if (!response.ok) {
      let errorMessage = `Server error (status ${response.status})`;
      try {
        const errorData = await response.json();
        errorMessage = errorData?.message || errorData?.error || errorMessage;
      } catch {
        // Fallback
      }
      if (response.status === 403) {
        throw new Error(`Access Denied (403 Forbidden): ${errorMessage}`);
      }
      if (response.status === 401) {
        throw new Error(`Unauthorized (401): ${errorMessage}`);
      }
      throw new Error(`Failed to retrieve all complaints from DynamoDB: ${errorMessage}`);
    }

    const data = await response.json();
    const rawItems: any[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.complaints)
      ? data.complaints
      : Array.isArray(data?.items)
      ? data.items
      : [];

    const complaints = rawItems.map(item => this.mapBackendComplaint(item));
    return this.applyClientFilters(complaints, filters);
  }

  async getComplaintById(id: string): Promise<Complaint | null> {
    if (!this.baseUrl) {
      throw new Error('Backend API URL is not configured (VITE_API_BASE_URL).');
    }

    const baseUrl = this.getBaseUrl();
    const headers = await this.getAuthHeaders();
    let response: Response;
    try {
      response = await fetch(`${baseUrl}/complaints/${encodeURIComponent(id)}`, {
        method: 'GET',
        headers
      });
    } catch (networkErr: any) {
      throw new Error(`Failed to reach backend API: ${networkErr?.message || 'Network connection failed'}`);
    }

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      let errorMessage = `Server error (status ${response.status})`;
      try {
        const errorData = await response.json();
        errorMessage = errorData?.message || errorData?.error || errorMessage;
      } catch {
        // Fallback
      }
      if (response.status === 403) {
        throw new Error(`Access Denied (403 Forbidden): ${errorMessage}`);
      }
      if (response.status === 401) {
        throw new Error(`Unauthorized (401): ${errorMessage}`);
      }
      throw new Error(`Failed to fetch complaint "${id}": ${errorMessage}`);
    }

    const data = await response.json();
    return this.mapBackendComplaint(data);
  }

  async updateComplaintStatus(
    id: string,
    newStatus: ComplaintStatus,
    actor: User,
    remark?: string
  ): Promise<Complaint> {
    if (!this.baseUrl) {
      throw new Error('Backend API URL is not configured (VITE_API_BASE_URL).');
    }

    const baseUrl = this.getBaseUrl();
    const headers = await this.getAuthHeaders();
    let response: Response;
    try {
      response = await fetch(`${baseUrl}/complaints/${encodeURIComponent(id)}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          newStatus,
          remark: remark || undefined
        })
      });
    } catch (networkErr: any) {
      throw new Error(`Failed to reach backend API: ${networkErr?.message || 'Network connection failed'}`);
    }

    if (!response.ok) {
      let errorMessage = `Server error (status ${response.status})`;
      try {
        const errorData = await response.json();
        errorMessage = errorData?.message || errorData?.error || errorMessage;
      } catch {
        // Fallback
      }
      if (response.status === 403) {
        throw new Error(`Access Denied (403 Forbidden): ${errorMessage}`);
      }
      if (response.status === 401) {
        throw new Error(`Unauthorized (401): ${errorMessage}`);
      }
      throw new Error(`Failed to update complaint status in DynamoDB: ${errorMessage}`);
    }

    const data = await response.json();
    return this.mapBackendComplaint(data);
  }

  async assignComplaint(
    id: string,
    department: DepartmentName,
    assignedTo: string,
    actor: User,
    remark?: string
  ): Promise<Complaint> {
    if (!this.baseUrl) {
      throw new Error('Backend API URL is not configured (VITE_API_BASE_URL).');
    }

    const baseUrl = this.getBaseUrl();
    const headers = await this.getAuthHeaders();
    let response: Response;
    try {
      response = await fetch(`${baseUrl}/complaints/${encodeURIComponent(id)}/assign`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({
          department,
          assignedTo,
          remark: remark || undefined
        })
      });
    } catch (networkErr: any) {
      throw new Error(`Failed to reach backend API: ${networkErr?.message || 'Network connection failed'}`);
    }

    if (!response.ok) {
      let errorMessage = `Server error (status ${response.status})`;
      try {
        const errorData = await response.json();
        errorMessage = errorData?.message || errorData?.error || errorMessage;
      } catch {
        // Fallback
      }
      if (response.status === 403) {
        throw new Error(`Access Denied (403 Forbidden): ${errorMessage}`);
      }
      if (response.status === 401) {
        throw new Error(`Unauthorized (401): ${errorMessage}`);
      }
      throw new Error(`Failed to assign complaint in DynamoDB: ${errorMessage}`);
    }

    const data = await response.json();
    return this.mapBackendComplaint(data);
  }

  async addAdministratorRemark(id: string, remark: string, actor: User): Promise<Complaint> {
    const existing = await this.getComplaintById(id);
    if (!existing) {
      throw new Error(`Complaint ${id} not found.`);
    }
    return this.updateComplaintStatus(id, existing.status, actor, remark);
  }

  async resetToDefaults(): Promise<void> {
    // Cloud database records are not reset locally
    return;
  }

  async getStatistics(studentId?: string): Promise<ComplaintStatistics> {
    try {
      const list = studentId ? await this.getMyComplaints(studentId) : await this.getAllComplaints();
      return {
        total: list.length,
        submitted: list.filter(c => c.status === 'Submitted').length,
        assigned: list.filter(c => c.status === 'Assigned').length,
        inProgress: list.filter(c => c.status === 'In Progress').length,
        resolved: list.filter(c => c.status === 'Resolved').length,
        rejected: list.filter(c => c.status === 'Rejected').length,
        critical: list.filter(c => c.priority === 'Critical').length
      };
    } catch {
      return {
        total: 0,
        submitted: 0,
        assigned: 0,
        inProgress: 0,
        resolved: 0,
        rejected: 0,
        critical: 0
      };
    }
  }

  private applyClientFilters(complaints: Complaint[], filters?: ComplaintFilterOptions): Complaint[] {
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
      }
    }

    return result;
  }
}
