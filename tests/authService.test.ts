import { describe, it, expect, beforeEach } from 'vitest';
import { MockAuthAdapter } from '../src/services/auth/authService';
import { UserRole } from '../src/types';

class MockStorage {
  private store: Record<string, string> = {};
  getItem(k: string): string | null { return this.store[k] || null; }
  setItem(k: string, v: string): void { this.store[k] = v; }
  removeItem(k: string): void { delete this.store[k]; }
  clear(): void { this.store = {}; }
}

describe('MockAuthAdapter & Demo Role Management', () => {
  let auth: MockAuthAdapter;
  const storage = new MockStorage();

  beforeEach(() => {
    storage.clear();
    Object.defineProperty(globalThis, 'window', {
      value: { localStorage: storage },
      writable: true
    });
    auth = new MockAuthAdapter();
  });

  it('exposes authentic demo student and administrator profiles', () => {
    const demos = auth.getDemoUsers();
    expect(demos.student.role).toBe('student');
    expect(demos.student.name).toBe('Rohan Sharma');
    expect(demos.student.studentId).toBe('CS-2023-042');

    expect(demos.admin.role).toBe('admin');
    expect(demos.admin.name).toBe('Dr. Aris Thorne');
    expect(demos.admin.department).toBe('Campus Administration');
  });

  it('allows seamless switching to student demo', async () => {
    const student = await auth.switchDemoRole('student');
    expect(student.role).toBe('student');
    expect(student.email).toBe('rohan.sharma@campus.edu');

    const current = await auth.getCurrentUser();
    expect(current?.id).toBe(student.id);
  });

  it('allows seamless switching to administrator demo', async () => {
    const admin = await auth.switchDemoRole('admin');
    expect(admin.role).toBe('admin');
    expect(admin.email).toBe('admin@campusfix.edu');

    const current = await auth.getCurrentUser();
    expect(current?.id).toBe(admin.id);
  });

  it('enforces student-only role on new user registration', async () => {
    const registered = await auth.register({
      name: 'Elena Rostova',
      email: 'elena.rostova@campus.edu',
      studentId: 'ST-2026-088',
      department: 'Biotechnology',
      password: 'securepassword123'
    });

    expect(registered.role).toBe('student');
    expect(registered.name).toBe('Elena Rostova');
    expect(registered.studentId).toBe('ST-2026-088');

    // Registration should NEVER grant admin role
    expect(registered.role).not.toBe('admin');
  });

  it('rejects invalid login credentials when using non-existent email with empty password', async () => {
    await expect(auth.login('nonexistent@campus.edu', '')).rejects.toThrow(/Password is required/);
    await expect(auth.login('invalid-email-format', 'somepassword')).rejects.toThrow(/valid college email/);
  });

  it('clears active session upon logout', async () => {
    await auth.switchDemoRole('student');
    expect(await auth.getCurrentUser()).not.toBeNull();

    await auth.logout();
    expect(await auth.getCurrentUser()).toBeNull();
  });

  it('does NOT escalate privileges for arbitrary emails containing admin substring', async () => {
    // An email like "admissions@campus.edu" or "student.admin@campus.edu" should not receive admin role
    const user = await auth.login('admissions.assistant@campus.edu', 'secret123');
    expect(user.role).toBe('student');
    expect(user.role).not.toBe('admin');
  });

  it('gracefully handles malformed JSON session in storage without crashing', async () => {
    storage.setItem('campusfix_mock_current_user_v1', 'MALFORMED_SESSION_{{{');
    const freshAuth = new MockAuthAdapter();
    const user = await freshAuth.getCurrentUser();
    expect(user).toBeNull();
  });
});
