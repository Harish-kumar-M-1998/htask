import { Skeleton } from '@/shared/ui/skeleton';
import { PageShell } from '@/shared/layouts/PageShell';

export function EmailSettingsSkeleton() {
  return (
    <PageShell
      title="Email notifications"
      subtitle="Configure automated emails"
      action={<Skeleton className="h-10 w-32 rounded-lg" />}
    >
      <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="dashboard-card p-3 space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-full rounded-lg" />
            ))}
          </div>
          <div className="dashboard-card p-4 space-y-3">
            <Skeleton className="h-3 w-24" />
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex justify-between">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </aside>

        <div className="space-y-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="dashboard-card p-5 space-y-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-full max-w-lg" />
              <div className="grid gap-3 md:grid-cols-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
          <div className="dashboard-card p-5 space-y-3">
            <Skeleton className="h-5 w-28" />
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
