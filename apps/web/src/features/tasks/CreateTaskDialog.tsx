import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import * as Dialog from '@radix-ui/react-dialog';
import { X, Upload, Paperclip } from 'lucide-react';
import { tasksApi, projectsApi, usersApi } from '@/services/api';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { selectClassName, textareaClassName } from '@/lib/formStyles';
import { cn } from '@/lib/utils';

const taskFormSchema = z.object({
  title: z.string().min(1, 'Task name is required').max(500),
  description: z.string().min(1, 'Description is required'),
  projectId: z.string().uuid('Select a project'),
  moduleId: z.string().optional(),
  type: z.enum(['FEATURE', 'ENHANCEMENT', 'BUG_FIX', 'SUPPORT']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  dueDate: z.string().min(1, 'Deadline is required'),
  estimatedHours: z
    .string()
    .min(1, 'ETA is required')
    .refine((value) => !Number.isNaN(Number(value)) && Number(value) > 0, {
      message: 'ETA must be greater than 0',
    }),
  assigneeIds: z.array(z.string().uuid()).min(1, 'Select at least one team member'),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

const TASK_TYPES = [
  { value: 'FEATURE', label: 'Task' },
  { value: 'BUG_FIX', label: 'Bug' },
  { value: 'ENHANCEMENT', label: 'Enhancement' },
  { value: 'SUPPORT', label: 'Support' },
] as const;

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

interface CreateTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProjectId?: string;
}

export function CreateTaskDialog({ open, onOpenChange, defaultProjectId }: CreateTaskDialogProps) {
  const queryClient = useQueryClient();
  const [files, setFiles] = useState<File[]>([]);

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list({ limit: 100 }).then((r) => r.data),
    enabled: open,
  });

  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list({ limit: 100 }).then((r) => r.data),
    enabled: open,
  });

  const projects = projectsData?.data ?? [];
  const users = usersData?.data ?? [];

  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      projectId: '',
      moduleId: '',
      type: 'FEATURE',
      priority: 'MEDIUM',
      dueDate: '',
      estimatedHours: '',
      assigneeIds: [],
    },
  });

  const selectedProjectId = watch('projectId');

  const { data: projectDetail } = useQuery({
    queryKey: ['project', selectedProjectId],
    queryFn: () => projectsApi.get(selectedProjectId).then((r) => r.data.data),
    enabled: open && !!selectedProjectId,
  });

  const modules = projectDetail?.modules ?? [];

  useEffect(() => {
    if (open && defaultProjectId) {
      setValue('projectId', defaultProjectId);
    }
  }, [open, defaultProjectId, setValue]);

  useEffect(() => {
    setValue('moduleId', '');
  }, [selectedProjectId, setValue]);

  const mutation = useMutation({
    mutationFn: async (values: TaskFormValues) => {
      const payload = {
        title: values.title,
        description: values.description.trim(),
        projectId: values.projectId,
        moduleId: values.moduleId || undefined,
        type: values.type,
        priority: values.priority,
        dueDate: new Date(values.dueDate).toISOString(),
        estimatedHours: Number(values.estimatedHours),
        assigneeIds: values.assigneeIds,
      };

      const { data } = await tasksApi.create(payload);
      const taskId = data.data.id as string;

      for (const file of files) {
        await tasksApi.uploadAttachment(taskId, file);
      }

      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.projectId] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks', variables.projectId] });
      reset();
      setFiles([]);
      onOpenChange(false);
    },
  });

  const onSubmit = (values: TaskFormValues) => mutation.mutate(values);

  const selectClass = selectClassName;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg max-h-[90vh] -translate-x-1/2 -translate-y-1/2 dashboard-card bg-card shadow-xl flex flex-col">
          <div className="flex items-center justify-between p-6 pb-0">
            <Dialog.Title className="text-lg font-semibold">Create Task</Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1 hover:bg-accent transition-colors">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0">
            <div className="overflow-y-auto p-5 sm:p-6 space-y-4 flex-1">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Task Name *</label>
                <Input {...register('title')} placeholder="Enter task name" />
                {errors.title && <p className="text-destructive text-xs mt-1">{errors.title.message}</p>}
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Description *</label>
                <textarea
                  {...register('description')}
                  rows={4}
                  placeholder="Describe the task, acceptance criteria, and context..."
                  className={textareaClassName}
                />
                {errors.description && (
                  <p className="text-destructive text-xs mt-1">{errors.description.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Type *</label>
                  <select {...register('type')} className={selectClass}>
                    {TASK_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Priority *</label>
                  <select {...register('priority')} className={selectClass}>
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Project *</label>
                <select
                  {...register('projectId')}
                  className={selectClass}
                  disabled={!!defaultProjectId}
                >
                  <option value="">Select project</option>
                  {projects.map((p: { id: string; name: string; key: string }) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.key})</option>
                  ))}
                </select>
                {errors.projectId && <p className="text-destructive text-xs mt-1">{errors.projectId.message}</p>}
                {projects.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-1">Create a project first before adding tasks.</p>
                )}
              </div>

              {selectedProjectId && (
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Module</label>
                  <select {...register('moduleId')} className={selectClass}>
                    <option value="">No module</option>
                    {modules.map((m: { id: string; name: string }) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                  {modules.length === 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      No modules in this project yet. Add one from the project page.
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Deadline *</label>
                  <Input {...register('dueDate')} type="date" />
                  {errors.dueDate && (
                    <p className="text-destructive text-xs mt-1">{errors.dueDate.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">ETA (hours) *</label>
                  <Input {...register('estimatedHours')} type="number" min={0.01} step={0.5} placeholder="e.g. 8" />
                  {errors.estimatedHours && (
                    <p className="text-destructive text-xs mt-1">{errors.estimatedHours.message}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Team Members *</label>
                <Controller
                  name="assigneeIds"
                  control={control}
                  render={({ field }) => (
                    <div className="border border-border rounded-lg max-h-36 overflow-y-auto divide-y divide-border">
                      {users.length === 0 ? (
                        <p className="text-xs text-muted-foreground p-3">No team members found.</p>
                      ) : (
                        users.map((user: { id: string; firstName: string; lastName: string; email: string }) => {
                          const checked = field.value?.includes(user.id) ?? false;
                          return (
                            <label
                              key={user.id}
                              className="flex items-center gap-3 px-3 py-2 hover:bg-accent/50 cursor-pointer text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const next = e.target.checked
                                    ? [...(field.value ?? []), user.id]
                                    : (field.value ?? []).filter((id) => id !== user.id);
                                  field.onChange(next);
                                }}
                                className="rounded border-border"
                              />
                              <span className="font-medium">{user.firstName} {user.lastName}</span>
                              <span className="text-muted-foreground text-xs truncate">{user.email}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  )}
                />
                {errors.assigneeIds && (
                  <p className="text-destructive text-xs mt-1">{errors.assigneeIds.message}</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Attachments</label>
                <label className={cn(
                  'flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-lg p-4 cursor-pointer',
                  'hover:border-primary/50 hover:bg-accent/30 transition-colors',
                )}>
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click to upload files</span>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.zip"
                    onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                  />
                </label>
                {files.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {files.map((f) => (
                      <li key={f.name} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Paperclip className="h-3 w-3" />
                        {f.name} ({(f.size / 1024).toFixed(1)} KB)
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {mutation.isError && (
                <p className="text-destructive text-sm">Failed to create task. Check all required fields.</p>
              )}
            </div>

            <div className="flex justify-end gap-2 p-6 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending || projects.length === 0}>
                {mutation.isPending ? 'Creating...' : 'Create Task'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
