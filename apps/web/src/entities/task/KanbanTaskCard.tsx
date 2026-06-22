import { formatTaskStatus } from '@htask/shared';
import { Calendar, GripVertical, User } from 'lucide-react';
import { PRIORITY_COLORS, cn, formatDate } from '@/lib/utils';

export type KanbanTask = {
  id: string;
  key: string;
  title: string;
  status: string;
  priority: string;
  dueDate?: string | null;
  project?: { name?: string; key?: string };
  assignees?: Array<{ user: { firstName: string; lastName: string } }>;
};

interface KanbanTaskCardProps {
  task: KanbanTask;
  draggable?: boolean;
  highlighted?: boolean;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
}

export function KanbanTaskCard({
  task,
  draggable = false,
  highlighted = false,
  onClick,
  onDragStart,
  onDragEnd,
}: KanbanTaskCardProps) {
  const assignees = task.assignees ?? [];
  const isOverdue =
    task.dueDate && new Date(task.dueDate) < new Date() && !['CLOSED', 'ARCHIVED'].includes(task.status);

  return (
    <article
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      className={cn(
        'group rounded-lg border border-border bg-card p-3 shadow-sm transition-all',
        'hover:shadow-md hover:border-primary/30 cursor-pointer',
        highlighted && 'ring-2 ring-primary/50 border-primary/40 bg-primary/5',
        draggable && 'active:cursor-grabbing',
      )}
    >
      <div className="flex items-start gap-2 mb-2">
        {draggable && (
          <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[11px] font-mono text-muted-foreground">{task.key}</span>
            <span
              className={cn(
                'text-[10px] font-semibold uppercase',
                PRIORITY_COLORS[task.priority] ?? 'text-muted-foreground',
              )}
            >
              {task.priority}
            </span>
          </div>
          <h3 className="text-sm font-medium leading-snug line-clamp-2">{task.title}</h3>
        </div>
      </div>

      {task.project && (
        <p className="text-[11px] text-muted-foreground truncate mb-2 pl-6">
          {task.project.name}
          {task.project.key ? ` · ${task.project.key}` : ''}
        </p>
      )}

      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground pl-6">
        <span className="truncate">{formatTaskStatus(task.status)}</span>
        <div className="flex items-center gap-2 shrink-0">
          {assignees.length > 0 && (
            <span className="flex items-center gap-1 max-w-[88px] truncate">
              <User className="h-3 w-3" />
              {assignees[0].user.firstName}
            </span>
          )}
          {task.dueDate && (
            <span className={cn('flex items-center gap-1', isOverdue && 'text-red-500 font-medium')}>
              <Calendar className="h-3 w-3" />
              {formatDate(task.dueDate)}
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
