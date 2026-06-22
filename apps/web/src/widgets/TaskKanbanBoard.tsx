import { TASK_STATUSES, formatTaskStatus } from '@htask/shared';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KANBAN_COLUMNS, groupTasksByKanbanColumn } from '@/lib/kanbanColumns';
import {
  getColumnIdForStatus,
  getColumnIndex,
  hasDirectTransitionToColumn,
  isBackwardColumnDrop,
} from '@/lib/kanbanTransitions';
import { KanbanTaskCard, type KanbanTask } from '@/entities/task/KanbanTaskCard';
import { tasksApi } from '@/services/api';
import { cn } from '@/lib/utils';

interface TaskKanbanBoardProps {
  tasks: KanbanTask[];
  searchQuery?: string;
  onTaskClick: (id: string) => void;
  canTransition?: boolean;
}

type TransitionOption = { toState: string };

const MAX_AUTO_STEPS = 12;

function buildBlockedMoveMessage(currentStatus: string, targetTitle: string, available: TransitionOption[]) {
  if (available.length === 0) {
    return `Cannot move to ${targetTitle} from ${formatTaskStatus(currentStatus)}. No transitions are available for your role.`;
  }
  const options = available.map((t) => formatTaskStatus(t.toState)).join(', ');
  return `Cannot move to ${targetTitle} from ${formatTaskStatus(currentStatus)}. Allowed next step(s): ${options}.`;
}

function pickForwardTransition(
  currentStatus: string,
  available: TransitionOption[],
  targetStatuses: string[],
): TransitionOption | null {
  const direct = available.find((t) => targetStatuses.includes(t.toState));
  if (direct) return direct;
  if (available.length === 0) return null;

  const currentIdx = TASK_STATUSES.indexOf(currentStatus as (typeof TASK_STATUSES)[number]);
  const targetIndexes = targetStatuses
    .map((s) => TASK_STATUSES.indexOf(s as (typeof TASK_STATUSES)[number]))
    .filter((idx) => idx >= 0);

  if (currentIdx < 0 || targetIndexes.length === 0) return null;

  const nearestTargetIdx = targetIndexes.reduce((best, idx) =>
    Math.abs(idx - currentIdx) < Math.abs(best - currentIdx) ? idx : best,
  );

  if (nearestTargetIdx <= currentIdx) return null;

  const forward = available.filter((t) => {
    const idx = TASK_STATUSES.indexOf(t.toState as (typeof TASK_STATUSES)[number]);
    return idx > currentIdx && idx <= nearestTargetIdx;
  });

  if (forward.length === 0) return null;

  return forward.reduce((best, next) => {
    const bestIdx = TASK_STATUSES.indexOf(best.toState as (typeof TASK_STATUSES)[number]);
    const nextIdx = TASK_STATUSES.indexOf(next.toState as (typeof TASK_STATUSES)[number]);
    return nextIdx > bestIdx ? next : best;
  });
}

export function TaskKanbanBoard({ tasks, searchQuery = '', onTaskClick, canTransition = false }: TaskKanbanBoardProps) {
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const columnRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dragTransitions, setDragTransitions] = useState<string[]>([]);
  const [moveError, setMoveError] = useState('');

  const grouped = useMemo(() => groupTasksByKanbanColumn(tasks), [tasks]);
  const trimmedSearch = searchQuery.trim().toLowerCase();
  const isSearchActive = trimmedSearch.length > 0;

  const taskMatchesSearch = (task: KanbanTask) => {
    if (!isSearchActive) return false;
    return (
      task.title.toLowerCase().includes(trimmedSearch) ||
      task.key.toLowerCase().includes(trimmedSearch)
    );
  };

  useEffect(() => {
    if (!isSearchActive || tasks.length === 0) return;

    const targetColumn = KANBAN_COLUMNS.find((column) => {
      const columnTasks = grouped.get(column.id) ?? [];
      return columnTasks.length > 0;
    });

    if (!targetColumn) return;

    const columnEl = columnRefs.current.get(targetColumn.id);
    const scrollEl = scrollRef.current;
    if (!columnEl || !scrollEl) return;

    const columnLeft = columnEl.offsetLeft;
    const columnWidth = columnEl.offsetWidth;
    const scrollWidth = scrollEl.clientWidth;
    const scrollTarget = Math.max(0, columnLeft - (scrollWidth - columnWidth) / 2);

    scrollEl.scrollTo({ left: scrollTarget, behavior: 'smooth' });
  }, [grouped, isSearchActive, tasks, trimmedSearch]);

  const draggingTask = useMemo(
    () => (draggingId ? tasks.find((task) => task.id === draggingId) ?? null : null),
    [draggingId, tasks],
  );

  const canDropOnColumn = (columnId: string, columnStatuses: string[]) => {
    if (!draggingTask || !canTransition) return false;
    if (columnStatuses.includes(draggingTask.status)) return false;
    if (hasDirectTransitionToColumn(dragTransitions, columnStatuses)) return true;
    if (isBackwardColumnDrop(draggingTask.status, columnId)) return false;
    return getColumnIndex(columnId) > getColumnIndex(getColumnIdForStatus(draggingTask.status));
  };

  const moveMutation = useMutation({
    mutationFn: async ({
      taskId,
      columnId,
      fromStatus,
    }: {
      taskId: string;
      columnId: string;
      fromStatus: string;
    }) => {
      const column = KANBAN_COLUMNS.find((c) => c.id === columnId);
      if (!column) throw new Error('Invalid column');

      const transitionsRes = await tasksApi.getTransitions(taskId);
      const initialAvailable = (transitionsRes.data.data ?? []) as TransitionOption[];

      if (isBackwardColumnDrop(fromStatus, columnId)) {
        const direct = initialAvailable.find((t) => column.statuses.includes(t.toState));
        if (!direct) {
          throw new Error(
            `Cannot move backward to ${column.title}. No direct workflow transition is allowed from ${formatTaskStatus(fromStatus)}.`,
          );
        }
        await tasksApi.transition(taskId, { toState: direct.toState });
        return;
      }

      let currentStatus = fromStatus;
      const visited = new Set<string>([currentStatus]);

      for (let i = 0; i < MAX_AUTO_STEPS; i += 1) {
        const stepRes = await tasksApi.getTransitions(taskId);
        const available = (stepRes.data.data ?? []) as TransitionOption[];
        const next = pickForwardTransition(currentStatus, available, column.statuses);

        if (!next) {
          throw new Error(buildBlockedMoveMessage(currentStatus, column.title, available));
        }

        if (visited.has(next.toState)) {
          throw new Error('This move creates a workflow loop and cannot be completed automatically.');
        }

        await tasksApi.transition(taskId, { toState: next.toState });
        currentStatus = next.toState;
        visited.add(currentStatus);

        if (column.statuses.includes(currentStatus)) {
          return;
        }
      }

      throw new Error('This move requires too many workflow steps. Please transition status manually.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task'] });
      queryClient.invalidateQueries({ queryKey: ['task-transitions'] });
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

  const handleDragStart = async (taskId: string) => {
    setDraggingId(taskId);
    setMoveError('');
    setDragTransitions([]);
    if (!canTransition) return;
    try {
      const transitionsRes = await tasksApi.getTransitions(taskId);
      const available = (transitionsRes.data.data ?? []) as TransitionOption[];
      setDragTransitions(available.map((t) => t.toState));
    } catch {
      setDragTransitions([]);
    }
  };

  const getDropHint = (columnId: string, columnStatuses: string[]) => {
    if (!draggingTask) return canTransition ? 'Drop tasks here' : 'No tasks';
    if (columnStatuses.includes(draggingTask.status)) return 'Already in this column';
    if (hasDirectTransitionToColumn(dragTransitions, columnStatuses)) return 'Valid next step';
    if (isBackwardColumnDrop(draggingTask.status, columnId)) {
      return 'Cannot move backward without a direct transition';
    }
    if (dragTransitions.length === 0) return 'No transition available for your role';
    if (canDropOnColumn(columnId, columnStatuses)) return 'Will auto-step forward';
    return 'No workflow path to this column';
  };

  const handleDrop = (columnId: string) => {
    if (!draggingId || !canTransition) return;
    const task = tasks.find((t) => t.id === draggingId);
    const column = KANBAN_COLUMNS.find((c) => c.id === columnId);
    if (!task || !column) return;

    if (column.statuses.includes(task.status)) {
      setDraggingId(null);
      setDropTargetId(null);
      return;
    }

    if (!canDropOnColumn(columnId, column.statuses)) {
      setMoveError(
        isBackwardColumnDrop(task.status, columnId)
          ? `Cannot move backward to ${column.title} from ${formatTaskStatus(task.status)}.`
          : `Cannot move to ${column.title} from ${formatTaskStatus(task.status)}.`,
      );
      setDraggingId(null);
      setDropTargetId(null);
      setDragTransitions([]);
      return;
    }

    moveMutation.mutate({ taskId: draggingId, columnId, fromStatus: task.status });
    setDraggingId(null);
    setDropTargetId(null);
    setDragTransitions([]);
  };

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {moveError && (
        <div className="shrink-0 mb-3 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {moveError}
        </div>
      )}

      <div ref={scrollRef} className="flex flex-1 min-h-0 gap-3 overflow-x-auto overflow-y-hidden pb-2">
        {KANBAN_COLUMNS.map((column) => {
          const columnTasks = grouped.get(column.id) ?? [];
          const isValidTarget = draggingTask !== null && canDropOnColumn(column.id, column.statuses);
          const isDropTarget = dropTargetId === column.id && draggingId !== null;
          const hasSearchResults = isSearchActive && columnTasks.length > 0;

          return (
            <section
              key={column.id}
              ref={(el) => {
                if (el) columnRefs.current.set(column.id, el);
                else columnRefs.current.delete(column.id);
              }}
              className={cn(
                'flex w-[280px] shrink-0 flex-col min-h-0 rounded-xl border border-border bg-muted/20',
                'border-t-[3px]',
                column.accent,
                hasSearchResults && 'ring-2 ring-primary/30',
                isDropTarget && isValidTarget && 'ring-2 ring-primary/40 bg-primary/5',
                isDropTarget && !isValidTarget && 'ring-2 ring-destructive/30 bg-destructive/5',
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
              <header className="shrink-0 flex items-center text-center justify-between px-3 py-3 border-b border-border/60">
                <h2 className="text-sm font-semibold">{column.title}</h2>
                <span className="badge-count text-[11px] min-w-[1.5rem] justify-center">
                  {columnTasks.length}
                </span>
              </header>

              <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2">
                {columnTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-8 px-2">
                    {getDropHint(column.id, column.statuses)}
                  </p>
                ) : (
                  columnTasks.map((task) => (
                    <KanbanTaskCard
                      key={task.id}
                      task={task}
                      highlighted={taskMatchesSearch(task)}
                      draggable={canTransition}
                      onClick={() => onTaskClick(task.id)}
                      onDragStart={() => {
                        void handleDragStart(task.id);
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDropTargetId(null);
                        setDragTransitions([]);
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
