import { useEffect, useMemo, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createRoleSchema, type CreateRoleInput } from '@htask/shared';
import { X } from 'lucide-react';
import { rolesApi } from '@/services/api';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { textareaClassName } from '@/lib/formStyles';

type Permission = { code: string; name: string; module: string };

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRoleDialog({ open, onOpenChange }: CreateRoleDialogProps) {
  const queryClient = useQueryClient();
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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateRoleInput>({
    resolver: zodResolver(createRoleSchema),
    defaultValues: { name: '', code: '', description: '', permissionCodes: [] },
  });

  useEffect(() => {
    if (!open) {
      reset();
      setSelected(new Set());
    }
  }, [open, reset]);

  const toggle = (code: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const mutation = useMutation({
    mutationFn: (data: CreateRoleInput) => rolesApi.create(data),
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
            <Dialog.Title className="text-lg font-semibold">Create custom role</Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1 hover:bg-accent transition-colors">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <form
            onSubmit={handleSubmit((data) =>
              mutation.mutate({ ...data, permissionCodes: Array.from(selected) }),
            )}
            className="flex flex-col flex-1 min-h-0"
          >
            <div className="overflow-y-auto p-6 space-y-4 flex-1">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Role name *</label>
                <Input {...register('name')} placeholder="Contractor" />
                {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Role code *</label>
                <Input
                  {...register('code')}
                  placeholder="CONTRACTOR"
                  className="uppercase font-mono"
                  onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '');
                    register('code').onChange(e);
                  }}
                />
                {errors.code && <p className="text-destructive text-xs mt-1">{errors.code.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Description</label>
                <textarea {...register('description')} rows={2} className={textareaClassName} />
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Permissions *</p>
                <div className="max-h-48 overflow-y-auto border border-border rounded-lg p-3 space-y-3">
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
                {selected.size === 0 && (
                  <p className="text-destructive text-xs mt-1">Select at least one permission</p>
                )}
              </div>

              {mutation.isError && (
                <p className="text-destructive text-sm">Failed to create role.</p>
              )}
            </div>

            <div className="flex justify-end gap-2 p-6 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending || selected.size === 0}>
                {mutation.isPending ? 'Creating…' : 'Create role'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
