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

describe('CampusFix Authentication Flow & Verification', () => {
  const storage = new MockStorage();

  beforeEach(() => {
    storage.clear();
    Object.defineProperty(globalThis, 'window', {
      value: {
        localStorage: storage,
        location: {
          origin: 'http://localhost:5173',
          pathname: '/login',
          search: '',
          href: 'http://localhost:5173/login'
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

  // 1. An unauthenticated user clicking Sign In
  it('1. Unauthenticated user clicking Sign In initiates actual Cognito Hosted UI flow', async () => {
    const adapter = new CognitoAuthAdapter({
      region: 'ap-southeast-2',
      userPoolId: 'ap-southeast-2_tNhqL8tGi',
      clientId: '4oq0kq3qljmhdu8rmbjclt94sl',
      domain: 'ap-southeast-2tnhql8tgi.auth.ap-southeast-2.amazoncognito.com',
      redirectUri: 'http://localhost:5173/'
    });

    const userManager = (adapter as any).userManager;
    userManager.signinRedirect = vi.fn().mockResolvedValue(undefined);

    // Initial state: user is unauthenticated
    expect(await adapter.getCurrentUser()).toBeNull();

    // Clicking Sign In invokes loginWithCognito
    await adapter.loginWithCognito();

    // Verifies signinRedirect is called with standard PKCE parameters
    expect(userManager.signinRedirect).toHaveBeenCalledTimes(1);
    expect(userManager.signinRedirect).toHaveBeenCalledWith(
      expect.objectContaining({
        redirect_uri: 'http://localhost:5173/',
        scope: 'openid email'
      })
    );
    // Verifies prompt: 'login' is NOT passed blindly by default
    const callArgs = userManager.signinRedirect.mock.calls[0][0];
    expect(callArgs.prompt).toBeUndefined();

    // If an explicit fresh login is requested, prompt: 'login' is supported
    await adapter.loginWithCognito({ prompt: 'login' });
    expect(userManager.signinRedirect).toHaveBeenLastCalledWith(
      expect.objectContaining({
        prompt: 'login'
      })
    );
  });

  // 2. A user with an existing valid session vs unauthenticated / expired localStorage
  it('2. Properly distinguishes genuinely authenticated user from invalid/expired localStorage entry', async () => {
    const adapter = new CognitoAuthAdapter({
      region: 'ap-southeast-2',
      userPoolId: 'ap-southeast-2_tNhqL8tGi',
      clientId: '4oq0kq3qljmhdu8rmbjclt94sl',
      domain: 'ap-southeast-2tnhql8tgi.auth.ap-southeast-2.amazoncognito.com',
      redirectUri: 'http://localhost:5173/'
    });

    const userManager = (adapter as any).userManager;

    // Case A: Valid unexpired session
    userManager.getUser = vi.fn().mockResolvedValue({
      expired: false,
      profile: {
        sub: 'sub-valid-user-99',
        email: 'genuine.student@campus.edu',
        name: 'Genuine Student',
        'cognito:groups': ['Students']
      }
    });

    const genuineUser = await adapter.getCurrentUser();
    expect(genuineUser).not.toBeNull();
    expect(genuineUser?.email).toBe('genuine.student@campus.edu');
    expect(genuineUser?.role).toBe('student');

    // Case B: Expired session in storage does NOT grant access
    (adapter as any).currentUser = null;
    userManager.getUser = vi.fn().mockResolvedValue({
      expired: true,
      profile: {
        sub: 'sub-expired-user-88',
        email: 'expired.student@campus.edu'
      }
    });

    const expiredUser = await adapter.getCurrentUser();
    expect(expiredUser).toBeNull();

    // Case C: Raw localStorage entry without valid OIDC token when mock auth is disabled
    storage.setItem('campusfix_mock_current_user_v1', JSON.stringify({
      id: 'fake-mock-id',
      email: 'fake@campus.edu',
      role: 'student'
    }));

    const composite = new CompositeAuthService({
      mockAuthEnabled: false,
      customCognitoConfig: {
        region: 'ap-southeast-2',
        userPoolId: 'ap-southeast-2_tNhqL8tGi',
        clientId: '4oq0kq3qljmhdu8rmbjclt94sl',
        domain: 'ap-southeast-2tnhql8tgi.auth.ap-southeast-2.amazoncognito.com'
      }
    });

    // CompositeAuthService must reject raw localStorage mock entry when mock auth is false
    const restoredUser = await composite.getCurrentUser();
    expect(restoredUser).toBeNull();
    expect(await composite.getAuthSource()).toBe('none');
  });

  // 3. Cognito callback processing
  it('3. Cognito callback processing handles both valid authorization code and error redirects', async () => {
    const adapter = new CognitoAuthAdapter({
      region: 'ap-southeast-2',
      userPoolId: 'ap-southeast-2_tNhqL8tGi',
      clientId: '4oq0kq3qljmhdu8rmbjclt94sl',
      domain: 'ap-southeast-2tnhql8tgi.auth.ap-southeast-2.amazoncognito.com',
      redirectUri: 'http://localhost:5173/'
    });

    const userManager = (adapter as any).userManager;

    // Sub-case 3a: Successful callback
    window.location.search = '?code=auth_code_success_777&state=state_xyz';
    userManager.signinCallback = vi.fn().mockResolvedValue({
      id_token: 'header.payload.signature',
      profile: {
        sub: 'sub-alex-student',
        email: 'alex.chen@campus.edu',
        name: 'Alex Chen',
        'cognito:groups': ['Students'],
        'custom:student_id': 'CS-2026-001',
        'custom:department': 'Computer Science'
      }
    });

    const callbackUser = await adapter.handleCallback();
    expect(callbackUser).not.toBeNull();
    expect(callbackUser?.id).toBe('sub-alex-student');
    expect(callbackUser?.role).toBe('student');
    expect(adapter.consumeCallbackUser()?.id).toBe('sub-alex-student');
    // Ensure URL was sanitized
    expect(window.history.replaceState).toHaveBeenCalled();

    // Sub-case 3b: Error redirect from Cognito
    window.location.search = '?error=access_denied&error_description=User+cancelled';
    await expect(adapter.handleCallback()).rejects.toThrow(/access_denied/);
    expect(await adapter.getCurrentUser()).toBeNull();
    expect(adapter.consumeCallbackUser()).toBeNull();
  });

  // 4. Logout and subsequent login
  it('4. Logout terminates session locally and redirects through Cognito logout endpoint', async () => {
    const composite = new CompositeAuthService({
      mockAuthEnabled: false,
      customCognitoConfig: {
        region: 'ap-southeast-2',
        userPoolId: 'ap-southeast-2_tNhqL8tGi',
        clientId: '4oq0kq3qljmhdu8rmbjclt94sl',
        domain: 'ap-southeast-2tnhql8tgi.auth.ap-southeast-2.amazoncognito.com',
        redirectUri: 'http://localhost:5173/'
      }
    });

    const adapter = (composite as any).cognitoAdapter;
    const userManager = (adapter as any).userManager;
    userManager.removeUser = vi.fn().mockResolvedValue(undefined);
    userManager.signinRedirect = vi.fn().mockResolvedValue(undefined);

    // Verify logout URL structure with registered client ID and logout URI
    const logoutUrl = adapter.getLogoutUrl();
    expect(logoutUrl).toBe(
      'https://ap-southeast-2tnhql8tgi.auth.ap-southeast-2.amazoncognito.com/logout?client_id=4oq0kq3qljmhdu8rmbjclt94sl&logout_uri=http%3A%2F%2Flocalhost%3A5173%2F'
    );

    // Perform logout
    await composite.logout();

    // Local OIDC session must be cleared
    expect(userManager.removeUser).toHaveBeenCalledTimes(1);
    expect(await composite.getCurrentUser()).toBeNull();

    // Browser is directed through Cognito's logout endpoint
    expect(window.location.href).toBe(logoutUrl);

    // Subsequent login initiates fresh Cognito authentication
    await composite.loginWithCognito();
    expect(userManager.signinRedirect).toHaveBeenCalledTimes(1);
    expect(userManager.signinRedirect).toHaveBeenCalledWith(
      expect.objectContaining({
        redirect_uri: 'http://localhost:5173/',
        scope: 'openid email'
      })
    );
  });

  // 5. Preventing duplicate authentication requests
  it('5. Prevents duplicate authentication requests with single-flight callback deduplication', async () => {
    const adapter = new CognitoAuthAdapter({
      region: 'ap-southeast-2',
      userPoolId: 'ap-southeast-2_tNhqL8tGi',
      clientId: '4oq0kq3qljmhdu8rmbjclt94sl',
      domain: 'ap-southeast-2tnhql8tgi.auth.ap-southeast-2.amazoncognito.com',
      redirectUri: 'http://localhost:5173/'
    });

    window.location.search = '?code=single_flight_code&state=single_flight_state';

    let signinCallCount = 0;
    const userManager = (adapter as any).userManager;
    userManager.signinCallback = vi.fn().mockImplementation(async () => {
      signinCallCount++;
      await new Promise(r => setTimeout(r, 20));
      return {
        id_token: 'header.payload.signature',
        profile: {
          sub: 'sub-dedup-user',
          email: 'dedup.user@campus.edu',
          'cognito:groups': ['Students']
        }
      };
    });

    // Simulate concurrent callback invocations (e.g. React StrictMode mount/remount)
    const call1 = adapter.handleCallback();
    expect(adapter.isCallbackPending()).toBe(true);
    const call2 = adapter.handleCallback();
    const call3 = adapter.handleCallback();

    const [user1, user2, user3] = await Promise.all([call1, call2, call3]);

    expect(user1).toBe(user2);
    expect(user2).toBe(user3);
    expect(user1?.email).toBe('dedup.user@campus.edu');

    // Token exchange was invoked only once
    expect(signinCallCount).toBe(1);
    expect(userManager.signinCallback).toHaveBeenCalledTimes(1);
    expect(adapter.isCallbackPending()).toBe(false);
  });
});
