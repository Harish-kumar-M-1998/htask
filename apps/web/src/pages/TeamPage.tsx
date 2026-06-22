import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { Plus, Users, Search, Filter } from 'lucide-react';
import { usersApi } from '@/services/api';
import { useAuthStore } from '@/store';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { FilterCountBadge } from '@/shared/components/FilterCountBadge';
import { formToolbarClass } from '@/lib/formStyles';
import { PageShell } from '@/shared/layouts/PageShell';
import { TeamMemberCard } from '@/entities/team/TeamMemberCard';
import { CreateTeamMemberDialog } from '@/features/team/CreateTeamMemberDialog';
import { EditTeamMemberRoleDialog } from '@/features/team/EditTeamMemberRoleDialog';
import { TeamFilterDialog, emptyTeamFilters, type TeamFilters } from '@/features/team/TeamFilterDialog';
import { CardGridSkeleton } from '@/shared/components/skeletons';
import { useDebounce } from '@/lib/useDebounce';

type TeamMember = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  status: string;
  createdAt: string;
  roles: Array<{ code: string; name: string }>;
};

export function TeamPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canCreate = user?.permissions.includes('user:create');
  const canDelete = user?.permissions.includes('user:delete');
  const canManageRoles = user?.permissions.includes('user:manage_roles');
  const [createOpen, setCreateOpen] = useState(false);
  const [roleEditTarget, setRoleEditTarget] = useState<TeamMember | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [filters, setFilters] = useState<TeamFilters>(emptyTeamFilters);
  const [deleteTarget, setDeleteTarget] = useState<TeamMember | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['users', debouncedSearch],
    queryFn: () => usersApi.list({ search: debouncedSearch, limit: 100 }).then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteTarget(null);
      setDeleteError('');
    },
    onError: (err: unknown) => {
      const apiMessage =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error
              ?.message
          : undefined;
      setDeleteError(apiMessage ?? 'Failed to remove team member.');
    },
  });

  const members = (data?.data ?? []) as TeamMember[];
  const filteredMembers = filters.role
    ? members.filter((m) => m.roles.some((r) => r.code === filters.role))
    : members;

  const activeFilterCount = filters.role ? 1 : 0;

  return (
    <PageShell
      title="Team Members"
      subtitle={`${filteredMembers.length} of ${data?.meta?.total ?? 0} members${activeFilterCount ? ' · filtered' : ''}`}
      action={
        canCreate ? (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Member
          </Button>
        ) : undefined
      }
    >
      <div className="flex flex-1 min-h-0 min-w-0 flex-col gap-4">
        <div className={`flex flex-col sm:flex-row gap-3 shrink-0 ${formToolbarClass}`}>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFilterOpen(true)}
            className="relative shrink-0"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && <FilterCountBadge count={activeFilterCount} />}
          </Button>
        </div>

        {deleteError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm shrink-0">
            {deleteError}
          </div>
        )}

        {deleteTarget && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm shrink-0 flex flex-wrap items-center justify-between gap-3">
            <span>
              Remove <strong>{deleteTarget.firstName} {deleteTarget.lastName}</strong> from the team?
              They will lose access immediately.
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteTarget.id)}
              >
                {deleteMutation.isPending ? 'Removing...' : 'Yes, remove'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={deleteMutation.isPending}
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteError('');
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {isError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm shrink-0">
            Failed to load team members.{' '}
            <button className="underline font-medium" onClick={() => refetch()}>Retry</button>
          </div>
        )}

        <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden">
          {isLoading ? (
            <CardGridSkeleton count={8} variant="team" />
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg">No team members</h3>
              <p className="text-muted-foreground text-sm mt-1 mb-4">
                {activeFilterCount > 0
                  ? 'No members match the selected role filter.'
                  : canCreate
                    ? 'Add your first team member to get started.'
                    : 'No members found.'}
              </p>
              {canCreate && activeFilterCount === 0 && (
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Add Member
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 pb-1">
              {filteredMembers.map((member) => (
                <TeamMemberCard
                  key={member.id}
                  member={member}
                  onClick={(memberId) => navigate(`/team/${memberId}/performance`)}
                  onDelete={
                    canDelete && member.id !== user?.id
                      ? (memberId) => {
                          const target = filteredMembers.find((m) => m.id === memberId) ?? null;
                          setDeleteError('');
                          setDeleteTarget(target);
                        }
                      : undefined
                  }
                  onEditRole={
                    canManageRoles && member.id !== user?.id
                      ? (memberId) => {
                          const target = filteredMembers.find((m) => m.id === memberId) ?? null;
                          setRoleEditTarget(target);
                        }
                      : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateTeamMemberDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditTeamMemberRoleDialog
        member={roleEditTarget}
        onOpenChange={(open) => {
          if (!open) setRoleEditTarget(null);
        }}
      />
      <TeamFilterDialog
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        onApply={setFilters}
      />
    </PageShell>
  );
}
