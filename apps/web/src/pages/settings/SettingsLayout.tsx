import type { ReactNode } from 'react';
import { Outlet, NavLink, Navigate, useLocation } from 'react-router';
import { NotificationBell } from '@/shared/components/NotificationBell';
import { useAuthStore } from '@/store';
import { getDefaultSettingsPath, getVisibleSettingsNav } from '@/lib/settingsNav';
import { cn } from '@/lib/utils';

function SettingsGuard({ children }: { children: ReactNode }) {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const permissions = user?.permissions ?? [];
  const roles = user?.roles ?? [];
  const visible = getVisibleSettingsNav(permissions, roles);
  const allowedPaths = visible.map((item) => item.to);

  if (location.pathname === '/settings' || location.pathname === '/settings/') {
    return <Navigate to={getDefaultSettingsPath(permissions, roles)} replace />;
  }

  const isAllowed = allowedPaths.some(
    (path) => location.pathname === path || location.pathname.startsWith(`${path}/`),
  );

  if (!isAllowed) {
    return <Navigate to={getDefaultSettingsPath(permissions, roles)} replace />;
  }

  return <>{children}</>;
}

export function SettingsLayout() {
  const user = useAuthStore((s) => s.user);
  const permissions = user?.permissions ?? [];
  const roles = user?.roles ?? [];
  const visibleNav = getVisibleSettingsNav(permissions, roles);

  return (
    <SettingsGuard>
      <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
        <div className="shrink-0 flex items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Configuration and role-based preferences
            </p>
          </div>
          <NotificationBell />
        </div>

        <div className="flex flex-1 min-h-0 min-w-0 gap-6 overflow-hidden flex-col sm:flex-row">
          <aside className="w-full sm:w-52 shrink-0 overflow-x-auto sm:overflow-y-auto">
            <nav className="flex sm:flex-col gap-1 sm:space-y-0.5 pb-2 sm:pb-0">
              {visibleNav.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'block rounded-lg px-3 py-2 sm:py-2.5 transition-fast shrink-0 sm:shrink',
                      isActive
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                    )
                  }
                >
                  <div className="flex items-center gap-2.5">
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>
                  </div>
                  <p className="hidden sm:block text-[11px] text-muted-foreground mt-0.5 ml-6.5 pl-0.5 leading-snug">
                    {item.description}
                  </p>
                </NavLink>
              ))}
            </nav>
          </aside>

          <div className="flex-1 min-h-0 min-w-0 overflow-y-auto pb-6">
            <Outlet />
          </div>
        </div>
      </div>
    </SettingsGuard>
  );
}
