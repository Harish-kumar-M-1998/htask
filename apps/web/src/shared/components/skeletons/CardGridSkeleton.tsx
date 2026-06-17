import { Skeleton } from '@/shared/ui/skeleton';

type CardGridSkeletonProps = {
  count?: number;
  variant?: 'project' | 'team';
};

export function CardGridSkeleton({ count = 4, variant = 'project' }: CardGridSkeletonProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="dashboard-card overflow-hidden p-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          </div>
          {variant === 'project' && (
            <>
              <Skeleton className="mt-4 h-10 w-full" />
              <div className="mt-4 border-t border-border pt-3 flex gap-4">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-20" />
              </div>
            </>
          )}
          {variant === 'team' && (
            <div className="mt-4 border-t border-border pt-3 flex justify-between">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
