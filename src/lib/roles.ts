export type UserRole = 'admin' | 'manager' | 'analyst' | 'viewer' | 'user';

const KNOWN_ROLES = new Set<UserRole>([
  'admin',
  'manager',
  'analyst',
  'viewer',
  'user',
]);

export function normalizeRole(role: string | null | undefined): UserRole {
  const normalized = (role || '').toLowerCase() as UserRole;
  if (KNOWN_ROLES.has(normalized)) {
    return normalized;
  }
  return 'viewer';
}

export function canEditAssessments(role: UserRole | null | undefined): boolean {
  const normalized = normalizeRole(role);
  return normalized === 'admin' || normalized === 'manager' || normalized === 'analyst' || normalized === 'user';
}
