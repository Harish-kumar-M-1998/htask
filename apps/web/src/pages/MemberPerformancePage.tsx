import { Link, Navigate, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { analyticsApi } from '@/services/api';
import { useAuthStore } from '@/store';
import { PageShell } from '@/shared/layouts/PageShell';
import { MemberProfileCard } from '@/widgets/team/MemberProfileCard';
import { MemberThroughputCards } from '@/widgets/team/MemberThroughputCards';
import { MemberCompletionRateCard } from '@/widgets/team/MemberCompletionRateCard';
import { MemberEtaDistribution } from '@/widgets/team/MemberEtaDistribution';
import { MemberProjectBreakdownTable } from '@/widgets/team/MemberProjectBreakdownTable';
import { MemberCurrentWorkloadCard } from '@/widgets/team/MemberCurrentWorkloadCard';
import { MemberRecentCompletions } from '@/widgets/team/MemberRecentCompletions';
import { MemberPerformanceSkeleton } from '@/shared/components/skeletons';

type MemberPerformancePayload = {
  member: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
    createdAt: string;
    roles: Array<{ code: string; name: string }>;
  };
  range: {
    from: string | null;
    to: string | null;
    allTime: boolean;
  };
  kpis: {
    totalAssignedTasks: number;
    completedTasks: number;
    completionRate: number;
    completedBeforeEta: number;
    completedOnEta: number;
    completedOverEta: number;
    completedNoEtaData: number;
    totalProductiveHours: number;
  };
  currentWorkload: {
    activeTasks: number;
    activeByStatus: Array<{ status: string; count: number }>;
    currentProjects: Array<{ id: string; key: string; name: string; activeTasks: number }>;
    workedProjectsCount: number;
  };
  projectBreakdown: Array<{
    projectId: string;
    projectKey: string;
    projectName: string;
    assignedTasks: number;
    completedTasks: number;
    beforeEta: number;
    onEta: number;
    overEta: number;
    noEtaData: number;
    avgVarianceHours: number | null;
  }>;
  etaDistribution: Array<{ bucket: 'before_eta' | 'on_eta' | 'over_eta' | 'no_eta_data'; count: number }>;
  recentCompletions: Array<{
    taskId: string;
    taskKey: string;
    taskTitle: string;
    projectId: string;
    projectKey: string;
    projectName: string;
    completedAt: string;
    estimatedHours: number | null;
    actualHours: number | null;
    varianceHours: number | null;
    etaBucket: 'before_eta' | 'on_eta' | 'over_eta' | 'no_eta_data';
  }>;
};

export function MemberPerformancePage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);
  const canViewAnalytics = user?.permissions.includes('analytics:view');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['member-performance', id],
    queryFn: () => analyticsApi.memberPerformance(id!).then((r) => r.data.data as MemberPerformancePayload),
    enabled: !!id && !!canViewAnalytics,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  if (!canViewAnalytics) {
    return <Navigate to="/tasks" replace />;
  }

  if (isLoading) {
    return <MemberPerformanceSkeleton />;
  }

  if (isError || !data) {
    return (
      <div className="dashboard-card p-5">
        <p className="text-sm text-destructive">Unable to load member performance.</p>
        <button className="mt-2 text-sm underline" onClick={() => refetch()}>
          Retry
        </button>
      </div>
    );
  }

  const memberName = `${data.member.firstName} ${data.member.lastName}`;

  return (
    <PageShell
      title={`${memberName} performance`}
      subtitle={data.range.allTime ? 'All-time performance analytics' : 'Filtered performance analytics'}
    >
      <div className="flex flex-1 min-h-0 min-w-0 flex-col overflow-y-auto space-y-4 pb-4">
        <Link
          to="/team"
          className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to team
        </Link>

        <MemberProfileCard
          firstName={data.member.firstName}
          lastName={data.member.lastName}
          email={data.member.email}
          status={data.member.status}
          createdAt={data.member.createdAt}
          roleName={data.member.roles[0]?.name ?? 'Member'}
        />

        <MemberThroughputCards kpis={data.kpis} />

        <div className="grid gap-4 lg:grid-cols-2">
          <MemberCompletionRateCard
            completedTasks={data.kpis.completedTasks}
            totalAssignedTasks={data.kpis.totalAssignedTasks}
            totalProductiveHours={data.kpis.totalProductiveHours}
            completionRate={data.kpis.completionRate}
          />
          <MemberEtaDistribution rows={data.etaDistribution} />
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="dashboard-card p-5">
            <h3 className="text-base font-semibold">Project contribution breakdown</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Tasks completed and ETA outcomes by project.
            </p>
            <div className="mt-4">
              <MemberProjectBreakdownTable rows={data.projectBreakdown} />
            </div>
          </div>

          <MemberCurrentWorkloadCard
            activeTasks={data.currentWorkload.activeTasks}
            currentProjectsCount={data.currentWorkload.currentProjects.length}
            workedProjectsCount={data.currentWorkload.workedProjectsCount}
            activeByStatus={data.currentWorkload.activeByStatus}
          />
        </div>

        <div className="dashboard-card p-5">
          <h3 className="text-base font-semibold">Recent completions</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Latest 20 completed tasks and ETA outcome details.
          </p>
          <div className="mt-4">
            <MemberRecentCompletions
              rows={data.recentCompletions}
              memberFirstName={data.member.firstName}
            />
          </div>
        </div>
      </div>
    </PageShell>
  );
}
