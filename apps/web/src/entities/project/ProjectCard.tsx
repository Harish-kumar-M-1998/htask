import { List, Users } from 'lucide-react';

export interface ProjectCardData {
  id: string;
  name: string;
  key: string;
  description?: string | null;
  _count?: { tasks: number; members?: number };
  members?: Array<{ user: { firstName: string; lastName: string } }>;
}

interface ProjectCardProps {
  project: ProjectCardData;
  onClick?: () => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const taskCount = project._count?.tasks ?? 0;
  const memberCount =
    project.members?.length ?? project._count?.members ?? 0;
  const memberNames =
    project.members?.map((m) => `${m.user.firstName} ${m.user.lastName}`) ?? [];

  return (
    <button
      type="button"
      onClick={onClick}
      className="dashboard-card w-full overflow-hidden p-5 text-left shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-sm font-bold text-white dark:bg-white dark:text-neutral-900">
          {project.key?.[0]?.toUpperCase() ?? '?'}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-foreground">{project.name}</h3>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{project.key}</p>
        </div>
      </div>

      <p className="mt-4 line-clamp-2 text-sm text-foreground">
        {project.description?.trim() || 'No description'}
      </p>

      <div className="mt-4 border-t border-border pt-3">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <List className="h-3.5 w-3.5" />
            {taskCount} {taskCount === 1 ? 'task' : 'tasks'}
          </span>
          <span className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            {memberCount} {memberCount === 1 ? 'member' : 'members'}
          </span>
        </div>

        {memberNames.length > 0 && (
          <p className="mt-2 truncate text-xs text-muted-foreground">
            {memberNames.join(' · ')}
          </p>
        )}
      </div>
    </button>
  );
}
