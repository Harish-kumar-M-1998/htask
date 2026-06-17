import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KANBAN_COLUMNS, groupTasksByKanbanColumn } from '@/lib/kanbanColumns';
import { KanbanTaskCard, type KanbanTask } from '@/entities/task/KanbanTaskCard';
import { tasksApi } from '@/services/api';
import { cn } from '@/lib/utils';

interface TaskKanbanBoardProps {
  tasks: KanbanTask[];
  onTaskClick: (id: string) => void;
  canTransition?: boolean;
}

export function TaskKanbanBoard({ tasks, onTaskClick, canTransition = false }: TaskKanbanBoardProps) {
  const queryClient = useQueryClient();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [moveError, setMoveError] = useState('');

  const grouped = useMemo(() => groupTasksByKanbanColumn(tasks), [tasks]);

  const moveMutation = useMutation({
    mutationFn: async ({ taskId, columnId }: { taskId: string; columnId: string }) => {
      const column = KANBAN_COLUMNS.find((c) => c.id === columnId);
      if (!column) throw new Error('Invalid column');

      const transitionsRes = await tasksApi.getTransitions(taskId);
      const available = transitionsRes.data.data ?? [];
      const match = available.find((t: { toState: string }) => column.statuses.includes(t.toState));

      if (!match) {
        throw new Error('This move is not allowed by the workflow');
      }

      await tasksApi.transition(taskId, { toState: match.toState });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setMoveError('');
    },
    onError: (err: unknown) => {
      const apiMessage =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { error?: { message?: string } } } }).response?.data?.error
              ?.message
          : undefined;
      setMoveError(apiMessage ?? (err instanceof Error ? err.message : 'Could not move task'));
    },
  });

  const handleDrop = (columnId: string) => {
    if (!draggingId || !canTransition) return;
    const task = tasks.find((t) => t.id === draggingId);
    const column = KANBAN_COLUMNS.find((c) => c.id === columnId);
    if (task && column && column.statuses.includes(task.status)) {
      setDraggingId(null);
      setDropTargetId(null);
      return;
    }
    moveMutation.mutate({ taskId: draggingId, columnId });
    setDraggingId(null);
    setDropTargetId(null);
  };

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {moveError && (
        <div className="shrink-0 mb-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {moveError}
        </div>
      )}

      <div className="flex flex-1 min-h-0 gap-3 overflow-x-auto overflow-y-hidden pb-2">
        {KANBAN_COLUMNS.map((column) => {
          const columnTasks = grouped.get(column.id) ?? [];
          const isDropTarget = dropTargetId === column.id && draggingId !== null;

          return (
            <section
              key={column.id}
              className={cn(
                'flex w-[280px] shrink-0 flex-col min-h-0 rounded-xl border border-border bg-muted/20',
                'border-t-[3px]',
                column.accent,
                isDropTarget && 'ring-2 ring-primary/40 bg-primary/5',
              )}
              onDragOver={(e) => {
                if (!canTransition || !draggingId) return;
                e.preventDefault();
                setDropTargetId(column.id);
              }}
              onDragLeave={() => {
                if (dropTargetId === column.id) setDropTargetId(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                handleDrop(column.id);
              }}
            >
              <header className="shrink-0 flex items-center justify-between px-3 py-3 border-b border-border/60">
                <h2 className="text-sm font-semibold">{column.title}</h2>
                <span className="badge-count text-[11px] min-w-[1.5rem] justify-center">
                  {columnTasks.length}
                </span>
              </header>

              <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2">
                {columnTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8 px-2">
                    {canTransition ? 'Drop tasks here' : 'No tasks'}
                  </p>
                ) : (
                  columnTasks.map((task) => (
                    <KanbanTaskCard
                      key={task.id}
                      task={task}
                      draggable={canTransition}
                      onClick={() => onTaskClick(task.id)}
                      onDragStart={() => setDraggingId(task.id)}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDropTargetId(null);
                      }}
                    />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
