import { Badge } from '@/shared/ui/badge';
import { PRIORITY_COLORS, formatDate } from '@/lib/utils';
import { formatTaskStatus } from '@htask/shared';
import { User, FolderKanban } from 'lucide-react';

interface TaskCardProps {
  task: Record<string, unknown>;
  onClick?: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const assignees = (task.assignees as Array<{ user: { firstName: string; lastName: string } }>) ?? [];
  const project = task.project as { name?: string; key?: string } | undefined;

  return (
    <div
      onClick={onClick}
      className="dashboard-card p-4 cursor-pointer hover:shadow-md transition-all duration-200"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono text-muted-foreground">{task.key as string}</span>
        <Badge variant="status" status={task.status as string}>
          {formatTaskStatus(task.status as string)}
        </Badge>
      </div>
      <h3 className="font-medium text-sm line-clamp-2 mb-2">{task.title as string}</h3>
      {project && (
        <p className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
          <FolderKanban className="h-3 w-3 shrink-0" />
          <span className="truncate">{project.name}</span>
          <span className="font-mono text-[10px]">({project.key})</span>
        </p>
      )}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className={PRIORITY_COLORS[task.priority as string] ?? ''}>
          {task.priority as string}
        </span>
        <div className="flex items-center gap-2">
          {assignees.length > 0 && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {assignees[0].user.firstName}
            </span>
          )}
          {task.dueDate ? <span>{formatDate(task.dueDate as string)}</span> : null}
        </div>
      </div>
    </div>
  );
}
