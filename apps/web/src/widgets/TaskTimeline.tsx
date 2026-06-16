import { formatRelativeTime } from '@/lib/utils';

interface HistoryEntry {
  id: string;
  action: string;
  description?: string;
  fromStatus?: string;
  toStatus?: string;
  actorName: string;
  createdAt: string;
}

export function TaskTimeline({ history }: { history: HistoryEntry[] }) {
  if (!history.length) {
    return <p className="text-sm text-muted-foreground">No activity yet</p>;
  }

  return (
    <div className="space-y-4">
      {history.map((entry) => (
        <div key={entry.id} className="flex gap-3">
          <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
          <div>
            <p className="text-sm">{entry.description || entry.action}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {entry.actorName} · {formatRelativeTime(entry.createdAt)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
