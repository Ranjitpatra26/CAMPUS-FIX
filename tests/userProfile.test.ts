import { describe, it, expect } from 'vitest';
import {
  isUuidString,
  getUserDisplayName,
  getUserInitials,
  getUserEmail,
  getUserRoleLabel
} from '../src/utils/userProfile';
import { CognitoAuthAdapter } from '../src/services/auth/cognitoAuthAdapter';
import { User } from '../src/types';

describe('UserProfile Utilities & UI Privacy Protection', () => {
  const sampleUuid = 'c6c8c3e8-54c3-7067-8cf1-85b46e300947';
  const sampleUppercaseUuid = '848F0863-82A7-4E66-9C20-FEE869BF6848';
  const sampleHex32 = 'c6c8c3e854c370678cf185b46e300947';

  describe('isUuidString', () => {
    it('detects standard lowercase and uppercase UUIDs', () => {
      expect(isUuidString(sampleUuid)).toBe(true);
      expect(isUuidString(sampleUppercaseUuid)).toBe(true);
      expect(isUuidString(sampleHex32)).toBe(true);
    });

    it('rejects human names and regular strings', () => {
      expect(isUuidString('Rohan Sharma')).toBe(false);
      expect(isUuidString('Dr. Aris Thorne')).toBe(false);
      expect(isUuidString('Administrator')).toBe(false);
      expect(isUuidString('Student')).toBe(false);
      expect(isUuidString('admin@campusfix.edu')).toBe(false);
      expect(isUuidString('')).toBe(false);
      expect(isUuidString(null)).toBe(false);
      expect(isUuidString(undefined)).toBe(false);
    });
  });

  describe('getUserDisplayName', () => {
    it('displays human-readable name when reliable name attribute is present', () => {
      const user: User = {
        id: sampleUuid,
        name: 'Dr. Aris Thorne',
        email: 'admin@campusfix.edu',
        role: 'admin'
      };
      expect(getUserDisplayName(user)).toBe('Dr. Aris Thorne');
    });

    it('falls back to "Administrator" when admin user has missing or empty name', () => {
      const userWithoutName: Partial<User> = {
        id: sampleUuid,
        name: '',
        email: 'admin@campusfix.edu',
        role: 'admin'
      };
      expect(getUserDisplayName(userWithoutName)).toBe('Administrator');

      const userWithNullName: Partial<User> = {
        id: sampleUuid,
        email: 'admin@campusfix.edu',
        role: 'admin'
      };
      expect(getUserDisplayName(userWithNullName)).toBe('Administrator');
    });

    it('falls back to "Student" when student user has missing or empty name', () => {
      const studentWithoutName: Partial<User> = {
        id: sampleUuid,
        name: '',
        email: 'student@campus.edu',
        role: 'student'
      };
      expect(getUserDisplayName(studentWithoutName)).toBe('Student');
    });

    it('CRITICAL: Never displays Cognito UUID when user name is a UUID', () => {
      const adminWithUuidAsName: User = {
        id: sampleUuid,
        name: sampleUuid, // e.g. Cognito username passed as name
        email: 'admin@campusfix.edu',
        role: 'admin'
      };
      const result = getUserDisplayName(adminWithUuidAsName);
      expect(result).toBe('Administrator');
      expect(result).not.toContain(sampleUuid);

      const studentWithUuidAsName: User = {
        id: sampleUuid,
        name: sampleUppercaseUuid,
        email: 'student@campus.edu',
        role: 'student'
      };
      const studentResult = getUserDisplayName(studentWithUuidAsName);
      expect(studentResult).toBe('Student');
      expect(studentResult).not.toContain(sampleUppercaseUuid);
    });

    it('handles null or undefined user safely without throwing', () => {
      expect(getUserDisplayName(null, 'admin')).toBe('Administrator');
      expect(getUserDisplayName(undefined, 'student')).toBe('Student');
      expect(getUserDisplayName(null)).toBe('Student');
    });
  });

  describe('getUserInitials', () => {
    it('generates initials from first and last word of human display name', () => {
      expect(getUserInitials({ name: 'Rohan Sharma', role: 'student' })).toBe('RS');
      expect(getUserInitials({ name: 'Dr. Aris Thorne', role: 'admin' })).toBe('DT');
      expect(getUserInitials({ name: 'Maya Lin', role: 'student' })).toBe('ML');
    });

    it('generates initials from single-word names', () => {
      expect(getUserInitials({ name: 'Maya', role: 'student' })).toBe('MA');
      expect(getUserInitials({ name: 'A', role: 'student' })).toBe('A');
    });

    it('uses role-based initials when name is missing', () => {
      expect(getUserInitials({ role: 'admin' })).toBe('AD');
      expect(getUserInitials({ role: 'student' })).toBe('ST');
      expect(getUserInitials(null, 'admin')).toBe('AD');
      expect(getUserInitials(null, 'student')).toBe('ST');
    });

    it('CRITICAL: Never generates initials from a Cognito UUID', () => {
      // If name is a UUID like 'c6c8c3e8-54c3-7067-8cf1-85b46e300947',
      // naive initials would be 'C6' or 'C4'.
      // With safe fallback, it derives initials from 'Administrator' ('AD') or 'Student' ('ST').
      const adminWithUuid: User = {
        id: sampleUuid,
        name: sampleUuid,
        email: 'admin@campusfix.edu',
        role: 'admin'
      };
      const adminInitials = getUserInitials(adminWithUuid);
      expect(adminInitials).toBe('AD');
      expect(adminInitials).not.toBe('C6');

      const studentWithUuid: User = {
        id: sampleUuid,
        name: sampleUuid,
        email: 'student@campus.edu',
        role: 'student'
      };
      const studentInitials = getUserInitials(studentWithUuid);
      expect(studentInitials).toBe('ST');
      expect(studentInitials).not.toBe('C6');
    });
  });

  describe('getUserEmail', () => {
    it('returns clean email when valid email string is present', () => {
      expect(getUserEmail({ email: 'rohan.sharma@campus.edu' })).toBe('rohan.sharma@campus.edu');
      expect(getUserEmail({ email: '  admin@campusfix.edu  ' })).toBe('admin@campusfix.edu');
    });

    it('returns null when email is missing, empty, or invalid', () => {
      expect(getUserEmail({})).toBeNull();
      expect(getUserEmail({ email: '' })).toBeNull();
      expect(getUserEmail({ email: 'not-an-email' })).toBeNull();
      expect(getUserEmail(null)).toBeNull();
    });
  });

  describe('CognitoAuthAdapter.mapOidcUserToAppUser', () => {
    const adapter = new CognitoAuthAdapter({
      region: 'ap-southeast-2',
      userPoolId: 'ap-southeast-2_tNhqL8tGi',
      clientId: '4oq0kq3qljmhdu8rmbjclt94sl',
      domain: 'ap-southeast-2tnhql8tgi.auth.ap-southeast-2.amazoncognito.com',
      redirectUri: 'http://localhost:5173/'
    });

    it('preserves Cognito sub internally in user.id while setting human-readable name', () => {
      const mockOidcUser: any = {
        profile: {
          sub: sampleUuid,
          email: 'admin.user@campusfix.edu',
          name: 'Jane Doe',
          'cognito:groups': ['Administrators']
        }
      };

      const mapped = (adapter as any).mapOidcUserToAppUser(mockOidcUser);
      // Cognito sub is preserved internally
      expect(mapped.id).toBe(sampleUuid);
      // Human-readable name is used
      expect(mapped.name).toBe('Jane Doe');
      expect(mapped.email).toBe('admin.user@campusfix.edu');
      expect(mapped.role).toBe('admin');
    });

    it('falls back to "Administrator" when Cognito profile has no name and cognito:username is a UUID', () => {
      const mockOidcUserWithoutName: any = {
        profile: {
          sub: sampleUuid,
          'cognito:username': sampleUuid,
          email: 'admin.estate@campusfix.edu',
          'cognito:groups': ['Administrators']
        }
      };

      const mapped = (adapter as any).mapOidcUserToAppUser(mockOidcUserWithoutName);
      // Must preserve UUID internally
      expect(mapped.id).toBe(sampleUuid);
      // Name MUST be "Administrator", NEVER the UUID!
      expect(mapped.name).toBe('Administrator');
      expect(mapped.name).not.toBe(sampleUuid);
      expect(mapped.role).toBe('admin');
    });

    it('falls back to "Student" when Cognito profile has no name for a standard student', () => {
      const mockStudentOidcUser: any = {
        profile: {
          sub: sampleUuid,
          'cognito:username': sampleUuid,
          email: 'student123@campus.edu',
          'cognito:groups': ['Students']
        }
      };

      const mapped = (adapter as any).mapOidcUserToAppUser(mockStudentOidcUser);
      expect(mapped.id).toBe(sampleUuid);
      expect(mapped.name).toBe('Student');
      expect(mapped.name).not.toBe(sampleUuid);
      expect(mapped.role).toBe('student');
    });

    it('filters out UUID custom:student_id so UUIDs are not displayed as IDs', () => {
      const mockOidcUserWithUuidStudentId: any = {
        profile: {
          sub: sampleUuid,
          'custom:student_id': sampleUuid,
          email: 'student@campus.edu',
          'cognito:groups': ['Students']
        }
      };

      const mapped = (adapter as any).mapOidcUserToAppUser(mockOidcUserWithUuidStudentId);
      expect(mapped.studentId).toBeUndefined();
    });
  });
});
