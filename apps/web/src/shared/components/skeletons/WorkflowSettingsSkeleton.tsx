import { Skeleton } from '@/shared/ui/skeleton';

export function WorkflowSettingsSkeleton() {
  return (
    <div className="max-w-6xl space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="dashboard-card p-5 space-y-3">
        <Skeleton className="h-5 w-32" />
        <div className="grid gap-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-lg" />
          ))}
        </div>
      </div>
      <div className="dashboard-card p-5 space-y-3">
        <Skeleton className="h-5 w-40" />
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
