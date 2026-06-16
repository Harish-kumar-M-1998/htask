import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  user: string;
  action: string;
  entity: string;
  timestamp: string;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getActionBadge(action: string) {
  const lower = action.toLowerCase();
  if (lower.includes('delete') || lower.includes('removed')) {
    return { label: 'deleted', className: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400' };
  }
  if (lower.includes('create') || lower.includes('added')) {
    return { label: 'created', className: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' };
  }
  if (lower.includes('update')) {
    return { label: 'updated', className: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' };
  }
  return { label: lower.replace(/_/g, ' '), className: 'bg-muted text-muted-foreground' };
}

export function ActivityFeed({ activities }: { activities: Activity[] }) {
  if (!activities.length) {
    return <p className="text-sm text-muted-foreground text-center py-10">No recent activity</p>;
  }

  return (
    <div className="space-y-5">
      {activities.map((activity) => {
        const badge = getActionBadge(activity.action);
        return (
          <div key={activity.id} className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 text-xs font-semibold dark:bg-violet-500/15 dark:text-violet-300">
              {getInitials(activity.user)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-sm font-semibold">{activity.user}</span>
                <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-semibold', badge.className)}>
                  {badge.label}
                </span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{activity.entity}</p>
              <p className="text-xs text-muted-foreground mt-1.5">{formatRelativeTime(activity.timestamp)}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
