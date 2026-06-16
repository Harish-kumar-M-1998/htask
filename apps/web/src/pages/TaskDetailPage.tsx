import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, FolderKanban, Pencil, Trash2 } from 'lucide-react';
import { formatTaskStatus, formatTaskType } from '@htask/shared';
import { tasksApi } from '@/services/api';
import { useAuthStore } from '@/store';
import { Button } from '@/shared/ui/button';
import { TaskPipeline } from '@/widgets/task/TaskPipeline';
import { TaskActivityLog, countActivities } from '@/widgets/task/TaskActivityLog';
import { TaskDevTime } from '@/widgets/task/TaskDevTime';
import { EditTaskDialog } from '@/features/tasks/EditTaskDialog';

const PRIORITY_STYLES: Record<string, string> = {
  LOW: 'text-slate-500 bg-slate-500/15',
  MEDIUM: 'text-amber-500 bg-amber-500/15',
  HIGH: 'text-red-400 bg-red-500/15',
  CRITICAL: 'text-red-500 bg-red-500/20',
};

function formatIsoDate(date: string): string {
  return new Date(date).toISOString().slice(0, 10);
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-border/60 last:border-0 text-sm">
      <span className="text-muted-foreground capitalize">{label}</span>
      <span className="font-medium text-right font-mono text-xs sm:text-sm truncate">{value}</span>
    </div>
  );
}

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: () => tasksApi.get(id!).then((r) => r.data.data),
    enabled: !!id,
  });

  const { data: transitions } = useQuery({
    queryKey: ['task-transitions', id],
    queryFn: () => tasksApi.getTransitions(id!).then((r) => r.data.data),
    enabled: !!id,
  });

  const transitionMutation = useMutation({
    mutationFn: (toState: string) => tasksApi.transition(id!, { toState }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      queryClient.invalidateQueries({ queryKey: ['task-transitions', id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => tasksApi.remove(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (task?.projectId) {
        queryClient.invalidateQueries({ queryKey: ['project-tasks', task.projectId] });
        queryClient.invalidateQueries({ queryKey: ['project', task.projectId] });
      }
      navigate(task?.projectId ? `/projects/${task.projectId}` : '/tasks');
    },
  });

  if (isLoading) {
    return <div className="h-full min-h-[200px] animate-pulse bg-muted rounded-xl" />;
  }

  if (!task) {
    return <p className="text-muted-foreground">Task not found</p>;
  }

  const canUpdate =
    user?.permissions.includes('task:update') ||
    (user?.permissions.includes('task:update_own') && task.createdById === user?.id);
  const canDelete =
    user?.permissions.includes('task:delete') ||
    (user?.permissions.includes('task:delete_own') && task.createdById === user?.id);

  const histories = task.histories ?? [];
  const activityCount = countActivities(histories);
  const priorityClass = PRIORITY_STYLES[task.priority] ?? PRIORITY_STYLES.MEDIUM;

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      <Link
        to="/tasks"
        className="mb-4 inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
      >
        <ArrowLeft className="h-4 w-4" />
        Tasks
      </Link>

      <div className="shrink-0 mb-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="text-sm font-mono text-muted-foreground">{task.key}</span>
              <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-semibold tracking-wide text-muted-foreground">
                {formatTaskStatus(task.status)}
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase ${priorityClass}`}>
                <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                {task.priority}
              </span>
              <span className="rounded-md bg-blue-500/15 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-blue-600 dark:text-blue-400">
                {formatTaskType(task.type)}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{task.title}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {canUpdate && (
              <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
            )}
            {canDelete && !confirmDelete && (
              <Button
                variant="outline"
                size="sm"
                className="text-destructive border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            )}
            {confirmDelete && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-destructive">Confirm delete?</span>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteMutation.mutate()}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Yes, delete'}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setConfirmDelete(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>

        {transitions?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {transitions.map((t: { toState: string; name: string }) => (
              <Button
                key={t.toState}
                size="sm"
                variant="outline"
                disabled={transitionMutation.isPending}
                onClick={() => transitionMutation.mutate(t.toState)}
              >
                {t.name}
              </Button>
            ))}
          </div>
        )}
      </div>

      <TaskPipeline currentStatus={task.status} />

      <div className="grid flex-1 min-h-0 lg:grid-cols-3 gap-4 mt-4 overflow-hidden">
        <div className="lg:col-span-2 flex flex-col min-h-0 gap-4 overflow-hidden">
          <div className="dashboard-card shrink-0 overflow-hidden flex flex-col max-h-[min(24vh,180px)] p-0">
            <div className="shrink-0 px-5 pt-5 pb-2">
              <h2 className="text-sm font-semibold">Description</h2>
            </div>
            <div className="mx-5 mb-5 flex-1 min-h-0 overflow-y-auto rounded-lg bg-muted/50 border border-border/60 px-4 py-3">
              <p className="text-sm whitespace-pre-wrap text-foreground/90">
                {task.description || 'No description'}
              </p>
            </div>
          </div>

          <div className="dashboard-card flex flex-1 min-h-0 flex-col overflow-hidden p-0">
            <div className="shrink-0 flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="text-sm font-semibold">Activity log</h2>
              <span className="text-xs text-muted-foreground">{activityCount} events</span>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-5 pb-5">
              <TaskActivityLog history={histories} />
            </div>
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto overflow-x-hidden space-y-4 pr-1">
          {task.project && (
            <div className="dashboard-card p-5">
              <h2 className="text-sm font-semibold mb-4">Project</h2>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold">
                  {task.project.key?.[0]}
                </div>
                <div className="min-w-0">
                  <Link
                    to={`/projects/${task.project.id}`}
                    className="font-semibold hover:text-blue-600 dark:hover:text-blue-400 transition-colors truncate block"
                  >
                    {task.project.name}
                  </Link>
                  <p className="text-xs text-muted-foreground font-mono">{task.project.key}</p>
                </div>
              </div>
              <Link
                to={`/tasks?projectId=${task.project.id}`}
                className="inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline mt-4"
              >
                <FolderKanban className="h-3.5 w-3.5" />
                View all project tasks
              </Link>
            </div>
          )}

          <TaskDevTime
            history={histories}
            currentStatus={task.status}
            estimatedHours={task.estimatedHours}
          />

          <div className="dashboard-card p-5">
            <h2 className="text-sm font-semibold mb-1">Details</h2>
            <DetailRow label="Type" value={task.type ? formatTaskType(task.type) : '—'} />
            <DetailRow label="Story points" value={task.storyPoints != null ? String(task.storyPoints) : '—'} />
            <DetailRow label="ETA (hours)" value={task.estimatedHours != null ? String(task.estimatedHours) : '—'} />
            <DetailRow
              label="Due date"
              value={task.dueDate ? formatIsoDate(task.dueDate) : '—'}
            />
            <DetailRow label="Module" value={task.module?.name ?? '—'} />
          </div>
        </div>
      </div>

      <EditTaskDialog open={editOpen} onOpenChange={setEditOpen} task={task} />
    </div>
  );
}
