import { useAuthStore } from '@/store';
import { cn } from '@/lib/utils';

export function UserProfile({ className, compact }: { className?: string; compact?: boolean }) {
  const user = useAuthStore((s) => s.user);

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();
  const roleLabel = user?.roles[0]?.replace(/_/g, ' ') ?? '';

  return (
    <div className={cn('flex items-center gap-2.5 px-3 py-3', compact && 'justify-center px-0 py-2', className)}>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500 text-white text-xs font-semibold">
        {initials}
      </div>
      {!compact && (
        <div className="min-w-0 text-left">
          <p className="text-sm font-semibold leading-tight truncate">
            {user?.firstName} {user?.lastName}
          </p>
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground truncate">
            {roleLabel}
          </p>
        </div>
      )}
    </div>
  );
}
