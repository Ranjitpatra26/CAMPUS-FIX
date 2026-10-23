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

describe('CampusFix Production Authentication & Role Enforcement Tests', () => {
  const storage = new MockStorage();

  const cognitoConfig = {
    region: 'ap-southeast-2',
    userPoolId: 'ap-southeast-2_tNhqL8tGi',
    clientId: '4oq0kq3qljmhdu8rmbjclt94sl',
    domain: 'ap-southeast-2tnhql8tgi.auth.ap-southeast-2.amazoncognito.com',
    redirectUri: 'http://localhost:5173/'
  };

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
          replaceState: vi.fn()
        }
      },
      writable: true
    });
  });

  describe('Requirement 5a: Production mock authentication is disabled', () => {
    it('disables mock authentication and ignores existing localStorage mock sessions', async () => {
      // Seed storage with legacy mock demo session
      storage.setItem(
        'campusfix_mock_current_user_v1',
        JSON.stringify({
          id: 'usr-demo-student-001',
          name: 'Rohan Sharma',
          email: 'rohan.sharma@campus.edu',
          role: 'student'
        })
      );

      const service = new CompositeAuthService({
        mockAuthEnabled: false,
        customCognitoConfig: cognitoConfig
      });

      expect(service.isMockAuthEnabled()).toBe(false);

      // Must return null instead of reading mock demo user from storage
      const currentUser = await service.getCurrentUser();
      expect(currentUser).toBeNull();
      expect(await service.getAuthSource()).toBe('none');
    });

    it('rejects credential-based login when mock auth is disabled', async () => {
      const service = new CompositeAuthService({
        mockAuthEnabled: false,
        customCognitoConfig: cognitoConfig
      });

      await expect(service.login('student@campus.edu', 'secret123')).rejects.toThrow(
        /College credential login is disabled\. Please sign in with CampusFix SSO \(Amazon Cognito\)\./
      );
    });

    it('rejects student self-registration when mock auth is disabled', async () => {
      const service = new CompositeAuthService({
        mockAuthEnabled: false,
        customCognitoConfig: cognitoConfig
      });

      await expect(
        service.register({
          name: 'New Student',
          email: 'new.student@campus.edu',
          studentId: 'ST-2026-001',
          department: 'Computer Science'
        })
      ).rejects.toThrow(
        /Local student registration is disabled in cloud authentication mode\./
      );
    });
  });

  describe('Requirement 5b: Cognito authentication failures do not trigger demo authentication', () => {
    it('does not fall back to demo mode when Cognito session is expired', async () => {
      const adapter = new CognitoAuthAdapter(cognitoConfig);
      const userManager = (adapter as any).userManager;

      // Mock expired OIDC session
      userManager.getUser = vi.fn().mockResolvedValue({
        expired: true,
        profile: {
          sub: 'cognito-sub-123',
          email: 'student@campus.edu'
        }
      });

      const user = await adapter.getCurrentUser();
      expect(user).toBeNull();
    });

    it('does not enter demo mode when Cognito callback fails or returns an error', async () => {
      const adapter = new CognitoAuthAdapter(cognitoConfig);
      window.location.search = '?error=access_denied&error_description=User+declined+authorization';

      await expect(adapter.handleCallback()).rejects.toThrow(/access_denied/);
      expect(await adapter.getCurrentUser()).toBeNull();
      expect(adapter.consumeCallbackUser()).toBeNull();
    });

    it('does not authenticate the user when an invalid or forged authorization code is supplied', async () => {
      const adapter = new CognitoAuthAdapter(cognitoConfig);
      window.location.search = '?code=invalid_bogus_code&state=fake_state';

      const userManager = (adapter as any).userManager;
      userManager.signinCallback = vi.fn().mockRejectedValue(new Error('Invalid authorization code grant'));

      await expect(adapter.handleCallback()).rejects.toThrow(/Invalid authorization code grant/);
      expect(await adapter.getCurrentUser()).toBeNull();
    });
  });

  describe('Requirement 5c: Student users cannot switch to admin mode', () => {
    it('throws when switchDemoRole is called on CompositeAuthService in production', async () => {
      const service = new CompositeAuthService({
        mockAuthEnabled: false,
        customCognitoConfig: cognitoConfig
      });

      await expect(service.switchDemoRole('admin')).rejects.toThrow(
        /Demo role switching is disabled because VITE_ENABLE_MOCK_AUTH is set to false/
      );
    });

    it('throws when switchDemoRole is called directly on CognitoAuthAdapter', async () => {
      const adapter = new CognitoAuthAdapter(cognitoConfig);

      await expect(adapter.switchDemoRole('admin')).rejects.toThrow(
        /Role switching is disabled\. User role is strictly derived from verified Cognito identity tokens\./
      );
    });
  });

  describe('Requirement 5d: Role determination and admin navigation authorization', () => {
    it('correctly maps non-admin Cognito claims to student role only', async () => {
      const adapter = new CognitoAuthAdapter(cognitoConfig);
      const userManager = (adapter as any).userManager;

      userManager.getUser = vi.fn().mockResolvedValue({
        expired: false,
        id_token: 'valid.token.signature',
        profile: {
          sub: 'student-sub-456',
          email: 'maya.lin@campus.edu',
          name: 'Maya Lin',
          'cognito:groups': ['Students'],
          'custom:student_id': 'CS-2026-042',
          'custom:department': 'Computer Science'
        }
      });

      const user = await adapter.getCurrentUser();
      expect(user).not.toBeNull();
      expect(user?.role).toBe('student');
      expect(user?.email).toBe('maya.lin@campus.edu');
      expect(user?.department).toBe('Computer Science');
    });

    it('only assigns admin role when verified cognito:groups contains Administrators', async () => {
      const adapter = new CognitoAuthAdapter(cognitoConfig);
      const userManager = (adapter as any).userManager;

      userManager.getUser = vi.fn().mockResolvedValue({
        expired: false,
        id_token: 'valid.admin.signature',
        profile: {
          sub: 'admin-sub-789',
          email: 'admin.officer@campus.edu',
          name: 'Dr. Aris Thorne',
          'cognito:groups': ['Administrators'],
          'custom:department': 'Campus Administration'
        }
      });

      const user = await adapter.getCurrentUser();
      expect(user).not.toBeNull();
      expect(user?.role).toBe('admin');
      expect(user?.email).toBe('admin.officer@campus.edu');
    });

    it('does not grant admin role if user belongs to other groups but not Administrators', async () => {
      const adapter = new CognitoAuthAdapter(cognitoConfig);
      const userManager = (adapter as any).userManager;

      userManager.getUser = vi.fn().mockResolvedValue({
        expired: false,
        profile: {
          sub: 'faculty-sub-101',
          email: 'prof.smith@campus.edu',
          name: 'Prof Smith',
          'cognito:groups': ['Faculty', 'Staff']
        }
      });

      const user = await adapter.getCurrentUser();
      expect(user).not.toBeNull();
      expect(user?.role).toBe('student'); // Non-Administrators default safely to student
    });
  });

  describe('Requirement 5e: Cognito login, logout, and token handling remain intact', () => {
    it('initiates Cognito login with proper PKCE redirect parameters', async () => {
      const adapter = new CognitoAuthAdapter(cognitoConfig);
      const userManager = (adapter as any).userManager;
      userManager.signinRedirect = vi.fn().mockResolvedValue(undefined);

      await adapter.loginWithCognito();
      expect(userManager.signinRedirect).toHaveBeenCalledTimes(1);
      expect(userManager.signinRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          redirect_uri: 'http://localhost:5173/',
          scope: 'openid email'
        })
      );
    });

    it('returns raw ID token from OIDC user for Lambda API requests', async () => {
      const adapter = new CognitoAuthAdapter(cognitoConfig);
      const userManager = (adapter as any).userManager;

      userManager.getUser = vi.fn().mockResolvedValue({
        expired: false,
        id_token: 'verified.jwt.id_token_value'
      });

      const idToken = await adapter.getIdToken();
      expect(idToken).toBe('verified.jwt.id_token_value');
    });

    it('performs full logout by revoking user session and directing to Cognito logout URL', async () => {
      const service = new CompositeAuthService({
        mockAuthEnabled: false,
        customCognitoConfig: cognitoConfig
      });

      const adapter = (service as any).cognitoAdapter;
      const userManager = (adapter as any).userManager;
      userManager.removeUser = vi.fn().mockResolvedValue(undefined);

      // Verify logout URL
      const logoutUrl = service.getLogoutUrl();
      expect(logoutUrl).toContain('logout?client_id=4oq0kq3qljmhdu8rmbjclt94sl');
      expect(logoutUrl).toContain('logout_uri=http%3A%2F%2Flocalhost%3A5173%2F');

      await service.logout();
      expect(userManager.removeUser).toHaveBeenCalledTimes(1);
      expect(window.location.href).toBe(logoutUrl);
    });
  });
});
