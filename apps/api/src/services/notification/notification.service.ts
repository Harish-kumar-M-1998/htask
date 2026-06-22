import { prisma } from '../../config/database.js';
import { eventBus } from '../../events/eventBus.js';
import { logger } from '../../config/logger.js';
import { notificationPreferenceService } from './notificationPreference.service.js';

class NotificationService {
  constructor() {
    this.registerHandlers();
  }

  private registerHandlers() {
    eventBus.onEvent('task:created', (e) => this.handleTaskEvent('task_created', e));
    eventBus.onEvent('task:assigned', (e) => this.handleTaskEvent('task_assigned', e));
    eventBus.onEvent('task:transitioned', (e) => this.handleTaskEvent('task_transitioned', e));
    eventBus.onEvent('comment:added', (e) => this.handleTaskEvent('comment_added', e));
  }

  private async handleTaskEvent(eventType: string, event: { payload: Record<string, unknown> }) {
    try {
      const task = event.payload.task as { id: string; title: string; key: string };
      const actorId = event.payload.actorId as string;

      const assignees = await prisma.taskAssignee.findMany({
        where: { taskId: task.id },
        select: { userId: true },
      });

      const recipientIds = assignees
        .map((a) => a.userId)
        .filter((id) => id !== actorId);

      for (const userId of recipientIds) {
        const enabled = await notificationPreferenceService.isInAppEnabled(userId, eventType);
        if (!enabled) continue;

        await this.createInAppNotification(userId, eventType, {
          title: this.getTitle(eventType, task),
          body: task.title,
          link: `/tasks/${task.id}`,
        });
      }
    } catch (err) {
      logger.error('Notification handler error', { eventType, error: err });
    }
  }

  async createInAppNotification(
    userId: string,
    type: string,
    data: { title: string; body: string; link?: string },
  ) {
    return prisma.notification.create({
      data: {
        userId,
        type,
        title: data.title,
        body: data.body,
        link: data.link,
      },
    });
  }

  async getUserNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where: { userId } }),
      prisma.notification.count({ where: { userId, readAt: null } }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit), unreadCount },
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  private getTitle(eventType: string, task: { key: string }): string {
    const titles: Record<string, string> = {
      task_created: `New task ${task.key} created`,
      task_assigned: `Task ${task.key} assigned to you`,
      task_transitioned: `Task ${task.key} status updated`,
      comment_added: `New comment on ${task.key}`,
    };
    return titles[eventType] || `Update on ${task.key}`;
  }
}

export const notificationService = new NotificationService();
