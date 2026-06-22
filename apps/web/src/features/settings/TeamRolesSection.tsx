import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Pencil } from 'lucide-react';
import { usersApi } from '@/services/api';
import { useAuthStore } from '@/store';
import { Button } from '@/shared/ui/button';
import { ROLE_LABELS, type RoleCode } from '@/lib/rolePermissionMatrix';
import { CreateTeamMemberDialog } from '@/features/team/CreateTeamMemberDialog';
import { EditTeamMemberRoleDialog } from '@/features/team/EditTeamMemberRoleDialog';
import { TableRowsSkeleton } from '@/shared/components/skeletons';
import { AvatarInitials, getInitials } from '@/shared/components/AvatarInitials';

type TeamMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  roles: Array<{ code: string; name: string }>;
};

export function TeamRolesSection() {
  const user = useAuthStore((s) => s.user);
  const canCreate = user?.permissions.includes('user:create');
  const canManageRoles = user?.permissions.includes('user:manage_roles');
  const [createOpen, setCreateOpen] = useState(false);
  const [roleEditTarget, setRoleEditTarget] = useState<TeamMember | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list({ limit: 100 }).then((r) => r.data),
  });

  const members = (data?.data ?? []) as TeamMember[];

  return (
    <section className="dashboard-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Team role assignments</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Assign roles to members. Changes take effect on next sign-in.
          </p>
        </div>
        {canCreate && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Add member
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="p-4">
          <TableRowsSkeleton rows={5} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-xs font-medium text-muted-foreground">
                <th className="text-left px-4 py-2.5">Member</th>
                <th className="text-left px-4 py-2.5">Role</th>
                <th className="text-left px-4 py-2.5">Status</th>
                {canManageRoles && <th className="text-right px-4 py-2.5 w-24" />}
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const roleCode = member.roles[0]?.code ?? 'TEAM_MEMBER';
                const isSelf = member.id === user?.id;
                return (
                  <tr key={member.id} className="border-b border-border/60 hover:bg-accent/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <AvatarInitials
                          initials={getInitials(member.firstName, member.lastName)}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="font-medium truncate">
                            {member.firstName} {member.lastName}
                            {isSelf && (
                              <span className="text-muted-foreground font-normal"> (you)</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {ROLE_LABELS[roleCode as RoleCode] ?? member.roles[0]?.name ?? 'Member'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground capitalize text-xs">
                      {member.status.toLowerCase()}
                    </td>
                    {canManageRoles && (
                      <td className="px-4 py-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isSelf}
                          title={isSelf ? 'You cannot change your own role' : 'Edit role'}
                          onClick={() => setRoleEditTarget(member)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <CreateTeamMemberDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditTeamMemberRoleDialog
        member={roleEditTarget}
        onOpenChange={(open) => !open && setRoleEditTarget(null)}
      />
    </section>
  );
}
