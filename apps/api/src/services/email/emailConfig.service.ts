import { emailAutomationConfigSchema, type EmailAutomationConfig } from '@htask/shared';
import { prisma } from '../../config/database.js';

export const DEFAULT_EMAIL_CONFIG: EmailAutomationConfig = {
  mode: 'automated',
  taskCreated: true,
  taskCompleted: true,
  taskUpdated: true,
  taskDeleted: true,
  etaNearing: true,
  etaOver: true,
  dueNearing: true,
  dueOverdue: true,
  dailyTeamReminder: true,
  dailyManagerDigest: true,
  etaNearingPercent: 80,
  dueNearingDays: 2,
  dailyReminderHour: 9,
};

class EmailConfigService {
  async get(organizationId: string): Promise<EmailAutomationConfig> {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { settings: true },
    });

    const settings = (org?.settings ?? {}) as Record<string, unknown>;
    const stored = settings.emailAutomation;

    return emailAutomationConfigSchema.parse({
      ...DEFAULT_EMAIL_CONFIG,
      ...(typeof stored === 'object' && stored !== null ? stored : {}),
    });
  }

  async update(organizationId: string, input: Partial<EmailAutomationConfig>): Promise<EmailAutomationConfig> {
    const current = await this.get(organizationId);
    const next = emailAutomationConfigSchema.parse({ ...current, ...input });

    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { settings: true },
    });

    const settings = (org?.settings ?? {}) as Record<string, unknown>;

    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        settings: {
          ...settings,
          emailAutomation: next,
        },
      },
    });

    return next;
  }

  isAutomated(config: EmailAutomationConfig): boolean {
    return config.mode === 'automated';
  }
}

export const emailConfigService = new EmailConfigService();
