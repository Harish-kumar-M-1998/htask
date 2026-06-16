import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { tasksApi, projectsApi } from '@/services/api';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { selectClassName, textareaClassName } from '@/lib/formStyles';

const editTaskSchema = z.object({
  title: z.string().min(1, 'Task name is required').max(500),
  description: z.string().min(1, 'Description is required'),
  moduleId: z.string().optional(),
  type: z.enum(['FEATURE', 'ENHANCEMENT', 'BUG_FIX', 'SUPPORT']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  dueDate: z.string().optional(),
  estimatedHours: z.union([z.coerce.number().min(0), z.literal('')]).optional(),
});

type EditTaskValues = z.infer<typeof editTaskSchema>;

const TASK_TYPES = [
  { value: 'FEATURE', label: 'Task' },
  { value: 'BUG_FIX', label: 'Bug' },
  { value: 'ENHANCEMENT', label: 'Enhancement' },
  { value: 'SUPPORT', label: 'Support' },
] as const;

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;

interface EditTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: {
    id: string;
    projectId: string;
    title: string;
    description?: string | null;
    moduleId?: string | null;
    type: string;
    priority: string;
    dueDate?: string | null;
    estimatedHours?: number | null;
  };
}

export function EditTaskDialog({ open, onOpenChange, task }: EditTaskDialogProps) {
  const queryClient = useQueryClient();

  const { data: projectDetail } = useQuery({
    queryKey: ['project', task.projectId],
    queryFn: () => projectsApi.get(task.projectId).then((r) => r.data.data),
    enabled: open && !!task.projectId,
  });

  const modules = projectDetail?.modules ?? [];

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditTaskValues>({
    resolver: zodResolver(editTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      moduleId: '',
      type: 'FEATURE',
      priority: 'MEDIUM',
      dueDate: '',
      estimatedHours: '',
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: task.title,
        description: task.description ?? '',
        moduleId: task.moduleId ?? '',
        type: task.type as EditTaskValues['type'],
        priority: task.priority as EditTaskValues['priority'],
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '',
        estimatedHours: task.estimatedHours ?? '',
      });
    }
  }, [open, task, reset]);

  const mutation = useMutation({
    mutationFn: (values: EditTaskValues) =>
      tasksApi.update(task.id, {
        title: values.title,
        description: values.description.trim(),
        moduleId: values.moduleId || null,
        type: values.type,
        priority: values.priority,
        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : null,
        estimatedHours: values.estimatedHours === '' ? null : Number(values.estimatedHours),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['project-tasks', task.projectId] });
      onOpenChange(false);
    },
  });

  const selectClass = selectClassName;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg max-h-[90vh] -translate-x-1/2 -translate-y-1/2 dashboard-card bg-card shadow-xl flex flex-col">
          <div className="flex items-center justify-between p-6 pb-0">
            <Dialog.Title className="text-lg font-semibold">Edit Task</Dialog.Title>
            <Dialog.Close asChild>
              <button className="rounded-lg p-1 hover:bg-accent transition-colors">
                <X className="h-4 w-4" />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit((values) => mutation.mutate(values))} className="flex flex-col flex-1 min-h-0">
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
                  placeholder="Describe the task..."
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
                <label className="text-sm font-medium mb-1.5 block">Module</label>
                <select {...register('moduleId')} className={selectClass}>
                  <option value="">No module</option>
                  {modules.map((m: { id: string; name: string }) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Deadline</label>
                  <Input {...register('dueDate')} type="date" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">ETA (hours)</label>
                  <Input {...register('estimatedHours')} type="number" min={0} step={0.5} placeholder="e.g. 8" />
                </div>
              </div>

              {mutation.isError && (
                <p className="text-destructive text-sm">Failed to update task. Please try again.</p>
              )}
            </div>

            <div className="flex justify-end gap-2 p-6 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Saving...' : 'Save changes'}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
