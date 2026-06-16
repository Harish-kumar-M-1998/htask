import { prisma } from '../../config/database.js';
import { getRedis } from '../../config/redis.js';

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
}

export const analyticsService = new AnalyticsService();
