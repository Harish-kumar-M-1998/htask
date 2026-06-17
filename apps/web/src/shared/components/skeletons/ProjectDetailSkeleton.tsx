import { Skeleton } from '@/shared/ui/skeleton';
import { TableRowsSkeleton } from './TableRowsSkeleton';

export function ProjectDetailSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <Skeleton className="h-4 w-24 mb-4" />

      <div className="mb-6 flex gap-4">
        <Skeleton className="h-14 w-14 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-64 max-w-full" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
      </div>

      <div className="grid flex-1 lg:grid-cols-3 gap-6 min-h-0">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="dashboard-card p-5 text-center space-y-2">
                <Skeleton className="h-8 w-12 mx-auto" />
                <Skeleton className="h-3 w-16 mx-auto" />
              </div>
            ))}
          </div>
          <div className="dashboard-card flex-1 overflow-hidden">
            <div className="border-b border-border px-5 py-4 flex justify-between">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
            <TableRowsSkeleton rows={6} />
          </div>
        </div>
        <div className="space-y-4">
          <div className="dashboard-card">
            <div className="border-b border-border px-5 py-4">
              <Skeleton className="h-5 w-28" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-40" />
                </div>
              </div>
            ))}
          </div>
          <div className="dashboard-card p-5 space-y-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
