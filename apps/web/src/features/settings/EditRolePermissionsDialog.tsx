import { useEffect, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { rolesApi } from '@/services/api';
import { Button } from '@/shared/ui/button';

type Permission = { code: string; name: string; module: string };

type RoleSummary = {
  id: string;
  code: string;
  name: string;
  isSystem: boolean;
  permissions: Permission[];
};

interface EditRolePermissionsDialogProps {
  role: RoleSummary | null;
  onOpenChange: (open: boolean) => void;
}

export function EditRolePermissionsDialog({ role, onOpenChange }: EditRolePermissionsDialogProps) {
  const queryClient = useQueryClient();
  const open = Boolean(role);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: permissions } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => rolesApi.listPermissions().then((r) => r.data.data as Permission[]),
    enabled: open,
  });

  const modules = useMemo(
    () => Array.from(new Set((permissions ?? []).map((p) => p.module))),
    [permissions],
  );

  useEffect(() => {
    if (role) {
      setSelected(new Set(role.permissions.map((p) => p.code)));
    }
  }, [role]);

  const toggle = (code: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const mutation = useMutation({
    mutationFn: () =>
      rolesApi.updatePermissions(role!.id, { permissionCodes: Array.from(selected) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg max-h-[90vh] -translate-x-1/2 -translate-y-1/2 dashboard-card bg-card shadow-xl flex flex-col">
          <div className="flex items-center justify-between p-6 pb-0">
            <Dialog.Title className="text-lg font-semibold">
              Edit permissions — {role?.name}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1 hover:bg-accent transition-colors">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          {role && (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="overflow-y-auto p-6 flex-1">
                <p className="text-xs text-muted-foreground mb-3">
                  {role.isSystem ? 'System role — permissions can be customized.' : 'Custom role'}
                  {' · '}
                  {selected.size} selected
                </p>
                <div className="max-h-64 overflow-y-auto border border-border rounded-lg p-3 space-y-3">
                  {modules.map((module) => (
                    <div key={module}>
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                        {module}
                      </p>
                      <div className="space-y-1">
                        {(permissions ?? [])
                          .filter((p) => p.module === module)
                          .map((perm) => (
                            <label
                              key={perm.code}
                              className="flex items-center gap-2 text-sm cursor-pointer hover:bg-accent/40 rounded px-1 py-0.5"
                            >
                              <input
                                type="checkbox"
                                checked={selected.has(perm.code)}
                                onChange={() => toggle(perm.code)}
                                className="accent-primary"
                              />
                              <span>{perm.name}</span>
                            </label>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
                {mutation.isError && (
                  <p className="text-destructive text-sm mt-3">Failed to update permissions.</p>
                )}
              </div>

              <div className="flex justify-end gap-2 p-6 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => mutation.mutate()}
                  disabled={mutation.isPending || selected.size === 0}
                >
                  {mutation.isPending ? 'Saving…' : 'Save permissions'}
                </Button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
