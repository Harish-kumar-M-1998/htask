import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  ListTodo,
  Layers,
  Users,
  Plus,
  List,
  ChevronRight,
} from 'lucide-react';
import { projectsApi, tasksApi } from '@/services/api';
import { ProjectDetailSkeleton, TableRowsSkeleton } from '@/shared/components/skeletons';
import { useAuthStore } from '@/store';
import { Button } from '@/shared/ui/button';
import { TaskTable } from '@/widgets/TaskTable';
import { ProjectFormDialog } from '@/features/projects/ProjectFormDialog';
import { AddModuleDialog } from '@/features/projects/AddModuleDialog';
import { CreateTaskDialog } from '@/features/tasks/CreateTaskDialog';
import { formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { AvatarInitials, getInitials } from '@/shared/components/AvatarInitials';

function ProjectStatusBadge({ status }: { status: string }) {
  const isActive = status === 'ACTIVE';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide',
        isActive ? 'text-primary' : 'text-muted-foreground',
      )}
    >
      <span
        className={cn(
          'h-2 w-2 rounded-full',
          isActive ? 'bg-primary' : 'bg-muted-foreground',
        )}
      />
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function MemberRoleBadge({ role }: { role: string }) {
  const isOwner = role === 'OWNER';
  return (
    <span
      className={cn(
        'shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide',
        isOwner
          ? 'pill-brand'
          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
      )}
    >
      {role}
    </span>
  );
}

function StatCard({
  value,
  label,
  icon: Icon,
}: {
  value: number;
  label: string;
  icon: typeof ListTodo;
}) {
  return (
    <div className="dashboard-card flex flex-col items-center justify-center px-4 py-5 text-center">
      <p className="text-3xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </p>
    </div>
  );
}

function QuickActionItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof List;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-lg px-1 py-2.5 text-sm text-foreground hover:bg-accent/50 transition-colors text-left"
    >
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="flex-1">{label}</span>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </button>
  );
}

export function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const canUpdate = user?.permissions.includes('project:update');
  const canDelete = user?.permissions.includes('project:delete');
  const canCreateTask = user?.permissions.includes('task:create');

  const [editOpen, setEditOpen] = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [addModuleOpen, setAddModuleOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.get(id!).then((r) => r.data.data),
    enabled: !!id,
  });

  const { data: history } = useQuery({
    queryKey: ['project-history', id],
    queryFn: () => projectsApi.getHistory(id!).then((r) => r.data.data),
    enabled: !!id,
  });

  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['project-tasks', id],
    queryFn: () =>
      tasksApi.list({ projectId: id, page: 1, limit: 100 }).then((r) => r.data),
    enabled: !!id,
  });

  const projectTasks = tasksData?.data ?? [];

  const deleteMutation = useMutation({
    mutationFn: () => projectsApi.remove(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate('/projects');
    },
  });

  if (isLoading) {
    return <ProjectDetailSkeleton />;
  }

  if (!project) {
    return <p className="text-muted-foreground">Project not found</p>;
  }

  const taskCount = project._count?.tasks ?? 0;
  const moduleCount = project.modules?.length ?? 0;
  const memberCount = project.members?.length ?? 0;
  const latestActivity = history?.[0];

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      <Link
        to="/projects"
        className="mb-4 inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
      >
        <ArrowLeft className="h-4 w-4" />
        Projects
      </Link>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between shrink-0">
        <div className="flex items-start gap-4 min-w-0">
          <div className="brand-tile h-14 w-14 rounded-xl text-xl">
            {project.key[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {project.key}
              </span>
              <ProjectStatusBadge status={project.status} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight truncate">{project.name}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {project.description || 'No description'}
            </p>
          </div>
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

      <div className="grid flex-1 min-h-0 gap-6 lg:grid-cols-3 overflow-hidden">
        <div className="lg:col-span-2 flex flex-col gap-6 min-h-0 overflow-y-auto pr-1">
          <div className="grid grid-cols-3 gap-4 shrink-0">
            <StatCard value={taskCount} label="Tasks" icon={ListTodo} />
            <StatCard value={moduleCount} label="Modules" icon={Layers} />
            <StatCard value={memberCount} label="Members" icon={Users} />
          </div>

          <div className="dashboard-card flex flex-1 min-h-0 flex-col overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 shrink-0">
              <h2 className="font-semibold">Tasks</h2>
              <div className="flex flex-wrap items-center gap-2">
                {canCreateTask && (
                  <Button
                    size="sm"
                    onClick={() => setCreateTaskOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                    Add task
                  </Button>
                )}
                {canUpdate && (
                  <Button variant="outline" size="sm" onClick={() => setAddModuleOpen(true)}>
                    <Layers className="h-4 w-4" />
                    Add module
                  </Button>
                )}
              </div>
            </div>

            {tasksLoading ? (
              <div className="flex-1 overflow-hidden">
                <TableRowsSkeleton rows={5} />
              </div>
            ) : projectTasks.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl icon-tile-brand">
                  <List className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-semibold">No tasks in this project yet</h3>
                <p className="mt-2 max-w-md text-sm text-muted-foreground">
                  Create your first task to start tracking work, or add a module to organize tasks
                  by feature area.
                </p>
              </div>
            ) : (
              <TaskTable
                tasks={projectTasks}
                showProject={false}
                showModule
                onRowClick={(taskId) => navigate(`/tasks/${taskId}`)}
              />
            )}
          </div>
        </div>

        <div className="flex flex-col gap-4 min-h-0 overflow-y-auto pr-1">
          <div className="dashboard-card shrink-0">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
              <h2 className="font-semibold">Team members</h2>
              {canUpdate && (
                <button
                  type="button"
                  onClick={() => setEditOpen(true)}
                  className="text-sm font-medium link-brand hover:underline"
                >
                  + Invite
                </button>
              )}
            </div>
            <div className="divide-y divide-border">
              {project.members?.length ? (
                project.members.map(
                  (
                    m: {
                      userId: string;
                      role: string;
                      user: { firstName: string; lastName: string; email: string };
                    },
                  ) => (
                    <div key={m.userId} className="flex items-center gap-3 px-5 py-3.5">
                      <AvatarInitials
                        initials={getInitials(m.user.firstName, m.user.lastName)}
                        size="md"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold truncate">
                          {m.user.firstName} {m.user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{m.user.email}</p>
                      </div>
                      <MemberRoleBadge role={m.role} />
                    </div>
                  ),
                )
              ) : (
                <p className="px-5 py-4 text-sm text-muted-foreground">No members assigned</p>
              )}
            </div>
          </div>

          <div className="dashboard-card shrink-0 p-5">
            <h2 className="font-semibold mb-4">Activity</h2>
            {latestActivity ? (
              <div className="flex gap-3">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0">
                  <p className="text-sm leading-snug">
                    {latestActivity.description || latestActivity.action}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {latestActivity.actorName} · {formatRelativeTime(latestActivity.createdAt)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No activity yet</p>
            )}
          </div>

          <div className="dashboard-card shrink-0 p-5">
            <h2 className="font-semibold mb-2">Quick actions</h2>
            <div className="divide-y divide-border">
              <QuickActionItem
                icon={List}
                label="View project tasks"
                onClick={() => navigate(`/tasks?projectId=${project.id}`)}
              />
              {canUpdate && (
                <QuickActionItem
                  icon={Pencil}
                  label="Edit project"
                  onClick={() => setEditOpen(true)}
                />
              )}
              {canUpdate && (
                <QuickActionItem
                  icon={Users}
                  label="Manage members"
                  onClick={() => setEditOpen(true)}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      <ProjectFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        project={project}
      />
      <CreateTaskDialog
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        defaultProjectId={project.id}
      />
      <AddModuleDialog
        open={addModuleOpen}
        onOpenChange={setAddModuleOpen}
        projectId={project.id}
      />
    </div>
  );
}
