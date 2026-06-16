import { formatDate, formatRelativeTime } from '@/lib/utils';
import { formatTaskStatus } from '@htask/shared';

interface HistoryEntry {
  id: string;
  action: string;
  description?: string | null;
  fromStatus?: string | null;
  toStatus?: string | null;
  actorName: string;
  createdAt: string;
  changes?: unknown;
}

function formatActivityMessage(entry: HistoryEntry): string {
  if (entry.action === 'TRANSITION' && entry.fromStatus && entry.toStatus) {
    return `Changed status from ${formatTaskStatus(entry.fromStatus)} to ${formatTaskStatus(entry.toStatus)}`;
  }

  if (entry.description) {
    return entry.description;
  }

  switch (entry.action) {
    case 'CREATED':
      return 'Created this task';
    case 'UPDATED':
      return 'Updated task details';
    case 'DELETED':
      return 'Deleted this task';
    case 'COMMENT':
      return 'Added a comment';
    default:
      return entry.action.replace(/_/g, ' ').toLowerCase();
  }
}

export function TaskActivityLog({ history }: { history: HistoryEntry[] }) {
  if (!history.length) {
    return <p className="text-sm text-muted-foreground px-1">No activity yet</p>;
  }

  return (
    <div className="divide-y divide-border/60">
      {history.map((entry) => {
        const message = formatActivityMessage(entry);
        const isTransition = entry.action === 'TRANSITION';

        return (
          <div key={entry.id} className="flex gap-3 py-3 first:pt-0">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{entry.actorName}</p>
              <p
                className={
                  isTransition
                    ? 'mt-0.5 font-mono text-sm text-emerald-600 dark:text-emerald-400'
                    : 'mt-0.5 text-sm text-muted-foreground'
                }
              >
                {message}
              </p>
              <p
                className="mt-1 text-xs text-muted-foreground"
                title={formatDate(entry.createdAt)}
              >
                {formatRelativeTime(entry.createdAt)} · {formatDate(entry.createdAt)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function countActivities(history: HistoryEntry[]): number {
  return history.length;
}

/** @deprecated Use countActivities */
export function countTransitions(history: HistoryEntry[]): number {
  return countActivities(history);
}
