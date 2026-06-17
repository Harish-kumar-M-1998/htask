import { Calendar, Trash2, UserCog } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { AvatarInitials, getInitials } from '@/shared/components/AvatarInitials';
import { Button } from '@/shared/ui/button';

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
  onDelete?: (memberId: string) => void;
  onEditRole?: (memberId: string) => void;
}

export function TeamMemberCard({ member, onClick, onDelete, onEditRole }: TeamMemberCardProps) {
  const roleLabel = (member.roles[0]?.name ?? 'Member').toUpperCase();
  const interactive = Boolean(onClick);

  return (
    <div className="dashboard-card overflow-hidden shadow-sm hover:shadow-md transition-shadow text-left w-full relative group">
      {(onEditRole || onDelete) && (
        <div className="absolute right-2 top-2 z-10 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          {onEditRole && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              aria-label={`Change role for ${member.firstName} ${member.lastName}`}
              onClick={(e) => {
                e.stopPropagation();
                onEditRole(member.id);
              }}
            >
              <UserCog className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              aria-label={`Remove ${member.firstName} ${member.lastName}`}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(member.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      <button
        type="button"
        onClick={interactive ? () => onClick?.(member.id) : undefined}
        className="w-full text-left cursor-pointer disabled:cursor-default"
        disabled={!interactive}
      >
        <div className="flex items-center gap-3 p-5 min-w-0">
          <AvatarInitials
            initials={getInitials(member.firstName, member.lastName)}
            size="lg"
          />
          <div className="min-w-0 flex-1 pr-6">
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
    </div>
  );
}
