import * as Dialog from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createUserSchema, type CreateUserInput } from '@htask/shared';
import { X } from 'lucide-react';
import { usersApi } from '@/services/api';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { selectClassName } from '@/lib/formStyles';

const ROLES = [
  { code: 'TEAM_MEMBER', label: 'Team Member' },
  { code: 'TEAM_LEAD', label: 'Team Lead' },
  { code: 'MANAGER', label: 'Manager' },
  { code: 'PMO', label: 'PMO' },
  { code: 'QA', label: 'QA Team' },
];

interface CreateTeamMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateTeamMemberDialog({ open, onOpenChange }: CreateTeamMemberDialogProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      roleCodes: ['TEAM_MEMBER'],
    },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateUserInput) => usersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      reset();
      onOpenChange(false);
    },
  });

  const selectClass = selectClassName;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 dashboard-card bg-card p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold">Add Team Member</Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1 hover:bg-accent transition-colors">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1.5 block">First Name *</label>
                <Input {...register('firstName')} placeholder="John" />
                {errors.firstName && <p className="text-destructive text-xs mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Last Name *</label>
                <Input {...register('lastName')} placeholder="Doe" />
                {errors.lastName && <p className="text-destructive text-xs mt-1">{errors.lastName.message}</p>}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Email *</label>
              <Input {...register('email')} type="email" placeholder="john@company.com" />
              {errors.email && <p className="text-destructive text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Password *</label>
              <Input {...register('password')} type="password" placeholder="Min. 8 characters" />
              {errors.password && <p className="text-destructive text-xs mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">Role *</label>
              <select
                value={watch('roleCodes.0') ?? 'TEAM_MEMBER'}
                onChange={(e) => setValue('roleCodes', [e.target.value])}
                className={selectClass}
              >
                {ROLES.map((r) => (
                  <option key={r.code} value={r.code}>{r.label}</option>
                ))}
              </select>
            </div>

            {mutation.isError && (
              <p className="text-destructive text-sm">Failed to add member. Email may already exist.</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Adding...' : 'Add Member'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
