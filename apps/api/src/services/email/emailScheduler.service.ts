import { prisma } from '../../config/database.js';
import { config } from '../../config/index.js';
import { logger } from '../../config/logger.js';
import { emailConfigService } from './emailConfig.service.js';
import { emailNotificationService } from './emailNotification.service.js';

const dailyRuns = new Set<string>();
let intervalHandle: ReturnType<typeof setInterval> | null = null;

export function startEmailScheduler() {
  if (!config.EMAIL_SCHEDULER_ENABLED) {
    logger.info('Email scheduler disabled');
    return;
  }

  if (intervalHandle) return;

  logger.info('Email scheduler started');

  intervalHandle = setInterval(() => {
    runSchedulerTick().catch((err) => {
      logger.error('Email scheduler tick failed', { error: err });
    });
  }, 15 * 60 * 1000);

  runSchedulerTick().catch((err) => {
    logger.error('Email scheduler initial tick failed', { error: err });
  });
}

export function stopEmailScheduler() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

async function runSchedulerTick() {
  const organizations = await prisma.organization.findMany({
    where: { deletedAt: null },
    select: { id: true },
  });

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const currentHour = now.getHours();

  for (const org of organizations) {
    const emailConfig = await emailConfigService.get(org.id);

    await emailNotificationService.runScheduledChecks(org.id);

    const runKey = `${org.id}:${today}`;
    if (currentHour === emailConfig.dailyReminderHour && !dailyRuns.has(runKey)) {
      await emailNotificationService.sendDailyReminders(org.id);
      dailyRuns.add(runKey);
    }
  }

  if (dailyRuns.size > 200) {
    dailyRuns.clear();
  }
}

export async function triggerManualDailyReminders(organizationId: string) {
  await emailNotificationService.sendDailyReminders(organizationId, true);
}

export async function triggerManualScheduledChecks(organizationId: string) {
  await emailNotificationService.runScheduledChecks(organizationId, true);
}
