import { formatDate } from '@/lib/utils';
import { AvatarInitials, getInitials } from '@/shared/components/AvatarInitials';

interface MemberProfileCardProps {
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  createdAt: string;
  roleName: string;
}

export function MemberProfileCard({
  firstName,
  lastName,
  email,
  status,
  createdAt,
  roleName,
}: MemberProfileCardProps) {
  const isActive = status === 'ACTIVE';

  return (
    <div className="dashboard-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <AvatarInitials
            initials={getInitials(firstName, lastName)}
            size="xl"
          />
          <div className="min-w-0">
            <h2 className="text-lg font-semibold truncate">
              {firstName} {lastName}
            </h2>
            <p className="text-sm text-muted-foreground truncate">{email}</p>
          </div>
        </div>

        <div className="text-sm text-muted-foreground space-y-1 sm:text-right">
          <p className="flex items-center gap-2 sm:justify-end">
            <span>Status:</span>
            <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
              {isActive ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  Active
                </>
              ) : (
                status.replaceAll('_', ' ')
              )}
            </span>
          </p>
          <p>
            Joined: <span className="font-medium text-foreground">{formatDate(createdAt)}</span>
          </p>
          <p>
            Role: <span className="font-medium text-foreground">{roleName}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
