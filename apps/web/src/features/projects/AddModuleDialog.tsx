import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { projectsApi } from '@/services/api';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';

interface AddModuleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

export function AddModuleDialog({ open, onOpenChange, projectId }: AddModuleDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');

  const mutation = useMutation({
    mutationFn: () => projectsApi.createModule(projectId, { name: name.trim() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-history', projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks', projectId] });
      setName('');
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    mutation.mutate();
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 dashboard-card bg-card p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-semibold">Add module</Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1 hover:bg-accent transition-colors">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Module name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Authentication"
                autoFocus
              />
            </div>

            {mutation.isError && (
              <p className="text-destructive text-sm">Failed to add module. Please try again.</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim() || mutation.isPending}>
                {mutation.isPending ? 'Adding...' : 'Add module'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
