import { User, UserRole } from '../types';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX_32_PATTERN = /^[0-9a-f]{32}$/i;

/**
 * Checks whether a given string is a UUID or hex-generated user identifier.
 */
export function isUuidString(value?: string | null): boolean {
  if (!value || typeof value !== 'string') {
    return false;
  }
  const trimmed = value.trim();
  return UUID_PATTERN.test(trimmed) || HEX_32_PATTERN.test(trimmed);
}

/**
 * Returns a human-readable display name for the user.
 * If a reliable, non-UUID name is available, it is returned.
 * Otherwise, it falls back to a sensible role-based name ("Administrator" or "Student").
 */
export function getUserDisplayName(
  user?: Partial<User> | null,
  fallbackRole?: UserRole
): string {
  const role: UserRole = user?.role || fallbackRole || 'student';

  if (user?.name) {
    const trimmed = user.name.trim();
    // Ensure the name is neither a UUID, empty, nor identical to the user's ID
    if (trimmed.length > 0 && !isUuidString(trimmed) && trimmed.toLowerCase() !== user?.id?.toLowerCase()) {
      return trimmed;
    }
  }

  return role === 'admin' ? 'Administrator' : 'Student';
}

/**
 * Returns safe avatar initials generated from the display name or role fallback.
 * Never generates initials from a Cognito UUID.
 */
export function getUserInitials(
  user?: Partial<User> | null,
  fallbackRole?: UserRole
): string {
  const displayName = getUserDisplayName(user, fallbackRole);
  const parts = displayName.trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    const first = parts[0][0] || '';
    const last = parts[parts.length - 1][0] || '';
    return (first + last).toUpperCase();
  }

  if (parts.length === 1 && parts[0].length >= 2) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  if (parts.length === 1 && parts[0].length === 1) {
    return parts[0].toUpperCase();
  }

  const role: UserRole = user?.role || fallbackRole || 'student';
  return role === 'admin' ? 'AD' : 'ST';
}

/**
 * Returns the user's email if available, or null if missing.
 */
export function getUserEmail(user?: Partial<User> | null): string | null {
  if (!user?.email || typeof user.email !== 'string') {
    return null;
  }
  const trimmed = user.email.trim();
  return trimmed.length > 0 && trimmed.includes('@') ? trimmed : null;
}

/**
 * Returns a clean role label.
 */
export function getUserRoleLabel(role?: UserRole): string {
  return role === 'admin' ? 'Administrator' : 'Student';
}
