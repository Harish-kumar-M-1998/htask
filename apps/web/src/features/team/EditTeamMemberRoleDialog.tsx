import * as Dialog from '@radix-ui/react-dialog';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateUserRolesSchema, type UpdateUserRolesInput } from '@htask/shared';
import { X } from 'lucide-react';
import { usersApi } from '@/services/api';
import { Button } from '@/shared/ui/button';
import { selectClassName } from '@/lib/formStyles';
import { TEAM_ROLE_OPTIONS } from './teamRoles';

type MemberSummary = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: Array<{ code: string; name: string }>;
};

interface EditTeamMemberRoleDialogProps {
  member: MemberSummary | null;
  onOpenChange: (open: boolean) => void;
}

export function EditTeamMemberRoleDialog({ member, onOpenChange }: EditTeamMemberRoleDialogProps) {
  const queryClient = useQueryClient();
  const open = Boolean(member);

  const {
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UpdateUserRolesInput>({
    resolver: zodResolver(updateUserRolesSchema),
    defaultValues: { roleCodes: ['TEAM_MEMBER'] },
  });

  useEffect(() => {
    if (member) {
      reset({ roleCodes: [member.roles[0]?.code ?? 'TEAM_MEMBER'] });
    }
  }, [member, reset]);

  const mutation = useMutation({
    mutationFn: (data: UpdateUserRolesInput) =>
      usersApi.updateRoles(member!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onOpenChange(false);
    },
  });

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 dashboard-card bg-card p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold">Update role</Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1 hover:bg-accent transition-colors">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          {member && (
            <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
              <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                <p className="font-medium">
                  {member.firstName} {member.lastName}
                </p>
                <p className="text-sm text-muted-foreground">{member.email}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Current: {member.roles[0]?.name ?? 'Member'}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">New role *</label>
                <select
                  value={watch('roleCodes.0') ?? 'TEAM_MEMBER'}
                  onChange={(e) => setValue('roleCodes', [e.target.value])}
                  className={selectClassName}
                >
                  {TEAM_ROLE_OPTIONS.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.label}
                    </option>
                  ))}
                </select>
                {errors.roleCodes && (
                  <p className="text-destructive text-xs mt-1">{errors.roleCodes.message}</p>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                The member will need to sign in again for permission changes to take effect.
              </p>

              {mutation.isError && (
                <p className="text-destructive text-sm">Failed to update role. Please try again.</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending ? 'Saving...' : 'Save role'}
                </Button>
              </div>
            </form>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
