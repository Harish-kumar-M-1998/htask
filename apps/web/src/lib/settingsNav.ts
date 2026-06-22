import type { LucideIcon } from 'lucide-react';
import { Bell, Building2, GitBranch, Palette, Shield, ShieldCheck } from 'lucide-react';
import { PERMISSIONS, ROLES } from '@htask/shared';

export type SettingsNavItem = {
  id: string;
  to: string;
  label: string;
  description: string;
  icon: LucideIcon;
  /** Visible to every authenticated user */
  public?: boolean;
  /** Requires MANAGER role */
  managerOnly?: boolean;
  /** Requires at least one of these permissions */
  permissions?: string[];
};

export const SETTINGS_NAV: SettingsNavItem[] = [
  {
    id: 'general',
    to: '/settings/general',
    label: 'General',
    description: 'Organization name and defaults',
    icon: Building2,
    managerOnly: true,
  },
  {
    id: 'appearance',
    to: '/settings/appearance',
    label: 'Appearance',
    description: 'Theme, density, and accent color',
    icon: Palette,
    public: true,
  },
  {
    id: 'workflow',
    to: '/settings/workflow',
    label: 'Workflow',
    description: 'Statuses, transitions, and Kanban rules',
    icon: GitBranch,
    permissions: [PERMISSIONS.WORKFLOW_READ],
  },
  {
    id: 'notifications',
    to: '/settings/notifications',
    label: 'Notifications',
    description: 'In-app alerts and email automation',
    icon: Bell,
    public: true,
  },
  {
    id: 'security',
    to: '/settings/security',
    label: 'Security',
    description: 'Audit log and session overview',
    icon: Shield,
    permissions: [PERMISSIONS.AUDIT_READ],
  },
  {
    id: 'roles',
    to: '/settings/roles',
    label: 'Roles & access',
    description: 'Permission matrix and your access',
    icon: ShieldCheck,
    managerOnly: true,
  },
];

export function getVisibleSettingsNav(
  permissions: string[],
  roles: string[],
): SettingsNavItem[] {
  const isManager = roles.includes(ROLES.MANAGER);

  return SETTINGS_NAV.filter((item) => {
    if (item.public) return true;
    if (item.managerOnly && !isManager) return false;
    if (item.permissions?.length) {
      return item.permissions.some((p) => permissions.includes(p));
    }
    return true;
  });
}

export function getDefaultSettingsPath(permissions: string[], roles: string[]): string {
  const visible = getVisibleSettingsNav(permissions, roles);
  return visible[0]?.to ?? '/settings/appearance';
}
