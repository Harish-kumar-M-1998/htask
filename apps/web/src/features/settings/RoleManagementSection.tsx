import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { rolesApi } from '@/services/api';
import { Button } from '@/shared/ui/button';
import { CreateRoleDialog } from '@/features/settings/CreateRoleDialog';
import { EditRolePermissionsDialog } from '@/features/settings/EditRolePermissionsDialog';
import { Skeleton } from '@/shared/ui/skeleton';

type RoleRow = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  memberCount: number;
  permissions: Array<{ code: string; name: string; module: string }>;
};

export function RoleManagementSection() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<RoleRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RoleRow | null>(null);

  const { data: roles, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.list().then((r) => r.data.data as RoleRow[]),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => rolesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setDeleteTarget(null);
    },
  });

  if (isLoading) {
    return (
      <section className="dashboard-card p-5 space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-lg" />
        ))}
      </section>
    );
  }

  return (
    <section className="dashboard-card overflow-hidden">
      <div className="px-5 py-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Roles</h3>
          <p className="text-xs text-muted-foreground mt-1">
            System and custom roles with configurable permissions.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Create role
        </Button>
      </div>

      <div className="divide-y divide-border">
        {(roles ?? []).map((role) => (
          <div
            key={role.id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 hover:bg-accent/20"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-medium text-sm">{role.name}</p>
                <span className="text-[10px] font-mono text-muted-foreground">{role.code}</span>
                {role.isSystem ? (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                    System
                  </span>
                ) : (
                  <span className="rounded pill-brand px-1.5 py-0.5 text-[10px] font-medium">
                    Custom
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {role.memberCount} member{role.memberCount === 1 ? '' : 's'} ·{' '}
                {role.permissions.length} permissions
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button size="sm" variant="outline" onClick={() => setEditTarget(role)}>
                <Pencil className="h-3.5 w-3.5" />
                Permissions
              </Button>
              {!role.isSystem && role.memberCount === 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(role)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {deleteTarget && (
        <div className="px-5 py-4 border-t border-border bg-muted/30">
          <p className="text-sm">
            Delete role <strong>{deleteTarget.name}</strong>? This cannot be undone.
          </p>
          <div className="flex gap-2 mt-3">
            <Button
              size="sm"
              variant="destructive"
              onClick={() => deleteMutation.mutate(deleteTarget.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <CreateRoleDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditRolePermissionsDialog
        role={editTarget}
        onOpenChange={(open) => !open && setEditTarget(null)}
      />
    </section>
  );
}
