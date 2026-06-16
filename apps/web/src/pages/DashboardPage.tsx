import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { Users, CheckCircle2, AlertTriangle, FlaskConical } from 'lucide-react';
import { analyticsApi } from '@/services/api';
import { PageShell } from '@/shared/layouts/PageShell';
import { cn } from '@/lib/utils';
import { TaskDistributionChart } from '@/widgets/charts/TaskDistributionChart';
import { UtilizationChart } from '@/widgets/charts/UtilizationChart';
import { ActivityFeed } from '@/widgets/ActivityFeed';
import type { DashboardMetrics } from '@htask/shared';

const metrics = [
  {
    key: 'activeUsers' as const,
    label: 'Active users',
    icon: Users,
    iconBg: 'icon-tile-brand',
    badge: 'online',
    badgeClass: 'pill-brand rounded-md px-2 py-0.5 text-[11px] font-semibold',
  },
  {
    key: 'tasksInProgress' as const,
    label: 'In progress',
    icon: CheckCircle2,
    iconBg: 'icon-tile-brand',
    badge: 'running',
    badgeClass: 'pill-brand rounded-md px-2 py-0.5 text-[11px] font-semibold',
  },
  {
    key: 'overdueTasks' as const,
    label: 'Overdue',
    icon: AlertTriangle,
    iconBg: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
    badge: 'action',
    badgeClass: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
  },
  {
    key: 'qaQueue' as const,
    label: 'QA queue',
    icon: FlaskConical,
    iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400',
    badge: 'clear',
    badgeClass: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  },
];

export function DashboardPage() {
  const navigate = useNavigate();

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => analyticsApi.dashboard('manager').then((r) => r.data.data as DashboardMetrics),
  });

  const { data: distribution } = useQuery({
    queryKey: ['task-distribution'],
    queryFn: () => analyticsApi.taskDistribution().then((r) => r.data.data),
  });

  const { data: utilization } = useQuery({
    queryKey: ['utilization'],
    queryFn: () => analyticsApi.utilization().then((r) => r.data.data),
  });

  const totalTasks = (distribution ?? []).reduce((sum: number, d: { count: number }) => sum + d.count, 0);

  return (
    <PageShell title="Dashboard" subtitle="Real-time overview of your workspace">
      <div className="flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden space-y-6 pr-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {metrics.map((m) => (
            <div key={m.key} className="dashboard-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', m.iconBg)}>
                  <m.icon className="h-5 w-5" />
                </div>
                <span className={cn('rounded-md px-2 py-0.5 text-[11px] font-semibold', m.badgeClass)}>
                  {m.badge}
                </span>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">{m.label}</p>
              <p className="mt-1 text-3xl font-bold tracking-tight">
                {isLoading ? '—' : dashboard?.[m.key] ?? 0}
              </p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          <div className="dashboard-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold">Task status distribution</h2>
              <span className="text-xs text-muted-foreground">{totalTasks} tasks total</span>
            </div>
            <TaskDistributionChart data={distribution ?? []} />
          </div>

          <div className="dashboard-card p-6">
            <h2 className="text-base font-semibold mb-6">Team utilization</h2>
            <UtilizationChart
              data={utilization ?? []}
              onAssignTask={() => navigate('/tasks')}
            />
          </div>
        </div>

        <div className="dashboard-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold">Recent activity</h2>
            <span className="text-xs text-muted-foreground">Last 24 hours</span>
          </div>
          <ActivityFeed activities={dashboard?.currentActivity ?? []} />
        </div>
      </div>
    </PageShell>
  );
}
