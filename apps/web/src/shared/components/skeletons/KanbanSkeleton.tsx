import { KANBAN_COLUMNS } from '@/lib/kanbanColumns';
import { Skeleton } from '@/shared/ui/skeleton';

export function KanbanSkeleton() {
  return (
    <div className="flex flex-1 min-h-0 gap-3 overflow-hidden pb-2">
      {KANBAN_COLUMNS.map((column) => (
        <div
          key={column.id}
          className="flex w-[280px] shrink-0 flex-col rounded-xl border border-border bg-muted/20 border-t-[3px]"
        >
          <div className="px-3 py-3 border-b border-border/60 flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-6 rounded-full" />
          </div>
          <div className="p-2 space-y-2">
            {Array.from({ length: column.id === 'in_progress' ? 3 : 2 }).map((_, i) => (
              <Skeleton key={i} className="h-[88px] w-full rounded-lg" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
