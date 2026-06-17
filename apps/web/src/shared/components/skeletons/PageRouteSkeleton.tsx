import { Skeleton } from '@/shared/ui/skeleton';
import { PageShell } from '@/shared/layouts/PageShell';

export function PageRouteSkeleton() {
  return (
    <PageShell title="Loading" subtitle="Please wait">
      <div className="space-y-6">
        <div className="flex gap-4">
          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="dashboard-card p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
        </div>
      </div>
    </PageShell>
  );
}
