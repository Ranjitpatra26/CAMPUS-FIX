import { User, UserRole } from '../../types';
import { DEMO_STUDENT, DEMO_ADMIN, ALL_USERS } from '../mock-data/initialUsers';

export interface RegisterInput {
  name: string;
  email: string;
  studentId: string;
  department: string;
  password?: string;
}

export interface IAuthService {
  login(email: string, password?: string): Promise<User>;
  register(input: RegisterInput): Promise<User>;
  logout(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  switchDemoRole(role: UserRole): Promise<User>;
  getDemoUsers(): { student: User; admin: User };
}

const AUTH_STORAGE_KEY = 'campusfix_mock_current_user_v1';

export class MockAuthAdapter implements IAuthService {
  private currentUser: User | null = null;

  constructor() {
    this.initSession();
  }

  private initSession() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = window.localStorage.getItem(AUTH_STORAGE_KEY);
        if (stored) {
          this.currentUser = JSON.parse(stored);
          return;
        }
      }
    } catch (e) {
      console.warn('Could not read user session from storage', e);
    }
    this.currentUser = null;
  }

  private persistSession(user: User | null) {
    this.currentUser = user;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        if (user) {
          window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
        } else {
          window.localStorage.removeItem(AUTH_STORAGE_KEY);
        }
      }
    } catch (e) {
      console.warn('Could not write user session to storage', e);
    }
  }

  async login(email: string, password?: string): Promise<User> {
    // Simulate slight network latency (150ms) for realistic feel
    await new Promise(resolve => setTimeout(resolve, 150));

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes('@')) {
      throw new Error('Please enter a valid college email address.');
    }

    if (password !== undefined && password.trim().length === 0) {
      throw new Error('Password is required.');
    }

    // Check if it's admin (strictly exact administrator email)
    if (cleanEmail === 'admin@campusfix.edu') {
      this.persistSession(DEMO_ADMIN);
      return DEMO_ADMIN;
    }

    // Check existing users
    const matched = ALL_USERS.find(u => u.email.toLowerCase() === cleanEmail);
    if (matched) {
      this.persistSession(matched);
      return matched;
    }

    if (!password || password.trim().length < 4) {
      throw new Error('Invalid college credentials. Please check your email and password.');
    }

    // Default student login with custom email
    const studentUser: User = {
      id: `usr-custom-${Date.now()}`,
      name: cleanEmail.split('@')[0].replace('.', ' ').toUpperCase(),
      email: cleanEmail,
      role: 'student',
      studentId: 'ST-2026-999',
      department: 'General Engineering',
      joinedDate: 'October 2026'
    };

    this.persistSession(studentUser);
    return studentUser;
  }

  async register(input: RegisterInput): Promise<User> {
    await new Promise(resolve => setTimeout(resolve, 200));

    const newUser: User = {
      id: `usr-reg-${Date.now()}`,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      role: 'student',
      studentId: input.studentId.trim(),
      department: input.department.trim(),
      joinedDate: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    };

    this.persistSession(newUser);
    return newUser;
  }

  async logout(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    this.persistSession(null);
  }

  async getCurrentUser(): Promise<User | null> {
    return this.currentUser;
  }

  async switchDemoRole(role: UserRole): Promise<User> {
    const target = role === 'admin' ? DEMO_ADMIN : DEMO_STUDENT;
    this.persistSession(target);
    return target;
  }

  getDemoUsers(): { student: User; admin: User } {
    return {
      student: DEMO_STUDENT,
      admin: DEMO_ADMIN
    };
  }
}

export const authService = new MockAuthAdapter();
