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

describe('Amazon Cognito OIDC Integration & Callback Handling', () => {
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
          replaceState: vi.fn()
        }
      },
      writable: true
    });
  });

  it('correctly identifies when Cognito configuration is incomplete or placeholder', () => {
    const unconfigured = new CognitoAuthAdapter({
      userPoolId: '',
      clientId: '',
      domain: ''
    });
    expect(unconfigured.isCognitoConfigured()).toBe(false);

    const placeholder = new CognitoAuthAdapter({
      userPoolId: 'ap-southeast-2_XXXXXXXXX',
      clientId: 'XXXXXXXXXXXXXXXXXXXXXXXXXX',
      domain: 'your-domain.auth.ap-southeast-2.amazoncognito.com'
    });
    expect(placeholder.isCognitoConfigured()).toBe(false);
  });

  it('identifies confirmed Cognito configuration', async () => {
    const configured = new CognitoAuthAdapter({
      region: 'ap-southeast-2',
      userPoolId: 'ap-southeast-2_tNhqL8tGi',
      clientId: '4oq0kq3qljmhdu8rmbjclt94sl',
      domain: 'ap-southeast-2tnhql8tgi.auth.ap-southeast-2.amazoncognito.com'
    });
    expect(configured.isCognitoConfigured()).toBe(true);
    expect(configured.getConfig().clientId).toBe('4oq0kq3qljmhdu8rmbjclt94sl');
    expect(configured.getConfig().redirectUri).toBe('http://localhost:5173/');
    expect(configured.getConfig().scope).toBe('openid email');

    const userManager = (configured as any).userManager;
    expect(userManager.settings.redirect_uri).toBe('http://localhost:5173/');
    expect(userManager.settings.scope).toBe('openid email');
  });

  it('guarantees redirectUri defaults strictly to http://localhost:5173/ even if accessed via 127.0.0.1', () => {
    // Simulate window.location on 127.0.0.1
    window.location.origin = 'http://127.0.0.1:5173';
    const adapter = new CognitoAuthAdapter({
      region: 'ap-southeast-2',
      userPoolId: 'ap-southeast-2_tNhqL8tGi',
      clientId: '4oq0kq3qljmhdu8rmbjclt94sl',
      domain: 'ap-southeast-2tnhql8tgi.auth.ap-southeast-2.amazoncognito.com'
    });

    expect(adapter.getConfig().redirectUri).toBe('http://localhost:5173/');
    const userManager = (adapter as any).userManager;
    expect(userManager.settings.redirect_uri).toBe('http://localhost:5173/');
  });

  it('rejects Hosted UI initiation when Cognito configuration is missing', async () => {
    const adapter = new CognitoAuthAdapter({
      userPoolId: '',
      clientId: '',
      domain: ''
    });
    await expect(adapter.loginWithCognito()).rejects.toThrow(/not fully configured/);
  });

  it('returns null from handleCallback when no code or error parameter is in URL', async () => {
    const adapter = new CognitoAuthAdapter();
    window.location.search = '';
    const user = await adapter.handleCallback();
    expect(user).toBeNull();
  });

  it('safely catches error query parameters from Cognito and cleans URL without authenticating', async () => {
    const adapter = new CognitoAuthAdapter();
    window.location.search = '?error=access_denied&error_description=User+cancelled+login';

    await expect(adapter.handleCallback()).rejects.toThrow(
      /Cognito Error \(access_denied\): User cancelled login/
    );

    // Verifies that URL parameters were cleared
    expect(window.history.replaceState).toHaveBeenCalledWith(
      {},
      expect.any(String),
      'http://localhost:5173/'
    );

    // Verifies user is not authenticated
    const current = await adapter.getCurrentUser();
    expect(current).toBeNull();
  });

  it('does NOT assume a user is authenticated merely because a code parameter exists', async () => {
    const adapter = new CognitoAuthAdapter({
      userPoolId: '',
      clientId: '',
      domain: ''
    });
    window.location.search = '?code=unverified_fake_code_12345';

    await expect(adapter.handleCallback()).rejects.toThrow(
      /missing confirmed Cognito configuration/i
    );

    // URL is cleared
    expect(window.history.replaceState).toHaveBeenCalled();

    // User is NOT authenticated
    expect(await adapter.getCurrentUser()).toBeNull();
  });

  it('handles successful callback processing and maps user claims', async () => {
    const adapter = new CognitoAuthAdapter({
      region: 'ap-southeast-2',
      userPoolId: 'ap-southeast-2_tNhqL8tGi',
      clientId: '4oq0kq3qljmhdu8rmbjclt94sl',
      domain: 'ap-southeast-2tnhql8tgi.auth.ap-southeast-2.amazoncognito.com'
    });

    window.location.search = '?code=valid_auth_code_999&state=valid_state_xyz';

    const userManager = (adapter as any).userManager;
    userManager.signinCallback = vi.fn().mockResolvedValue({
      id_token: 'header.payload.signature',
      profile: {
        sub: 'sub-student-123',
        email: 'priya.sharma@campus.edu',
        name: 'Priya Sharma',
        'cognito:groups': ['Students'],
        'cognito:username': 'priya.sharma'
      }
    });

    const user = await adapter.handleCallback();
    expect(user).not.toBeNull();
    expect(user?.id).toBe('sub-student-123');
    expect(user?.email).toBe('priya.sharma@campus.edu');
    expect(user?.role).toBe('student');
    expect(userManager.signinCallback).toHaveBeenCalledTimes(1);
    expect(window.history.replaceState).toHaveBeenCalledWith({}, expect.any(String), 'http://localhost:5173/');

    // Verify getIdToken retrieves the verified ID token
    userManager.getUser = vi.fn().mockResolvedValue({
      id_token: 'header.payload.signature',
      expired: false
    });
    expect(await adapter.getIdToken()).toBe('header.payload.signature');
  });

  it('safely handles missing or mismatched state in storage without crashing and clears URL', async () => {
    const adapter = new CognitoAuthAdapter({
      region: 'ap-southeast-2',
      userPoolId: 'ap-southeast-2_tNhqL8tGi',
      clientId: '4oq0kq3qljmhdu8rmbjclt94sl',
      domain: 'ap-southeast-2tnhql8tgi.auth.ap-southeast-2.amazoncognito.com'
    });

    window.location.search = '?code=code_without_state&state=missing_state_id';

    const userManager = (adapter as any).userManager;
    userManager.signinCallback = vi.fn().mockRejectedValue(
      new Error('No matching state found in storage')
    );

    await expect(adapter.handleCallback()).rejects.toThrow(
      /Cognito callback verification failed: No matching state found in storage/
    );

    expect(await adapter.getCurrentUser()).toBeNull();
    expect(window.history.replaceState).toHaveBeenCalled();
  });

  it('handles duplicate / concurrent callback invocations exactly once (single-flight deduplication)', async () => {
    const adapter = new CognitoAuthAdapter({
      region: 'ap-southeast-2',
      userPoolId: 'ap-southeast-2_tNhqL8tGi',
      clientId: '4oq0kq3qljmhdu8rmbjclt94sl',
      domain: 'ap-southeast-2tnhql8tgi.auth.ap-southeast-2.amazoncognito.com'
    });

    window.location.search = '?code=code_concurrent_123&state=state_concurrent_456';

    const userManager = (adapter as any).userManager;
    userManager.signinCallback = vi.fn().mockImplementation(async () => {
      // Simulate asynchronous token exchange delay
      await new Promise(r => setTimeout(r, 20));
      return {
        id_token: 'header.payload.signature',
        profile: {
          sub: 'sub-admin-456',
          email: 'admin.ops@campusfix.edu',
          'cognito:groups': ['Administrators']
        }
      };
    });

    // Simulate React StrictMode or concurrent effect mounts
    const [user1, user2] = await Promise.all([
      adapter.handleCallback(),
      adapter.handleCallback()
    ]);

    expect(user1).toBe(user2);
    expect(user1?.role).toBe('admin');
    // Ensure signinCallback was only called once across both concurrent requests
    expect(userManager.signinCallback).toHaveBeenCalledTimes(1);
  });

  it('safely catches invalid or expired authorization codes and maintains logged-out state', async () => {
    const adapter = new CognitoAuthAdapter({
      region: 'ap-southeast-2',
      userPoolId: 'ap-southeast-2_tNhqL8tGi',
      clientId: '4oq0kq3qljmhdu8rmbjclt94sl',
      domain: 'ap-southeast-2tnhql8tgi.auth.ap-southeast-2.amazoncognito.com'
    });

    window.location.search = '?code=expired_code_000&state=state_123';

    const userManager = (adapter as any).userManager;
    userManager.signinCallback = vi.fn().mockRejectedValue(
      new Error('invalid_grant: Authorization code has expired')
    );

    await expect(adapter.handleCallback()).rejects.toThrow(
      /Cognito callback verification failed: invalid_grant/
    );

    expect(await adapter.getCurrentUser()).toBeNull();
  });

  it('normalizes browser origin to localhost before saving state if accessed via 127.0.0.1', async () => {
    window.location.origin = 'http://127.0.0.1:5173';
    window.location.href = 'http://127.0.0.1:5173/login';
    window.location.pathname = '/login';
    window.location.search = '';

    const adapter = new CognitoAuthAdapter({
      region: 'ap-southeast-2',
      userPoolId: 'ap-southeast-2_tNhqL8tGi',
      clientId: '4oq0kq3qljmhdu8rmbjclt94sl',
      domain: 'ap-southeast-2tnhql8tgi.auth.ap-southeast-2.amazoncognito.com'
    });

    await adapter.loginWithCognito();

    // Verify browser location is directed to localhost:5173 before initiating PKCE
    expect(window.location.href).toBe('http://localhost:5173/login');
  });

  it('CompositeAuthService seamlessly preserves mock mode when mock auth is enabled', async () => {
    const composite = new CompositeAuthService({ mockAuthEnabled: true });

    // Verify demo access continues to work
    const student = await composite.switchDemoRole('student');
    expect(student.role).toBe('student');
    expect(student.name).toBe('Rohan Sharma');

    const admin = await composite.switchDemoRole('admin');
    expect(admin.role).toBe('admin');
    expect(admin.name).toBe('Dr. Aris Thorne');

    // Logging out clears session
    await composite.logout();
    expect(await composite.getCurrentUser()).toBeNull();
  });

  it('CompositeAuthService strictly enforces mock disabling when mockAuthEnabled is false', async () => {
    // Populate mock storage to verify it is NOT restored
    storage.setItem(
      'campusfix_mock_current_user_v1',
      JSON.stringify({
        id: 'usr-student-001',
        name: 'Rohan Sharma',
        email: 'rohan.sharma@campus.edu',
        role: 'student'
      })
    );

    const composite = new CompositeAuthService({ mockAuthEnabled: false });

    // 1. Session restoration must return null (does NOT fall back to mock)
    expect(await composite.getCurrentUser()).toBeNull();
    expect(await composite.getAuthSource()).toBe('none');

    // 2. Demo role switching must be rejected
    await expect(composite.switchDemoRole('student')).rejects.toThrow(
      /Demo role switching is disabled because VITE_ENABLE_MOCK_AUTH is set to false/
    );

    // 3. Regular login must be rejected
    await expect(composite.login('rohan.sharma@campus.edu', 'somepass')).rejects.toThrow(
      /College credential login is disabled/
    );

    // 4. Registration must be rejected
    await expect(
      composite.register({
        name: 'Test',
        email: 'test@campus.edu',
        studentId: 'ST-001',
        department: 'Eng'
      })
    ).rejects.toThrow(/Local student registration is disabled/);
  });

  it('correctly tracks and consumes just-completed callback user for single-click dashboard navigation', async () => {
    const adapter = new CognitoAuthAdapter({
      region: 'ap-southeast-2',
      userPoolId: 'ap-southeast-2_tNhqL8tGi',
      clientId: '4oq0kq3qljmhdu8rmbjclt94sl',
      domain: 'ap-southeast-2tnhql8tgi.auth.ap-southeast-2.amazoncognito.com'
    });

    window.location.search = '?code=code_nav_123&state=state_nav_456';
    expect(adapter.hasCallbackParameters()).toBe(true);

    const userManager = (adapter as any).userManager;
    userManager.signinCallback = vi.fn().mockImplementation(async () => {
      await new Promise(r => setTimeout(r, 15));
      return {
        id_token: 'header.payload.signature',
        profile: {
          sub: 'sub-student-single-click',
          email: 'student.nav@campus.edu',
          'cognito:groups': ['Students']
        }
      };
    });

    const callbackPromise = adapter.handleCallback();
    expect(adapter.isCallbackPending()).toBe(true);

    const user = await callbackPromise;
    expect(adapter.isCallbackPending()).toBe(false);
    expect(user?.role).toBe('student');

    // First consumption returns the completed callback user
    const consumedFirst = adapter.consumeCallbackUser();
    expect(consumedFirst).not.toBeNull();
    expect(consumedFirst?.email).toBe('student.nav@campus.edu');

    // Second consumption returns null (ensuring single navigation trigger)
    const consumedSecond = adapter.consumeCallbackUser();
    expect(consumedSecond).toBeNull();
  });
});
