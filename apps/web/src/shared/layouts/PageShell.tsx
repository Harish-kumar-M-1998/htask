import type { ReactNode } from 'react';
import { NotificationBell } from '@/shared/components/NotificationBell';
import { WidgetTrigger } from '@/shared/components/WidgetTrigger';
interface PageShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}

export function PageShell({ title, subtitle, children, action }: PageShellProps) {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-foreground truncate">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1 truncate">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0 flex-wrap sm:justify-end overflow-visible p-0.5 -m-0.5">
          {action}
          <WidgetTrigger />
          <NotificationBell />
        </div>
      </div>
      <div className="flex flex-1 min-h-0 min-w-0 flex-col">
        {children}
      </div>
    </div>
  );
}
