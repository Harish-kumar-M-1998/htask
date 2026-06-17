import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { motion } from 'framer-motion';
import { FolderKanban, Plus } from 'lucide-react';
import { projectsApi } from '@/services/api';
import { useAuthStore } from '@/store';
import { Button } from '@/shared/ui/button';
import { CreateProjectDialog } from '@/features/projects/CreateProjectDialog';
import { PageShell } from '@/shared/layouts/PageShell';
import { ProjectCard, type ProjectCardData } from '@/entities/project/ProjectCard';
import { CardGridSkeleton } from '@/shared/components/skeletons';

export function ProjectsPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const canCreate = user?.permissions.includes('project:create');
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.list().then((r) => r.data),
  });

  const projects = data?.data ?? [];

  return (
    <PageShell
      title="Projects"
      subtitle={`${data?.meta?.total ?? 0} projects`}
      action={
        canCreate ? (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New Project
          </Button>
        ) : undefined
      }
    >
      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden pr-1 space-y-6">
      {isError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm">
          Failed to load projects.{' '}
          <button className="underline font-medium" onClick={() => refetch()}>Retry</button>
        </div>
      )}

      {isLoading ? (
        <CardGridSkeleton count={4} variant="project" />
      ) : projects.length === 0 ? (
        <div className="text-center py-16">
          <FolderKanban className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg">No projects yet</h3>
          <p className="text-muted-foreground text-sm mt-1 mb-4">
            {canCreate ? 'Create your first project to get started.' : 'No projects available.'}
          </p>
          {canCreate && (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {projects.map((project: ProjectCardData, i: number) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
            >
              <ProjectCard
                project={project}
                onClick={() => navigate(`/projects/${project.id}`)}
              />
            </motion.div>
          ))}
        </div>
      )}

      <CreateProjectDialog open={createOpen} onOpenChange={setCreateOpen} />
      </div>
    </PageShell>
  );
}
