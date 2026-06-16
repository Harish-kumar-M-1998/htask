import { prisma } from '../../config/database.js';
import { ConflictError, NotFoundError } from '../../utils/errors.js';
import dayjs from 'dayjs';

class WorklogService {
  async start(taskId: string, userId: string, description?: string) {
    const active = await prisma.worklog.findFirst({
      where: { userId, status: { in: ['ACTIVE', 'PAUSED'] } },
    });
    if (active) {
      throw new ConflictError('You already have an active worklog session');
    }

    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundError('Task');

    return prisma.$transaction(async (tx) => {
      const worklog = await tx.worklog.create({
        data: {
          taskId,
          userId,
          description,
          startedAt: new Date(),
          status: 'ACTIVE',
        },
      });

      await tx.worklogSession.create({
        data: { worklogId: worklog.id, action: 'START' },
      });

      return worklog;
    });
  }

  async pause(worklogId: string, userId: string) {
    const worklog = await this.getActiveWorklog(worklogId, userId);
    const minutes = this.calculateMinutes(worklog.startedAt);

    return prisma.$transaction(async (tx) => {
      await tx.worklogSession.create({
        data: { worklogId, action: 'PAUSE' },
      });

      return tx.worklog.update({
        where: { id: worklogId },
        data: {
          status: 'PAUSED',
          totalMinutes: worklog.totalMinutes + minutes,
          productiveMinutes: worklog.productiveMinutes + minutes,
        },
      });
    });
  }

  async resume(worklogId: string, userId: string) {
    await this.getActiveWorklog(worklogId, userId, 'PAUSED');

    return prisma.$transaction(async (tx) => {
      await tx.worklogSession.create({
        data: { worklogId, action: 'RESUME' },
      });

      return tx.worklog.update({
        where: { id: worklogId },
        data: { status: 'ACTIVE', startedAt: new Date() },
      });
    });
  }

  async stop(worklogId: string, userId: string) {
    const worklog = await prisma.worklog.findFirst({
      where: { id: worklogId, userId, status: { in: ['ACTIVE', 'PAUSED'] } },
    });
    if (!worklog) throw new NotFoundError('Active worklog');

    const additionalMinutes =
      worklog.status === 'ACTIVE' ? this.calculateMinutes(worklog.startedAt) : 0;

    return prisma.$transaction(async (tx) => {
      await tx.worklogSession.create({
        data: { worklogId, action: 'STOP' },
      });

      return tx.worklog.update({
        where: { id: worklogId },
        data: {
          status: 'COMPLETED',
          endedAt: new Date(),
          totalMinutes: worklog.totalMinutes + additionalMinutes,
          productiveMinutes: worklog.productiveMinutes + additionalMinutes,
        },
      });
    });
  }

  async getSummary(userId: string, from?: Date, to?: Date) {
    const startDate = from ?? dayjs().startOf('week').toDate();
    const endDate = to ?? dayjs().endOf('week').toDate();

    const worklogs = await prisma.worklog.findMany({
      where: {
        userId,
        startedAt: { gte: startDate, lte: endDate },
      },
      include: { task: { select: { id: true, key: true, title: true } } },
    });

    const totalMinutes = worklogs.reduce((sum, w) => sum + w.totalMinutes, 0);
    const productiveMinutes = worklogs.reduce((sum, w) => sum + w.productiveMinutes, 0);
    const workingDays = dayjs(endDate).diff(dayjs(startDate), 'day') + 1;
    const expectedMinutes = workingDays * 8 * 60;

    return {
      totalHours: Math.round((totalMinutes / 60) * 100) / 100,
      productiveHours: Math.round((productiveMinutes / 60) * 100) / 100,
      utilizationRate: expectedMinutes > 0 ? Math.round((productiveMinutes / expectedMinutes) * 100) : 0,
      sessionCount: worklogs.length,
      worklogs,
    };
  }

  private async getActiveWorklog(worklogId: string, userId: string, status = 'ACTIVE') {
    const worklog = await prisma.worklog.findFirst({
      where: { id: worklogId, userId, status: status as 'ACTIVE' | 'PAUSED' },
    });
    if (!worklog) throw new NotFoundError('Worklog');
    return worklog;
  }

  private calculateMinutes(since: Date): number {
    return Math.round(dayjs().diff(dayjs(since), 'minute', true));
  }
}

export const worklogService = new WorklogService();
