import { Skeleton } from '@/shared/ui/skeleton';
import { PageShell } from '@/shared/layouts/PageShell';

export function MemberPerformanceSkeleton() {
  return (
    <PageShell title="Member performance" subtitle="Loading analytics…">
      <div className="space-y-4">
        <Skeleton className="h-4 w-28" />

        <div className="dashboard-card p-5 flex gap-4">
          <Skeleton className="h-12 w-12 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="dashboard-card p-5 space-y-4">
            <Skeleton className="h-3 w-24" />
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-7 w-10" />
                  <Skeleton className="h-3 w-full" />
                </div>
              ))}
            </div>
          </div>
          <div className="dashboard-card p-5 space-y-4">
            <Skeleton className="h-3 w-20" />
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="dashboard-card p-5">
            <Skeleton className="h-[132px] w-[132px] rounded-full mx-auto" />
          </div>
          <div className="dashboard-card p-5">
            <Skeleton className="h-[132px] w-[132px] rounded-full mx-auto" />
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="dashboard-card p-5 space-y-3">
            <Skeleton className="h-5 w-48" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
          <div className="dashboard-card p-5 space-y-3">
            <Skeleton className="h-5 w-32" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
