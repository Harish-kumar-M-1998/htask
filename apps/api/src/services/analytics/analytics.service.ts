import { prisma } from '../../config/database.js';
import { getRedis } from '../../config/redis.js';
import { NotFoundError } from '../../utils/errors.js';

type EtaBucket = 'before_eta' | 'on_eta' | 'over_eta' | 'no_eta_data';
type ProjectEtaAccumulator = {
  beforeEta: number;
  onEta: number;
  overEta: number;
  noEtaData: number;
  varianceSum: number;
  varianceCount: number;
};

interface MemberPerformance {
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
  etaDistribution: Array<{ bucket: EtaBucket; count: number }>;
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
    etaBucket: EtaBucket;
  }>;
}

class AnalyticsService {
  async getDashboard(organizationId: string, scope: 'manager' | 'team' | 'personal', userId?: string) {
    const cacheKey = `dashboard:${organizationId}:${scope}:${userId ?? 'all'}`;
    const redis = getRedis();
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const projectFilter = { organizationId, deletedAt: null };
    const taskFilter = {
      project: projectFilter,
      deletedAt: null,
      ...(scope === 'personal' && userId
        ? { assignees: { some: { userId } } }
        : {}),
    };

    const [
      tasksInProgress,
      qaQueue,
      overdueTasks,
      upcomingReleases,
      recentActivity,
    ] = await Promise.all([
      prisma.task.count({
        where: { ...taskFilter, status: 'IN_PROGRESS' },
      }),
      prisma.task.count({
        where: { ...taskFilter, status: { in: ['MOVED_TO_QA', 'QA_TESTING'] } },
      }),
      prisma.task.count({
        where: {
          ...taskFilter,
          dueDate: { lt: new Date() },
          status: { notIn: ['CLOSED', 'ARCHIVED', 'DEPLOYED'] },
        },
      }),
      prisma.release.findMany({
        where: {
          project: projectFilter,
          status: { in: ['PLANNED', 'IN_PROGRESS'] },
          plannedDate: { gte: new Date() },
        },
        orderBy: { plannedDate: 'asc' },
        take: 5,
        include: { _count: { select: { items: true } } },
      }),
      prisma.entityHistory.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { actor: { select: { firstName: true, lastName: true } } },
      }),
    ]);

    const activeUsers = await prisma.user.count({
      where: {
        organizationId,
        status: 'ACTIVE',
        lastLoginAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
      },
    });

    const result = {
      activeUsers,
      tasksInProgress,
      qaQueue,
      overdueTasks,
      upcomingReleases: upcomingReleases.map((r) => ({
        id: r.id,
        version: r.version,
        plannedDate: r.plannedDate?.toISOString(),
        progress: 0,
      })),
      currentActivity: recentActivity.map((a) => ({
        id: a.id,
        user: `${a.actor.firstName} ${a.actor.lastName}`,
        action: a.action,
        entity: a.description,
        timestamp: a.createdAt.toISOString(),
      })),
    };

    await redis.setex(cacheKey, 30, JSON.stringify(result));
    return result;
  }

  async getTaskDistribution(organizationId: string, projectId?: string) {
    const tasks = await prisma.task.groupBy({
      by: ['status'],
      where: {
        deletedAt: null,
        project: { organizationId, ...(projectId && { id: projectId }) },
      },
      _count: true,
    });

    return tasks.map((t) => ({
      status: t.status,
      count: t._count,
    }));
  }

  async getTeamUtilization(organizationId: string, from: Date, to: Date) {
    const worklogs = await prisma.worklog.groupBy({
      by: ['userId'],
      where: {
        startedAt: { gte: from, lte: to },
        user: { organizationId },
      },
      _sum: { productiveMinutes: true },
    });

    const users = await prisma.user.findMany({
      where: { organizationId, id: { in: worklogs.map((w) => w.userId) } },
      select: { id: true, firstName: true, lastName: true },
    });

    const userMap = new Map(users.map((u) => [u.id, u]));

    return worklogs.map((w) => ({
      user: userMap.get(w.userId),
      hours: Math.round(((w._sum.productiveMinutes ?? 0) / 60) * 100) / 100,
    }));
  }

  async getMemberPerformance(
    organizationId: string,
    memberId: string,
    from?: Date,
    to?: Date,
  ): Promise<MemberPerformance> {
    const member = await prisma.user.findFirst({
      where: { id: memberId, organizationId, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
        createdAt: true,
        userRoles: { include: { role: { select: { code: true, name: true } } } },
      },
    });

    if (!member) throw new NotFoundError('User');

    const activeStatuses = new Set([
      'DRAFT',
      'OPEN',
      'ASSIGNED',
      'IN_PROGRESS',
      'BLOCKED',
      'DEVELOPMENT_COMPLETE',
      'MR_RAISED',
      'MR_APPROVED',
      'MOVED_TO_STAGE',
      'STAGE_VERIFIED',
      'MOVED_TO_QA',
      'QA_TESTING',
      'QA_FAILED',
      'QA_PASSED',
      'READY_FOR_PRODUCTION',
    ]);
    const completedStatuses = new Set(['CLOSED', 'DEPLOYED', 'ARCHIVED']);

    const dateFilter =
      from || to
        ? {
            createdAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {};

    const assignedTasks = await prisma.task.findMany({
      where: {
        deletedAt: null,
        ...dateFilter,
        assignees: { some: { userId: memberId } },
        project: { organizationId, deletedAt: null },
      },
      select: {
        id: true,
        key: true,
        title: true,
        status: true,
        estimatedHours: true,
        updatedAt: true,
        projectId: true,
        project: { select: { id: true, key: true, name: true } },
        worklogs: {
          where: { userId: memberId },
          select: { productiveMinutes: true },
        },
      },
    });

    const memberWorklogs = await prisma.worklog.findMany({
      where: {
        userId: memberId,
        task: { project: { organizationId }, deletedAt: null },
        ...(from || to
          ? {
              startedAt: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      select: { productiveMinutes: true, task: { select: { projectId: true } } },
    });

    const totalProductiveHours = round2(
      memberWorklogs.reduce((sum, w) => sum + (w.productiveMinutes ?? 0), 0) / 60,
    );

    const activeByStatusMap = new Map<string, number>();
    const currentProjectsMap = new Map<string, { id: string; key: string; name: string; activeTasks: number }>();
    const workedProjects = new Set<string>();
    const projectStats = new Map<
      string,
      {
        projectId: string;
        projectKey: string;
        projectName: string;
        assignedTasks: number;
        completedTasks: number;
        beforeEta: number;
        onEta: number;
        overEta: number;
        noEtaData: number;
        varianceSum: number;
        varianceCount: number;
      }
    >();

    let completedTasks = 0;
    let completedBeforeEta = 0;
    let completedOnEta = 0;
    let completedOverEta = 0;
    let completedNoEtaData = 0;
    const recentCompletions: MemberPerformance['recentCompletions'] = [];

    for (const task of assignedTasks) {
      workedProjects.add(task.projectId);
      const actualHoursRaw = task.worklogs.reduce((sum, w) => sum + (w.productiveMinutes ?? 0), 0) / 60;
      const actualHours = actualHoursRaw > 0 ? round2(actualHoursRaw) : null;
      const bucket = classifyEta(task.estimatedHours, actualHours);

      if (!projectStats.has(task.projectId)) {
        projectStats.set(task.projectId, {
          projectId: task.project.id,
          projectKey: task.project.key,
          projectName: task.project.name,
          assignedTasks: 0,
          completedTasks: 0,
          beforeEta: 0,
          onEta: 0,
          overEta: 0,
          noEtaData: 0,
          varianceSum: 0,
          varianceCount: 0,
        });
      }
      const stat = projectStats.get(task.projectId)!;
      stat.assignedTasks += 1;

      if (activeStatuses.has(task.status)) {
        activeByStatusMap.set(task.status, (activeByStatusMap.get(task.status) ?? 0) + 1);
        currentProjectsMap.set(task.projectId, {
          id: task.project.id,
          key: task.project.key,
          name: task.project.name,
          activeTasks: (currentProjectsMap.get(task.projectId)?.activeTasks ?? 0) + 1,
        });
      }

      if (completedStatuses.has(task.status)) {
        completedTasks += 1;
        stat.completedTasks += 1;

        if (bucket === 'before_eta') completedBeforeEta += 1;
        else if (bucket === 'on_eta') completedOnEta += 1;
        else if (bucket === 'over_eta') completedOverEta += 1;
        else completedNoEtaData += 1;

        const variance =
          task.estimatedHours != null && actualHours != null
            ? round2(actualHours - task.estimatedHours)
            : null;
        applyEtaAggregation(stat, bucket, variance);

        recentCompletions.push({
          taskId: task.id,
          taskKey: task.key,
          taskTitle: task.title,
          projectId: task.project.id,
          projectKey: task.project.key,
          projectName: task.project.name,
          completedAt: task.updatedAt.toISOString(),
          estimatedHours: task.estimatedHours,
          actualHours,
          varianceHours:
            task.estimatedHours != null && actualHours != null
              ? round2(actualHours - task.estimatedHours)
              : null,
          etaBucket: bucket,
        });
      }
    }

    for (const worklog of memberWorklogs) {
      workedProjects.add(worklog.task.projectId);
    }

    const totalAssignedTasks = assignedTasks.length;
    const completionRate = totalAssignedTasks > 0 ? round2((completedTasks / totalAssignedTasks) * 100) : 0;

    const projectBreakdown = [...projectStats.values()]
      .map((p) => ({
        ...p,
        avgVarianceHours: p.varianceCount > 0 ? round2(p.varianceSum / p.varianceCount) : null,
      }))
      .sort((a, b) => b.completedTasks - a.completedTasks || b.assignedTasks - a.assignedTasks);

    const activeByStatus = [...activeByStatusMap.entries()]
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);

    const currentProjects = [...currentProjectsMap.values()].sort((a, b) => b.activeTasks - a.activeTasks);

    const etaDistribution: MemberPerformance['etaDistribution'] = [
      { bucket: 'before_eta', count: completedBeforeEta },
      { bucket: 'on_eta', count: completedOnEta },
      { bucket: 'over_eta', count: completedOverEta },
      { bucket: 'no_eta_data', count: completedNoEtaData },
    ];

    recentCompletions.sort((a, b) => +new Date(b.completedAt) - +new Date(a.completedAt));

    return {
      member: {
        id: member.id,
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        status: member.status,
        createdAt: member.createdAt.toISOString(),
        roles: member.userRoles.map((ur) => ur.role),
      },
      range: {
        from: from?.toISOString() ?? null,
        to: to?.toISOString() ?? null,
        allTime: !from && !to,
      },
      kpis: {
        totalAssignedTasks,
        completedTasks,
        completionRate,
        completedBeforeEta,
        completedOnEta,
        completedOverEta,
        completedNoEtaData,
        totalProductiveHours,
      },
      currentWorkload: {
        activeTasks: activeByStatus.reduce((sum, s) => sum + s.count, 0),
        activeByStatus,
        currentProjects,
        workedProjectsCount: workedProjects.size,
      },
      projectBreakdown,
      etaDistribution,
      recentCompletions: recentCompletions.slice(0, 20),
    };
  }
}

export const analyticsService = new AnalyticsService();

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function classifyEta(estimatedHours: number | null, actualHours: number | null): EtaBucket {
  if (estimatedHours == null || actualHours == null) return 'no_eta_data';
  const epsilon = 0.01;
  if (actualHours < estimatedHours - epsilon) return 'before_eta';
  if (Math.abs(actualHours - estimatedHours) <= epsilon) return 'on_eta';
  return 'over_eta';
}

export function applyEtaAggregation(
  accumulator: ProjectEtaAccumulator,
  bucket: EtaBucket,
  varianceHours: number | null,
) {
  if (bucket === 'before_eta') accumulator.beforeEta += 1;
  else if (bucket === 'on_eta') accumulator.onEta += 1;
  else if (bucket === 'over_eta') accumulator.overEta += 1;
  else accumulator.noEtaData += 1;

  if (varianceHours != null) {
    accumulator.varianceSum += varianceHours;
    accumulator.varianceCount += 1;
  }
}
