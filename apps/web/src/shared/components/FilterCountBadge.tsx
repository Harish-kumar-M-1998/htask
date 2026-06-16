import { cn } from '@/lib/utils';

export function FilterCountBadge({ count, className }: { count: number; className?: string }) {
  return (
    <span
      className={cn(
        'badge-count absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px]',
        className,
      )}
    >
      {count}
    </span>
  );
}
