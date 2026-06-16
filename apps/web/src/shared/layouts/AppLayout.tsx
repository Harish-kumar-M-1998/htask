import { useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isTeamMemberOnly } from '@/lib/auth';
import { useAuthStore, useUIStore } from '@/store';
import { SidebarContent } from '@/shared/layouts/Sidebar';
import { applyAppearance } from '@/lib/appearance';

export function AppLayout() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { theme, setTheme, sidebarOpen, toggleSidebar, mobileNav, setMobileNav, setWidgetOpen } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();

  const teamMemberOnly = isTeamMemberOnly(user);
  const permissions = user?.permissions ?? [];
  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

  const colorTheme = useUIStore((s) => s.colorTheme);
  const compactUI = useUIStore((s) => s.compactUI);
  const reduceMotionUI = useUIStore((s) => s.reduceMotionUI);

  useEffect(() => {
    applyAppearance({ colorTheme, compactUI, reduceMotionUI });
  }, [colorTheme, compactUI, reduceMotionUI]);

  useEffect(() => {
    setMobileNav(false);
    setWidgetOpen(false);
  }, [location.pathname, setMobileNav, setWidgetOpen]);

  useEffect(() => {
    document.body.style.overflow = mobileNav ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileNav]);

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const sidebarProps = {
    isDark,
    teamMemberOnly,
    permissions,
    roles: user?.roles ?? [],
    onToggleTheme: toggleTheme,
    onLogout: handleLogout,
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden lg:flex shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-200 ease-in-out',
          sidebarOpen ? 'w-60' : 'w-[72px]',
        )}
      >
        <SidebarContent
          {...sidebarProps}
          collapsed={!sidebarOpen}
          onToggleCollapse={toggleSidebar}
        />
      </aside>

      {/* Mobile slide-out drawer */}
      {mobileNav && (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileNav(false)}
            aria-label="Close menu"
          />
          <aside className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-border bg-sidebar shadow-xl lg:hidden transition-transform duration-200">
            <SidebarContent
              {...sidebarProps}
              mobile
              onClose={() => setMobileNav(false)}
            />
          </aside>
        </>
      )}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile top bar */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-sidebar px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileNav(true)}
            className="rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white dark:bg-white dark:text-neutral-900">
              H
            </div>
            <span className="truncate text-base font-bold tracking-tight">Htask</span>
          </div>
        </header>

        <main className="flex flex-1 min-h-0 min-w-0 flex-col overflow-hidden p-5 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
