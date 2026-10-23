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
  logout(options?: { redirect?: boolean }): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  switchDemoRole(role: UserRole): Promise<User>;
  getDemoUsers(): { student: User; admin: User };
  loginWithCognito?(options?: CognitoLoginOptions): Promise<void>;
  handleCallback?(): Promise<User | null>;
  isCognitoConfigured?(): boolean;
  getIdToken?(): Promise<string | null>;
  consumeCallbackUser?(): User | null;
  isCallbackPending?(): boolean;
  hasCallbackParameters?(): boolean;
  getAuthSource?(): Promise<'cognito' | 'mock' | 'none'>;
  isMockAuthEnabled?(): boolean;
  getLogoutUrl?(): string;
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

import { CognitoAuthAdapter, CognitoConfig, CognitoLoginOptions } from './cognitoAuthAdapter';

export class CompositeAuthService implements IAuthService {
  private mockAdapter: MockAuthAdapter;
  private cognitoAdapter: CognitoAuthAdapter;
  private mockAuthOverride?: boolean;

  constructor(options?: { mockAuthEnabled?: boolean; customCognitoConfig?: Partial<CognitoConfig> }) {
    this.mockAdapter = new MockAuthAdapter();
    this.cognitoAdapter = new CognitoAuthAdapter(options?.customCognitoConfig);
    this.mockAuthOverride = options?.mockAuthEnabled;
  }

  isMockAuthEnabled(): boolean {
    if (this.mockAuthOverride !== undefined) {
      return this.mockAuthOverride;
    }
    if (import.meta.env.PROD) {
      return false;
    }
    const raw = import.meta.env.VITE_ENABLE_MOCK_AUTH;
    // Explicitly check for 'false' string or boolean
    return raw !== 'false' && raw !== false;
  }

  isCognitoConfigured(): boolean {
    return this.cognitoAdapter.isCognitoConfigured();
  }

  async loginWithCognito(options?: CognitoLoginOptions): Promise<void> {
    return this.cognitoAdapter.loginWithCognito(options);
  }

  getLogoutUrl(): string {
    return this.cognitoAdapter.getLogoutUrl?.() || '';
  }

  async handleCallback(): Promise<User | null> {
    return this.cognitoAdapter.handleCallback();
  }

  consumeCallbackUser(): User | null {
    return this.cognitoAdapter.consumeCallbackUser?.() || null;
  }

  isCallbackPending(): boolean {
    return this.cognitoAdapter.isCallbackPending?.() || false;
  }

  hasCallbackParameters(): boolean {
    return this.cognitoAdapter.hasCallbackParameters?.() || false;
  }

  async login(email: string, password?: string): Promise<User> {
    if (!this.isMockAuthEnabled()) {
      throw new Error('College credential login is disabled. Please sign in with CampusFix SSO (Amazon Cognito).');
    }
    return this.mockAdapter.login(email, password);
  }

  async register(input: RegisterInput): Promise<User> {
    if (!this.isMockAuthEnabled()) {
      throw new Error('Local student registration is disabled in cloud authentication mode.');
    }
    return this.mockAdapter.register(input);
  }

  async logout(options?: { redirect?: boolean }): Promise<void> {
    const isCognitoSession = Boolean(await this.cognitoAdapter.getCurrentUser());
    await this.mockAdapter.logout();
    if (this.cognitoAdapter.isCognitoConfigured()) {
      const shouldRedirect = options?.redirect ?? (!this.isMockAuthEnabled() || isCognitoSession);
      await this.cognitoAdapter.logout({ redirect: shouldRedirect });
    }
  }

  async getCurrentUser(): Promise<User | null> {
    // 1. Prioritize verified Cognito active session
    if (this.cognitoAdapter.isCognitoConfigured()) {
      const cognitoUser = await this.cognitoAdapter.getCurrentUser();
      if (cognitoUser) return cognitoUser;
    }

    // 2. Only fall back to local mock session if mock auth is explicitly enabled
    if (this.isMockAuthEnabled()) {
      return this.mockAdapter.getCurrentUser();
    }

    // When mock auth is disabled and no Cognito session exists, return null
    return null;
  }

  async getAuthSource(): Promise<'cognito' | 'mock' | 'none'> {
    if (this.cognitoAdapter.isCognitoConfigured()) {
      const cognitoUser = await this.cognitoAdapter.getCurrentUser();
      if (cognitoUser) return 'cognito';
    }
    if (this.isMockAuthEnabled()) {
      const mockUser = await this.mockAdapter.getCurrentUser();
      if (mockUser) return 'mock';
    }
    return 'none';
  }

  async getIdToken(): Promise<string | null> {
    if (this.cognitoAdapter.isCognitoConfigured()) {
      return this.cognitoAdapter.getIdToken();
    }
    return null;
  }

  async switchDemoRole(role: UserRole): Promise<User> {
    if (!this.isMockAuthEnabled()) {
      throw new Error('Demo role switching is disabled because VITE_ENABLE_MOCK_AUTH is set to false. Role is strictly determined by verified Cognito identity claims.');
    }
    return this.mockAdapter.switchDemoRole(role);
  }

  getDemoUsers(): { student: User; admin: User } {
    return this.mockAdapter.getDemoUsers();
  }
}

export const authService = new CompositeAuthService();
