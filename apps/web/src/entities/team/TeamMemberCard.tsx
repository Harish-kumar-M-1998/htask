import { Calendar } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface TeamMemberCardProps {
  member: {
    firstName: string;
    lastName: string;
    email: string;
    createdAt: string;
    roles: Array<{ code: string; name: string }>;
  };
}

export function TeamMemberCard({ member }: TeamMemberCardProps) {
  const initials = `${member.firstName[0] ?? ''}${member.lastName[0] ?? ''}`.toUpperCase();
  const roleLabel = (member.roles[0]?.name ?? 'Member').toUpperCase();

  return (
    <div className="dashboard-card overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3 p-5 min-w-0">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 text-sm font-bold dark:bg-slate-800 dark:text-slate-300">
          {initials}
        </div>
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
    </div>
  );
}
