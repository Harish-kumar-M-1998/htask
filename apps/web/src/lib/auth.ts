import type { AuthUser } from '@htask/shared';
import { ROLES } from '@htask/shared';

export const TEAM_MEMBER_NAV_PATHS = ['/tasks', '/projects', '/search', '/profile', '/settings'] as const;

const ELEVATED_ROLES = [ROLES.MANAGER, ROLES.TEAM_LEAD, ROLES.PMO, ROLES.QA] as const;

export function isTeamMemberOnly(user: AuthUser | null | undefined): boolean {
  if (!user?.roles.length) return false;
  if (!user.roles.includes(ROLES.TEAM_MEMBER)) return false;
  return !user.roles.some((role) => (ELEVATED_ROLES as readonly string[]).includes(role));
}

export function defaultHomePath(user: AuthUser | null | undefined): string {
  return isTeamMemberOnly(user) ? '/tasks' : '/';
}

export function isPathAllowedForTeamMember(pathname: string): boolean {
  return TEAM_MEMBER_NAV_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}
