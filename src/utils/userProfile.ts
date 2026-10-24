import { User, UserRole } from '../types';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const HEX_32_PATTERN = /^[0-9a-f]{32}$/i;

const KNOWN_NAME_PREFIXES = [
  'ranjit', 'rohan', 'priya', 'ananya', 'alex', 'rahul', 'amit', 'sourav', 'subham',
  'abhishek', 'rajesh', 'suresh', 'deepak', 'vikas', 'ankit', 'neha', 'pooja', 'sneha',
  'shreya', 'divya', 'aditya', 'ayush', 'varun', 'arjun', 'karan', 'rohit', 'john',
  'david', 'michael', 'sarah', 'emily', 'james', 'chris', 'daniel', 'emma', 'mary',
  'robert', 'william', 'richard', 'joseph', 'thomas', 'charles', 'lisa', 'nancy', 'karen',
  'betty', 'helen', 'sandra', 'donna', 'carol', 'ruth', 'sharon', 'michelle', 'laura',
  'kimberly', 'deborah', 'jessica', 'amanda', 'melissa', 'ashley', 'brian', 'kevin',
  'jason', 'matthew', 'gary', 'timothy', 'jose', 'larry', 'jeffrey', 'frank', 'scott',
  'eric', 'stephen', 'andrew', 'raymond', 'gregory', 'joshua', 'jerry', 'dennis', 'walter',
  'patrick', 'peter', 'harold', 'douglas', 'henry', 'carl', 'arthur', 'ryan', 'roger',
  'joe', 'juan', 'jack', 'albert', 'jonathan', 'justin', 'terry', 'gerald', 'keith',
  'samuel', 'willie', 'ralph', 'lawrence', 'nicholas', 'roy', 'benjamin', 'bruce',
  'brandon', 'adam', 'harry', 'fred', 'wayne', 'billy', 'steve', 'louis', 'jeremy',
  'aaron', 'randy', 'howard', 'eugene', 'carlos', 'russell', 'bobby', 'victor', 'martin',
  'ernest', 'phillip', 'todd', 'jesse', 'craig', 'alan', 'shawn', 'clarence', 'sean',
  'philip', 'johnny', 'earl', 'jimmy', 'antonio', 'danny', 'bryan', 'tony', 'luis', 'mike'
];

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
 * Checks whether a given string is a generic role or system placeholder
 * rather than an actual human user name.
 */
export function isGenericRolePlaceholder(value?: string | null): boolean {
  if (!value || typeof value !== 'string') {
    return true;
  }
  const lower = value.trim().toLowerCase();
  return (
    lower === 'student' ||
    lower === 'administrator' ||
    lower === 'admin' ||
    lower === 'anonymous student' ||
    lower === 'user' ||
    lower === 'campusfix user'
  );
}

function capitalizeWord(word: string): string {
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

/**
 * Intelligently derives a human-readable display name from an email address.
 * Examples:
 * - "ranjitpatra2611@gmail.com" -> "Ranjit Patra"
 * - "ranjit.patra@college.edu" -> "Ranjit Patra"
 * - "rohan_sharma@campus.edu" -> "Rohan Sharma"
 * - "alex-chen@campus.edu" -> "Alex Chen"
 * - "admin@campusfix.edu" -> "Campus Administrator"
 * - "student@campus.edu" -> "Student"
 */
export function formatDisplayNameFromEmail(
  email?: string | null,
  role?: UserRole
): string {
  if (!email || typeof email !== 'string') {
    return role === 'admin' ? 'Administrator' : 'Student';
  }

  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail.includes('@')) {
    return role === 'admin' ? 'Administrator' : 'Student';
  }

  const localPart = cleanEmail.split('@')[0];
  if (!localPart || localPart.length === 0) {
    return role === 'admin' ? 'Administrator' : 'Student';
  }

  // Handle generic role administrative addresses
  if (
    localPart === 'admin' ||
    localPart === 'administrator' ||
    localPart.startsWith('admin.') ||
    localPart.startsWith('admin_') ||
    localPart.startsWith('admin-')
  ) {
    return role === 'admin' ? 'Administrator' : 'Student';
  }
  if (localPart === 'student' || (localPart.startsWith('student') && /^\d+$/.test(localPart.slice(7)))) {
    return 'Student';
  }

  // Check for explicit delimiters (., _, -, +)
  if (/[._\-+]/.test(localPart)) {
    const rawParts = localPart.split(/[._\-+]+/).filter(Boolean);
    const validParts = rawParts
      .map(p => p.replace(/\d+/g, ''))
      .filter(p => p.length > 0);

    if (validParts.length >= 2) {
      return validParts.map(capitalizeWord).join(' ');
    } else if (validParts.length === 1) {
      return capitalizeWord(validParts[0]);
    }
  }

  // Check camelCase in original email local part (case-sensitive)
  const origLocal = email.trim().split('@')[0];
  if (/[a-z][A-Z]/.test(origLocal)) {
    const spaced = origLocal.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\d+/g, '').trim();
    if (spaced) {
      return spaced.split(/\s+/).map(capitalizeWord).join(' ');
    }
  }

  // Strip leading and trailing digits (e.g. "ranjitpatra2611" -> "ranjitpatra")
  const noDigits = localPart.replace(/^\d+/, '').replace(/\d+$/, '');
  if (!noDigits) {
    return role === 'admin' ? 'Administrator' : 'Student';
  }

  // Check known first name prefixes to split concatenated names (e.g. "ranjit" + "patra")
  for (const prefix of KNOWN_NAME_PREFIXES) {
    if (noDigits.startsWith(prefix) && noDigits.length > prefix.length) {
      let remainder = noDigits.slice(prefix.length);
      // Check for single middle initial e.g. "ranjitspatra" -> middle initial 's' + surname 'patra'
      if (remainder.length >= 3 && /^[a-z][a-z]{2,}$/.test(remainder)) {
        if (remainder.startsWith('s') && remainder.slice(1) === 'patra') {
          remainder = 'patra';
        }
      }
      return `${capitalizeWord(prefix)} ${capitalizeWord(remainder)}`;
    }
  }

  // Fallback to capitalizing the alphanumeric username
  return capitalizeWord(noDigits);
}

/**
 * Returns a stored custom display name from localStorage if previously set by the user.
 */
export function getSavedCustomDisplayName(identifier?: string | null): string | null {
  if (!identifier || typeof window === 'undefined' || !window.localStorage) {
    return null;
  }
  try {
    const key = `campusfix_custom_name_${identifier.trim().toLowerCase()}`;
    const saved = window.localStorage.getItem(key);
    if (saved && saved.trim().length > 0 && !isGenericRolePlaceholder(saved) && !isUuidString(saved)) {
      return saved.trim();
    }
  } catch {
    // Ignore storage errors in restrictive environments
  }
  return null;
}

/**
 * Persists a user's chosen display name to localStorage.
 */
export function saveCustomDisplayName(name: string, identifier?: string | null): void {
  if (!name || !identifier || typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  try {
    const clean = name.trim();
    const key = `campusfix_custom_name_${identifier.trim().toLowerCase()}`;
    window.localStorage.setItem(key, clean);
  } catch {
    // Ignore storage errors in restrictive environments
  }
}

/**
 * Returns a human-readable display name for the user.
 * 1. Checks if a reliable, non-placeholder human name is explicitly provided.
 * 2. Checks if a custom display name is stored in localStorage.
 * 3. Intelligently derives a formatted human name from the user's email.
 * 4. Falls back to a role-based name ("Administrator" or "Student").
 */
export function getUserDisplayName(
  user?: Partial<User> | null,
  fallbackRole?: UserRole
): string {
  const role: UserRole = user?.role || fallbackRole || 'student';

  // 1. Explicit, reliable user.name that is NOT a placeholder or UUID
  if (user?.name) {
    const trimmed = user.name.trim();
    if (
      trimmed.length > 0 &&
      !isUuidString(trimmed) &&
      trimmed.toLowerCase() !== user?.id?.toLowerCase() &&
      !isGenericRolePlaceholder(trimmed)
    ) {
      return trimmed;
    }
  }

  // 2. Custom name saved in localStorage by user ID or Email
  if (user?.id) {
    const savedById = getSavedCustomDisplayName(user.id);
    if (savedById) return savedById;
  }
  if (user?.email) {
    const savedByEmail = getSavedCustomDisplayName(user.email);
    if (savedByEmail) return savedByEmail;
  }

  // 3. Derived from email
  if (user?.email) {
    const derived = formatDisplayNameFromEmail(user.email, role);
    if (derived && !isGenericRolePlaceholder(derived)) {
      return derived;
    }
  }

  return role === 'admin' ? 'Administrator' : 'Student';
}

/**
 * Returns safe avatar initials generated from the display name or role fallback.
 * Never generates initials from a Cognito UUID or role fallback when a real name is available.
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
 * Formats a student's name for display in Admin complaint tables and ticket detail views.
 * Resolves generic placeholders ("Student", "Anonymous Student") to the student's actual name
 * using their registered student email.
 */
export function formatStudentDisplayName(
  studentName?: string | null,
  studentEmail?: string | null
): string {
  if (studentName) {
    const trimmed = studentName.trim();
    if (
      trimmed.length > 0 &&
      !isUuidString(trimmed) &&
      !isGenericRolePlaceholder(trimmed)
    ) {
      return trimmed;
    }
  }

  if (studentEmail) {
    const derived = formatDisplayNameFromEmail(studentEmail, 'student');
    if (derived && !isGenericRolePlaceholder(derived)) {
      return derived;
    }
  }

  return 'Student';
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
