import { Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { AvatarInitials, getInitials } from '@/shared/components/AvatarInitials';

interface TeamMemberCardProps {
  member: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: string;
    roles: Array<{ code: string; name: string }>;
  };
  onClick?: (memberId: string) => void;
}

export function TeamMemberCard({ member, onClick }: TeamMemberCardProps) {
  const roleLabel = (member.roles[0]?.name ?? 'Member').toUpperCase();
  const interactive = Boolean(onClick);

  return (
    <button
      type="button"
      onClick={interactive ? () => onClick?.(member.id) : undefined}
      className="dashboard-card overflow-hidden shadow-sm hover:shadow-md transition-shadow text-left w-full cursor-pointer disabled:cursor-default"
      disabled={!interactive}
    >
      <div className="flex items-center gap-3 p-5 min-w-0">
        <AvatarInitials
          initials={getInitials(member.firstName, member.lastName)}
          size="lg"
        />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-foreground truncate">
            {member.firstName} {member.lastName}
          </h3>
          <p className="text-sm text-muted-foreground truncate">{member.email}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
        <span className="text-[11px] font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300 truncate">
          {roleLabel}
        </span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 whitespace-nowrap">
          <Calendar className="h-3.5 w-3.5" />
          Joined {formatDate(member.createdAt)}
        </span>
      </div>
    </button>
  );
}
