import { describe, it, expect } from 'vitest';
import { CognitoAuthService, ITokenVerifier } from '../src/auth.js';
import { BackendConfig } from '../src/config.js';
import { UnauthorizedError, ForbiddenError } from '../src/errors.js';

describe('CognitoAuthService & Group Authorization', () => {
  const testConfig: BackendConfig = {
    awsRegion: 'ap-southeast-2',
    tableName: 'CampusFixComplaints',
    cognitoUserPoolId: 'ap-southeast-2_tNhqL8tGi',
    cognitoClientId: '4oq0kq3qljmhdu8rmbjclt94sl',
    cognitoAdminGroup: 'Administrators',
    allowedOrigin: 'http://localhost:5173'
  };

  it('correctly extracts Bearer token from header', () => {
    const authService = new CognitoAuthService(testConfig);
    expect(authService.extractBearerToken('Bearer valid_token_12345')).toBe('valid_token_12345');
    expect(authService.extractBearerToken('bearer lower_case_bearer')).toBe('lower_case_bearer');
  });

  it('rejects missing or malformed Authorization headers with 401', () => {
    const authService = new CognitoAuthService(testConfig);
    expect(() => authService.extractBearerToken(undefined)).toThrow(UnauthorizedError);
    expect(() => authService.extractBearerToken('')).toThrow(UnauthorizedError);
    expect(() => authService.extractBearerToken('Basic dXNlcjpwYXNz')).toThrow(
      /Format must be "Bearer <id_token>"/
    );
    expect(() => authService.extractBearerToken('Bearer ')).toThrow(UnauthorizedError);
  });

  it('authenticates verified student claims from Cognito ID token', async () => {
    const mockVerifier: ITokenVerifier = {
      verify: async (token: string) => {
        if (token === 'student_jwt') {
          return {
            sub: 'sub-student-001',
            email: 'priya.sharma@campus.edu',
            name: 'Priya Sharma',
            'cognito:groups': ['Students'],
            'cognito:username': 'priya.sharma',
            iss: 'https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_tNhqL8tGi',
            aud: '4oq0kq3qljmhdu8rmbjclt94sl',
            token_use: 'id',
            exp: Date.now() / 1000 + 3600
          } as any;
        }
        throw new Error('Token signature invalid');
      }
    };

    const authService = new CognitoAuthService(testConfig, mockVerifier);
    const user = await authService.authenticate('Bearer student_jwt');

    expect(user.sub).toBe('sub-student-001');
    expect(user.email).toBe('priya.sharma@campus.edu');
    expect(user.name).toBe('Priya Sharma');
    expect(user.isAdmin).toBe(false);

    // Verifying student cannot pass requireAdmin check
    expect(() => authService.requireAdmin(user)).toThrow(ForbiddenError);
  });

  it('authenticates verified admin claims from Cognito ID token with Administrators group', async () => {
    const mockVerifier: ITokenVerifier = {
      verify: async (token: string) => {
        if (token === 'admin_jwt') {
          return {
            sub: 'sub-admin-999',
            email: 'admin.ops@campusfix.edu',
            name: 'Dr. Aris Thorne',
            'cognito:groups': ['Administrators'],
            'cognito:username': 'admin.ops',
            iss: 'https://cognito-idp.ap-southeast-2.amazonaws.com/ap-southeast-2_tNhqL8tGi',
            aud: '4oq0kq3qljmhdu8rmbjclt94sl',
            token_use: 'id',
            exp: Date.now() / 1000 + 3600
          } as any;
        }
        throw new Error('Token signature invalid');
      }
    };

    const authService = new CognitoAuthService(testConfig, mockVerifier);
    const user = await authService.authenticate('Bearer admin_jwt');

    expect(user.sub).toBe('sub-admin-999');
    expect(user.email).toBe('admin.ops@campusfix.edu');
    expect(user.isAdmin).toBe(true);

    // Admin passes requireAdmin check without throwing
    expect(() => authService.requireAdmin(user)).not.toThrow();
  });

  it('rejects expired or invalid ID tokens with UnauthorizedError', async () => {
    const mockVerifier: ITokenVerifier = {
      verify: async () => {
        throw new Error('jwt expired');
      }
    };

    const authService = new CognitoAuthService(testConfig, mockVerifier);
    await expect(authService.authenticate('Bearer expired_jwt')).rejects.toThrow(
      UnauthorizedError
    );
  });
});
