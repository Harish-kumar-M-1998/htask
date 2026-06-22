import { useEffect } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useForm, type Control, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createProjectSchema, updateProjectSchema, type CreateProjectInput } from '@htask/shared';
import { z } from 'zod';
import { X } from 'lucide-react';
import { projectsApi, usersApi, workflowsApi } from '@/services/api';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { textareaClassName } from '@/lib/formStyles';
import { TeamMemberSelect } from '@/shared/components/TeamMemberSelect';

const editFormSchema = updateProjectSchema.extend({
  memberIds: z.array(z.string().uuid()).optional(),
});

type ProjectFormValues = CreateProjectInput & { memberIds?: string[] };

interface ProjectFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  project?: {
    id: string;
    name: string;
    key: string;
    description?: string | null;
    workflowId?: string | null;
    members?: Array<{ userId: string }>;
  };
}

export function ProjectFormDialog({ open, onOpenChange, mode, project }: ProjectFormDialogProps) {
  const queryClient = useQueryClient();
  const isEdit = mode === 'edit';

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list({ limit: 100 }).then((r) => r.data),
    enabled: open,
  });

  const { data: workflowsData } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => workflowsApi.list().then((r) => r.data.data as Array<{ id: string; name: string; isDefault: boolean }>),
    enabled: open,
  });

  const users = usersData?.data ?? [];
  const workflows = workflowsData ?? [];
  const defaultWorkflowId = workflows.find((w) => w.isDefault)?.id ?? workflows[0]?.id;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors },
  } = useForm<ProjectFormValues>({
    resolver: zodResolver(isEdit ? editFormSchema : createProjectSchema) as Resolver<ProjectFormValues>,
    defaultValues: {
      name: '',
      key: '',
      description: '',
      memberIds: [],
      workflowId: undefined,
    },
  });

  useEffect(() => {
    if (open && isEdit && project) {
      reset({
        name: project.name,
        key: project.key,
        description: project.description ?? '',
        memberIds: project.members?.map((m) => m.userId) ?? [],
        workflowId: project.workflowId ?? defaultWorkflowId,
      });
    } else if (open && !isEdit) {
      reset({
        name: '',
        key: '',
        description: '',
        memberIds: [],
        workflowId: defaultWorkflowId,
      });
    }
  }, [open, isEdit, project, reset, defaultWorkflowId]);

  const mutation = useMutation({
    mutationFn: (data: ProjectFormValues) => {
      const payload = {
        ...data,
        key: data.key?.toUpperCase(),
        description: data.description || undefined,
        memberIds: data.memberIds?.length ? data.memberIds : undefined,
      };
      if (isEdit && project) {
        const { key: _key, ...rest } = payload;
        return projectsApi.update(project.id, rest);
      }
      return projectsApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      if (project?.id) {
        queryClient.invalidateQueries({ queryKey: ['project', project.id] });
      }
      reset();
      onOpenChange(false);
    },
  });

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md max-h-[90vh] -translate-x-1/2 -translate-y-1/2 dashboard-card bg-card shadow-xl flex flex-col">
          <div className="flex items-center justify-between p-6 pb-0">
            <Dialog.Title className="text-lg font-semibold">
              {isEdit ? 'Edit Project' : 'Create Project'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1 hover:bg-accent transition-colors">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <form
            onSubmit={handleSubmit((data) => mutation.mutate(data))}
            className="flex flex-col flex-1 min-h-0"
          >
            <div className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Project Name *</label>
                <Input {...register('name')} placeholder="My Project" />
                {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Project Key *</label>
                <Input
                  {...register('key')}
                  placeholder="PROJ"
                  className="uppercase font-mono"
                  disabled={isEdit}
                  onChange={(e) => {
                    e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    register('key').onChange(e);
                  }}
                />
                {isEdit && (
                  <p className="text-xs text-muted-foreground mt-1">Project key cannot be changed</p>
                )}
                {errors.key && <p className="text-destructive text-xs mt-1">{errors.key.message}</p>}
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Description</label>
                <textarea
                  {...register('description')}
                  placeholder="Optional project description"
                  rows={3}
                  className={textareaClassName}
                />
              </div>

              <TeamMemberSelect control={control as unknown as Control<{ memberIds?: string[] }>} users={users} />

              {workflows.length > 0 && (
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Workflow</label>
                  <select
                    {...register('workflowId')}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  >
                    {workflows.map((wf) => (
                      <option key={wf.id} value={wf.id}>
                        {wf.name}
                        {wf.isDefault ? ' (default)' : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Defines task status transitions for this project.
                  </p>
                </div>
              )}

              {mutation.isError && (
                <p className="text-destructive text-sm">
                  Failed to {isEdit ? 'update' : 'create'} project. Please check the form.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 p-6 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Project'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
