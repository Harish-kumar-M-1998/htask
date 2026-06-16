import { NavLink } from 'react-router';
import {
  LayoutDashboard, ListTodo, FolderKanban, BarChart3,
  Search, Shield, LogOut, Moon, Sun, Users, Mail,
  PanelLeftClose, PanelLeft, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { TEAM_MEMBER_NAV_PATHS } from '@/lib/auth';
import { UserProfile } from '@/shared/components/UserProfile';

export const workspaceNav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/tasks', icon: ListTodo, label: 'Tasks' },
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  { to: '/team', icon: Users, label: 'Team', permission: 'user:read' },
  { to: '/reports', icon: BarChart3, label: 'Reports', permission: 'report:view' },
];

export const systemNav = [
  { to: '/search', icon: Search, label: 'Search', permission: 'search:use' },
  { to: '/audit', icon: Shield, label: 'Audit', permission: 'audit:read' },
  { to: '/settings/email', icon: Mail, label: 'Email', managerOnly: true },
];

type NavItem = (typeof workspaceNav)[number] | (typeof systemNav)[number];

function filterNavItems(
  items: NavItem[],
  teamMemberOnly: boolean,
  permissions: string[],
  roles: string[],
) {
  return items.filter((item) => {
    if (teamMemberOnly && !(TEAM_MEMBER_NAV_PATHS as readonly string[]).includes(item.to)) {
      return false;
    }
    if ('managerOnly' in item && item.managerOnly && !roles.includes('MANAGER')) {
      return false;
    }
    return !('permission' in item && item.permission) || permissions.includes(item.permission);
  });
}

function NavSection({
  title,
  items,
  collapsed,
  onNavigate,
}: {
  title: string;
  items: NavItem[];
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-1">
      {!collapsed && (
        <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </p>
      )}
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          title={collapsed ? item.label : undefined}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center rounded-lg py-2.5 text-sm font-medium transition-colors',
              collapsed ? 'justify-center px-2' : 'gap-3 px-3',
              isActive
                ? 'nav-active shadow-sm'
                : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )
          }
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{item.label}</span>}
        </NavLink>
      ))}
    </div>
  );
}

interface SidebarContentProps {
  collapsed?: boolean;
  mobile?: boolean;
  isDark: boolean;
  teamMemberOnly: boolean;
  permissions: string[];
  roles: string[];
  onToggleCollapse?: () => void;
  onClose?: () => void;
  onToggleTheme: () => void;
  onLogout: () => void;
}

export function SidebarContent({
  collapsed,
  mobile,
  isDark,
  teamMemberOnly,
  permissions,
  roles,
  onToggleCollapse,
  onClose,
  onToggleTheme,
  onLogout,
}: SidebarContentProps) {
  const workspaceItems = filterNavItems(workspaceNav, teamMemberOnly, permissions, roles);
  const systemItems = filterNavItems(systemNav, teamMemberOnly, permissions, roles);

  return (
    <>
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-border',
          collapsed ? 'justify-center px-2' : 'justify-between gap-3 px-4',
        )}
      >
        <div className={cn('flex items-center gap-3 min-w-0', collapsed && 'justify-center')}>
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white dark:bg-white dark:text-neutral-900">
            H
          </div>
          {!collapsed && <span className="truncate text-lg font-bold tracking-tight">Htask</span>}
        </div>

        {mobile && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {!mobile && onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className={cn(
              'rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0',
              collapsed && 'hidden',
            )}
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        <NavSection
          title="Workspace"
          items={workspaceItems}
          collapsed={collapsed}
          onNavigate={onClose}
        />
        <NavSection
          title="System"
          items={systemItems}
          collapsed={collapsed}
          onNavigate={onClose}
        />
      </nav>

      <div className="border-t border-border p-3">
        <div className="space-y-0.5">
          <button
            type="button"
            onClick={onToggleTheme}
            title={collapsed ? (isDark ? 'Light mode' : 'Dark mode') : undefined}
            className={cn(
              'flex w-full items-center rounded-lg py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors',
              collapsed ? 'justify-center px-2' : 'gap-3 px-3',
            )}
          >
            {isDark ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
            {!collapsed && <span>{isDark ? 'Light mode' : 'Dark mode'}</span>}
          </button>
          <button
            type="button"
            onClick={onLogout}
            title={collapsed ? 'Logout' : undefined}
            className={cn(
              'flex w-full items-center rounded-lg py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors',
              collapsed ? 'justify-center px-2' : 'gap-3 px-3',
            )}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>

        {!collapsed ? (
          <UserProfile className="mt-1 -mx-0" />
        ) : (
          <div className="mt-2 flex justify-center">
            <UserProfile compact />
          </div>
        )}

        {!mobile && collapsed && onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="mt-2 flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Expand sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        )}
      </div>
    </>
  );
}
