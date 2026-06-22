import { prisma } from '../../config/database.js';

export const NOTIFICATION_EVENT_DEFS = [
  {
    event: 'task_assigned',
    label: 'Task assigned to me',
    description: 'When you are added as an assignee',
  },
  {
    event: 'task_transitioned',
    label: 'Task status updates',
    description: 'When a task you work on changes status',
  },
  {
    event: 'comment_added',
    label: 'New comments',
    description: 'When someone comments on your tasks',
  },
  {
    event: 'task_created',
    label: 'New tasks',
    description: 'When tasks are created in your projects',
  },
] as const;

class NotificationPreferenceService {
  async getForUser(userId: string) {
    const stored = await prisma.notificationPreference.findMany({
      where: { userId },
    });

    return NOTIFICATION_EVENT_DEFS.map((def) => {
      const pref = stored.find((s) => s.event === def.event);
      return {
        event: def.event,
        label: def.label,
        description: def.description,
        inApp: pref?.inApp ?? true,
        email: pref?.email ?? true,
      };
    });
  }

  async updateForUser(
    userId: string,
    preferences: Array<{ event: string; inApp: boolean; email?: boolean }>,
  ) {
    const validEvents = new Set(NOTIFICATION_EVENT_DEFS.map((d) => d.event));

    for (const pref of preferences) {
      if (!validEvents.has(pref.event as (typeof NOTIFICATION_EVENT_DEFS)[number]['event'])) {
        continue;
      }

      await prisma.notificationPreference.upsert({
        where: { userId_event: { userId, event: pref.event } },
        update: {
          inApp: pref.inApp,
          ...(pref.email !== undefined && { email: pref.email }),
        },
        create: {
          userId,
          event: pref.event,
          inApp: pref.inApp,
          email: pref.email ?? true,
        },
      });
    }

    return this.getForUser(userId);
  }

  async isInAppEnabled(userId: string, event: string): Promise<boolean> {
    const pref = await prisma.notificationPreference.findUnique({
      where: { userId_event: { userId, event } },
    });
    return pref?.inApp ?? true;
  }
}

export const notificationPreferenceService = new NotificationPreferenceService();
