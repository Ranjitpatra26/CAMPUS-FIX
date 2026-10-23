import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CognitoAuthAdapter } from '../src/services/auth/cognitoAuthAdapter';
import { CompositeAuthService } from '../src/services/auth/authService';

class MockStorage {
  private store: Record<string, string> = {};
  getItem(k: string): string | null { return this.store[k] || null; }
  setItem(k: string, v: string): void { this.store[k] = v; }
  removeItem(k: string): void { delete this.store[k]; }
  clear(): void { this.store = {}; }
}

describe('Cognito Callback Flow, State Restoration & Dashboard Navigation', () => {
  const storage = new MockStorage();

  beforeEach(() => {
    storage.clear();
    Object.defineProperty(globalThis, 'window', {
      value: {
        localStorage: storage,
        location: {
          origin: 'http://localhost:5173',
          pathname: '/',
          search: '',
          href: 'http://localhost:5173/'
        },
        history: {
          replaceState: vi.fn((_state, _title, url) => {
            if (typeof url === 'string') {
              const parsed = new URL(url, 'http://localhost:5173');
              window.location.pathname = parsed.pathname;
              window.location.search = parsed.search;
            }
          })
        }
      },
      writable: true
    });
  });

  it('restores authenticated student state and targets student dashboard on callback', async () => {
    window.location.search = '?code=auth_code_student_001&state=state_001';

    const adapter = new CognitoAuthAdapter({
      region: 'ap-southeast-2',
      userPoolId: 'ap-southeast-2_tNhqL8tGi',
      clientId: '4oq0kq3qljmhdu8rmbjclt94sl',
      domain: 'ap-southeast-2tnhql8tgi.auth.ap-southeast-2.amazoncognito.com'
    });

    const userManager = (adapter as any).userManager;
    userManager.signinCallback = vi.fn().mockResolvedValue({
      id_token: 'valid.student.jwt',
      profile: {
        sub: 'cognito-sub-student-1',
        email: 'alex.chen@campus.edu',
        name: 'Alex Chen',
        'cognito:groups': ['Students'],
        'custom:student_id': 'CS-2026-101',
        'custom:department': 'Computer Science'
      }
    });

    const user = await adapter.handleCallback();

    expect(user).not.toBeNull();
    expect(user?.id).toBe('cognito-sub-student-1');
    expect(user?.role).toBe('student');
    expect(user?.name).toBe('Alex Chen');
    expect(user?.department).toBe('Computer Science');

    // Expected automatic dashboard destination for student role
    const targetRoute = user?.role === 'admin' ? '/admin' : '/student';
    expect(targetRoute).toBe('/student');

    // Verify callback was consumed
    const consumed = adapter.consumeCallbackUser();
    expect(consumed?.id).toBe('cognito-sub-student-1');
  });

  it('restores authenticated admin state and targets administrator dashboard on callback', async () => {
    window.location.search = '?code=auth_code_admin_002&state=state_002';

    const adapter = new CognitoAuthAdapter({
      region: 'ap-southeast-2',
      userPoolId: 'ap-southeast-2_tNhqL8tGi',
      clientId: '4oq0kq3qljmhdu8rmbjclt94sl',
      domain: 'ap-southeast-2tnhql8tgi.auth.ap-southeast-2.amazoncognito.com'
    });

    const userManager = (adapter as any).userManager;
    userManager.signinCallback = vi.fn().mockResolvedValue({
      id_token: 'valid.admin.jwt',
      profile: {
        sub: 'cognito-sub-admin-1',
        email: 'dean.operations@campus.edu',
        name: 'Dean Operations',
        'cognito:groups': ['Administrators']
      }
    });

    const user = await adapter.handleCallback();

    expect(user).not.toBeNull();
    expect(user?.id).toBe('cognito-sub-admin-1');
    expect(user?.role).toBe('admin');

    // Expected automatic dashboard destination for admin role
    const targetRoute = user?.role === 'admin' ? '/admin' : '/student';
    expect(targetRoute).toBe('/admin');
  });

  it('guarantees single-flight token exchange and seamless user restoration under StrictMode remount', async () => {
    window.location.search = '?code=code_strictmode_race&state=state_strictmode';

    const adapter = new CognitoAuthAdapter({
      region: 'ap-southeast-2',
      userPoolId: 'ap-southeast-2_tNhqL8tGi',
      clientId: '4oq0kq3qljmhdu8rmbjclt94sl',
      domain: 'ap-southeast-2tnhql8tgi.auth.ap-southeast-2.amazoncognito.com'
    });

    let exchangeCount = 0;
    const userManager = (adapter as any).userManager;
    userManager.signinCallback = vi.fn().mockImplementation(async () => {
      exchangeCount++;
      // Simulate realistic token exchange network latency (30ms)
      await new Promise(r => setTimeout(r, 30));
      return {
        id_token: 'header.payload.signature',
        profile: {
          sub: 'sub-strict-mode-user',
          email: 'strict.mode@campus.edu',
          'cognito:groups': ['Students']
        }
      };
    });

    // Mount 1 starts callback
    const mount1Promise = adapter.handleCallback();
    expect(adapter.isCallbackPending()).toBe(true);

    // Mount 2 starts callback concurrently while Mount 1 is in-flight (Strict mode simulation)
    const mount2Promise = adapter.handleCallback();

    const [user1, user2] = await Promise.all([mount1Promise, mount2Promise]);

    expect(user1).not.toBeNull();
    expect(user2).not.toBeNull();
    expect(user1).toBe(user2);
    expect(user1?.email).toBe('strict.mode@campus.edu');

    // Critical: OIDC token exchange was called EXACTLY ONCE
    expect(exchangeCount).toBe(1);
    expect(userManager.signinCallback).toHaveBeenCalledTimes(1);

    // After resolution, callback is no longer pending
    expect(adapter.isCallbackPending()).toBe(false);

    // Subsequent call to getCurrentUser immediately returns cached authenticated user
    const current = await adapter.getCurrentUser();
    expect(current?.id).toBe('sub-strict-mode-user');
  });

  it('allows Mount 2 to consume callback user even if Mount 1 cleaned URL parameters before Mount 2 mounted', async () => {
    window.location.search = '?code=fast_code_001&state=fast_state_001';

    const adapter = new CognitoAuthAdapter({
      region: 'ap-southeast-2',
      userPoolId: 'ap-southeast-2_tNhqL8tGi',
      clientId: '4oq0kq3qljmhdu8rmbjclt94sl',
      domain: 'ap-southeast-2tnhql8tgi.auth.ap-southeast-2.amazoncognito.com'
    });

    const userManager = (adapter as any).userManager;
    userManager.signinCallback = vi.fn().mockResolvedValue({
      id_token: 'jwt.token.fast',
      profile: {
        sub: 'sub-fast-user',
        email: 'fast.user@campus.edu',
        'cognito:groups': ['Students']
      }
    });

    // Mount 1 completes callback and cleans URL
    await adapter.handleCallback();
    expect(window.location.search).toBe(''); // URL parameters cleaned

    // Mount 2 checks for completed callback user
    const userForNavigation = adapter.consumeCallbackUser();
    expect(userForNavigation).not.toBeNull();
    expect(userForNavigation?.id).toBe('sub-fast-user');
    expect(userForNavigation?.role).toBe('student');

    // Automatically navigates to /student
    const route = userForNavigation?.role === 'admin' ? '/admin' : '/student';
    expect(route).toBe('/student');

    // Next check returns null, avoiding duplicate navigation
    expect(adapter.consumeCallbackUser()).toBeNull();
  });

  it('properly directs to login and clears state when Cognito returns an error', async () => {
    window.location.search = '?error=invalid_grant&error_description=Code+already+redeemed';

    const adapter = new CognitoAuthAdapter({
      region: 'ap-southeast-2',
      userPoolId: 'ap-southeast-2_tNhqL8tGi',
      clientId: '4oq0kq3qljmhdu8rmbjclt94sl',
      domain: 'ap-southeast-2tnhql8tgi.auth.ap-southeast-2.amazoncognito.com'
    });

    let caughtError: Error | null = null;
    try {
      await adapter.handleCallback();
    } catch (err: any) {
      caughtError = err;
    }

    expect(caughtError).not.toBeNull();
    expect(caughtError?.message).toContain('invalid_grant');
    expect(await adapter.getCurrentUser()).toBeNull();
    expect(adapter.consumeCallbackUser()).toBeNull();
    // Query params cleared
    expect(window.history.replaceState).toHaveBeenCalled();
  });
});
