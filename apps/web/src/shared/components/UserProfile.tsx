import { useNavigate } from 'react-router';
import { useAuthStore } from '@/store';
import { cn } from '@/lib/utils';
import { AvatarInitials, getInitials } from '@/shared/components/AvatarInitials';

export function UserProfile({ className, compact }: { className?: string; compact?: boolean }) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const roleLabel = user?.roles[0]?.replace(/_/g, ' ') ?? '';

  return (
    <button
      type="button"
      onClick={() => navigate('/profile')}
      className={cn(
        'flex items-center gap-2.5 px-3 py-3 w-full rounded-lg transition-colors hover:bg-accent/60',
        compact && 'justify-center px-0 py-2',
        className,
      )}
      aria-label="Open profile"
    >
      <AvatarInitials
        initials={getInitials(user?.firstName, user?.lastName)}
        size="md"
      />
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
    </button>
  );
}
