import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { TeamFilterDialog, emptyTeamFilters, type TeamFilters } from '@/features/team/TeamFilterDialog';

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
  const user = useAuthStore((s) => s.user);
  const canCreate = user?.permissions.includes('user:create');
  const [createOpen, setCreateOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<TeamFilters>(emptyTeamFilters);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['users', search],
    queryFn: () => usersApi.list({ search, limit: 100 }).then((r) => r.data),
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

        {isError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm shrink-0">
            Failed to load team members.{' '}
            <button className="underline font-medium" onClick={() => refetch()}>Retry</button>
          </div>
        )}

        <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden">
          {isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-[120px] rounded-xl bg-muted animate-pulse" />
              ))}
            </div>
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
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateTeamMemberDialog open={createOpen} onOpenChange={setCreateOpen} />
      <TeamFilterDialog
        open={filterOpen}
        onOpenChange={setFilterOpen}
        filters={filters}
        onApply={setFilters}
      />
    </PageShell>
  );
}
