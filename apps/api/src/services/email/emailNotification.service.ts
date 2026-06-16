import { TASK_STATUSES, type EmailAutomationConfig } from '@htask/shared';
import { prisma } from '../../config/database.js';
import { eventBus } from '../../events/eventBus.js';
import { logger } from '../../config/logger.js';
import { emailService } from './email.service.js';
import { emailConfigService } from './emailConfig.service.js';
import {
  renderDailyManagerDigestEmail,
  renderDailyTeamReminderEmail,
  renderDueDateAlertEmail,
  renderEtaAlertEmail,
  renderTaskCompletedEmail,
  renderTaskCreatedEmail,
  renderTaskDeletedEmail,
  renderTaskUpdatedEmail,
} from './emailTemplates.js';
import {
  getTaskAssignees,
  getUserById,
  getUsersByRoles,
  toEmails,
  uniqueRecipients,
  type EmailRecipient,
} from './recipients.service.js';

type TaskPayload = {
  id: string;
  key: string;
  title: string;
  status: string;
  priority?: string;
  dueDate?: Date | string | null;
  estimatedHours?: number | null;
  createdById: string;
  project?: { organizationId: string };
  projectId?: string;
};

const DEV_COMPLETE_INDEX = TASK_STATUSES.indexOf('DEVELOPMENT_COMPLETE');

type EmailEventFlag =
  | 'taskCreated'
  | 'taskCompleted'
  | 'taskUpdated'
  | 'taskDeleted'
  | 'etaNearing'
  | 'etaOver'
  | 'dueNearing'
  | 'dueOverdue'
  | 'dailyTeamReminder'
  | 'dailyManagerDigest';

class EmailNotificationService {
  constructor() {
    this.registerHandlers();
  }

  private registerHandlers() {
    eventBus.onEvent('task:created', (e) => this.onTaskCreated(e.payload));
    eventBus.onEvent('task:updated', (e) => this.onTaskUpdated(e.payload));
    eventBus.onEvent('task:deleted', (e) => this.onTaskDeleted(e.payload));
    eventBus.onEvent('task:transitioned', (e) => this.onTaskTransitioned(e.payload));
  }

  private async getOrgId(task: TaskPayload): Promise<string | null> {
    if (task.project?.organizationId) return task.project.organizationId;
    if (!task.projectId) return null;
    const project = await prisma.project.findUnique({
      where: { id: task.projectId },
      select: { organizationId: true },
    });
    return project?.organizationId ?? null;
  }

  private async shouldSend(
    organizationId: string,
    flag: EmailEventFlag,
  ): Promise<EmailAutomationConfig | null> {
    const cfg = await emailConfigService.get(organizationId);
    if (!emailConfigService.isAutomated(cfg)) return null;
    if (!cfg[flag]) return null;
    return cfg;
  }

  private async sendToUsers(users: EmailRecipient[], subject: string, html: string) {
    const emails = toEmails(uniqueRecipients(users));
    if (!emails.length) return;
    const result = await emailService.send({ to: emails, subject, html });
    if (!result.success) {
      logger.warn('Notification email not sent', { subject, error: result.error });
    }
  }

  private taskContext(task: TaskPayload) {
    return {
      id: task.id,
      key: task.key,
      title: task.title,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      estimatedHours: task.estimatedHours,
    };
  }

  private async onTaskCreated(payload: Record<string, unknown>) {
    const task = payload.task as TaskPayload;
    const actorId = payload.actorId as string;
    const organizationId = await this.getOrgId(task);
    if (!organizationId) return;
    if (!(await this.shouldSend(organizationId, 'taskCreated'))) return;

    const [creator, managers, leads, assignees, actor] = await Promise.all([
      getUserById(task.createdById),
      getUsersByRoles(organizationId, ['MANAGER']),
      getUsersByRoles(organizationId, ['TEAM_LEAD']),
      getTaskAssignees(task.id),
      getUserById(actorId),
    ]);

    const actorName = actor ? `${actor.firstName} ${actor.lastName}` : 'Someone';
    const email = renderTaskCreatedEmail(this.taskContext(task), actorName);
    await this.sendToUsers(
      uniqueRecipients([...(creator ? [creator] : []), ...managers, ...leads, ...assignees]),
      email.subject,
      email.html,
    );
  }

  private async onTaskUpdated(payload: Record<string, unknown>) {
    const task = payload.task as TaskPayload;
    const actorId = payload.actorId as string;
    const organizationId = await this.getOrgId(task);
    if (!organizationId) return;
    if (!(await this.shouldSend(organizationId, 'taskUpdated'))) return;

    const [creator, managers, leads, assignees, actor] = await Promise.all([
      getUserById(task.createdById),
      getUsersByRoles(organizationId, ['MANAGER']),
      getUsersByRoles(organizationId, ['TEAM_LEAD']),
      getTaskAssignees(task.id),
      getUserById(actorId),
    ]);

    const actorName = actor ? `${actor.firstName} ${actor.lastName}` : 'Someone';
    const email = renderTaskUpdatedEmail(this.taskContext(task), actorName);
    await this.sendToUsers(
      uniqueRecipients([...(creator ? [creator] : []), ...managers, ...leads, ...assignees]),
      email.subject,
      email.html,
    );
  }

  private async onTaskDeleted(payload: Record<string, unknown>) {
    const task = payload.task as TaskPayload;
    const actorId = payload.actorId as string;
    const organizationId = await this.getOrgId(task);
    if (!organizationId) return;
    if (!(await this.shouldSend(organizationId, 'taskDeleted'))) return;

    const [creator, managers, leads, assignees, actor] = await Promise.all([
      getUserById(task.createdById),
      getUsersByRoles(organizationId, ['MANAGER']),
      getUsersByRoles(organizationId, ['TEAM_LEAD']),
      getTaskAssignees(task.id),
      getUserById(actorId),
    ]);

    const actorName = actor ? `${actor.firstName} ${actor.lastName}` : 'Someone';
    const email = renderTaskDeletedEmail(this.taskContext(task), actorName);
    await this.sendToUsers(
      uniqueRecipients([...(creator ? [creator] : []), ...managers, ...leads, ...assignees]),
      email.subject,
      email.html,
    );
  }

  private async onTaskTransitioned(payload: Record<string, unknown>) {
    const task = payload.task as TaskPayload;
    const toStatus = payload.toStatus as string;
    const actorId = payload.actorId as string;

    if (toStatus !== 'DEVELOPMENT_COMPLETE' && toStatus !== 'CLOSED') return;

    const organizationId = await this.getOrgId(task);
    if (!organizationId) return;
    if (!(await this.shouldSend(organizationId, 'taskCompleted'))) return;

    const [managers, leads, actor] = await Promise.all([
      getUsersByRoles(organizationId, ['MANAGER']),
      getUsersByRoles(organizationId, ['TEAM_LEAD']),
      getUserById(actorId),
    ]);

    const actorName = actor ? `${actor.firstName} ${actor.lastName}` : 'Someone';
    const email = renderTaskCompletedEmail({ ...this.taskContext(task), status: toStatus }, actorName);
    await this.sendToUsers([...managers, ...leads], email.subject, email.html);
  }

  async runScheduledChecks(organizationId: string, force = false) {
    const cfg = await emailConfigService.get(organizationId);
    if (!force && !emailConfigService.isAutomated(cfg)) return;

    await Promise.all([
      this.checkEtaAlerts(organizationId, cfg, force),
      this.checkDueDateAlerts(organizationId, cfg, force),
    ]);
  }

  async sendDailyReminders(organizationId: string, force = false) {
    const cfg = await emailConfigService.get(organizationId);
    if (!force && !emailConfigService.isAutomated(cfg)) return;

    if (cfg.dailyTeamReminder || force) {
      await this.sendTeamDailyReminders(organizationId);
    }
    if (cfg.dailyManagerDigest || force) {
      await this.sendManagerDailyDigest(organizationId);
    }
  }

  private async sendTeamDailyReminders(organizationId: string) {
    const members = await getUsersByRoles(organizationId, ['TEAM_MEMBER', 'TEAM_LEAD']);

    for (const member of members) {
      const tasks = await prisma.task.findMany({
        where: {
          deletedAt: null,
          status: { notIn: ['CLOSED', 'ARCHIVED', 'DRAFT'] },
          assignees: { some: { userId: member.id } },
          project: { organizationId },
        },
        select: {
          id: true,
          key: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          estimatedHours: true,
        },
        take: 20,
        orderBy: { dueDate: 'asc' },
      });

      if (!tasks.length) continue;

      const email = renderDailyTeamReminderEmail(member, tasks);
      await emailService.send({ to: member.email, subject: email.subject, html: email.html });
    }
  }

  private async sendManagerDailyDigest(organizationId: string) {
    const recipients = await getUsersByRoles(organizationId, ['MANAGER', 'TEAM_LEAD']);
    if (!recipients.length) return;

    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const activeTasks = await prisma.task.findMany({
      where: {
        deletedAt: null,
        status: { notIn: ['CLOSED', 'ARCHIVED', 'DRAFT'] },
        project: { organizationId },
      },
      select: {
        id: true,
        key: true,
        title: true,
        status: true,
        dueDate: true,
        estimatedHours: true,
        histories: {
          where: { action: 'TRANSITION' },
          orderBy: { createdAt: 'asc' },
          select: { toStatus: true, createdAt: true },
        },
      },
    });

    let overdue = 0;
    let etaOver = 0;
    let dueSoon = 0;
    const attention: typeof activeTasks = [];

    for (const task of activeTasks) {
      const dueFlag = this.dueDateFlag(task.dueDate, 2);
      if (dueFlag === 'overdue') {
        overdue += 1;
        attention.push(task);
      } else if (dueFlag === 'nearing') {
        dueSoon += 1;
        attention.push(task);
      }

      const elapsed = this.computeElapsedHours(task.histories, task.status);
      if (
        task.estimatedHours &&
        elapsed != null &&
        statusIndex(task.status) < DEV_COMPLETE_INDEX &&
        elapsed > task.estimatedHours
      ) {
        etaOver += 1;
        attention.push(task);
      }
    }

    const completedToday = await prisma.taskHistory.count({
      where: {
        toStatus: { in: ['DEVELOPMENT_COMPLETE', 'CLOSED'] },
        createdAt: { gte: startOfDay },
        task: { project: { organizationId } },
      },
    });

    const email = renderDailyManagerDigestEmail(
      {
        totalActive: activeTasks.length,
        overdue,
        etaOver,
        dueSoon,
        completedToday,
      },
      attention.slice(0, 15).map((t) => ({
        id: t.id,
        key: t.key,
        title: t.title,
        status: t.status,
        dueDate: t.dueDate,
        estimatedHours: t.estimatedHours,
      })),
    );

    await emailService.send({ to: toEmails(recipients), subject: email.subject, html: email.html });
  }

  private async checkEtaAlerts(
    organizationId: string,
    cfg: EmailAutomationConfig,
    force: boolean,
  ) {
    const tasks = await prisma.task.findMany({
      where: {
        deletedAt: null,
        estimatedHours: { not: null },
        status: { notIn: ['DEVELOPMENT_COMPLETE', 'CLOSED', 'ARCHIVED', 'DRAFT'] },
        project: { organizationId },
      },
      include: {
        histories: {
          where: { action: 'TRANSITION' },
          orderBy: { createdAt: 'asc' },
          select: { toStatus: true, createdAt: true },
        },
      },
    });

    const recipients = await getUsersByRoles(organizationId, ['MANAGER', 'TEAM_LEAD']);
    if (!recipients.length) return;

    for (const task of tasks) {
      if (statusIndex(task.status) >= DEV_COMPLETE_INDEX) continue;

      const elapsed = this.computeElapsedHours(task.histories, task.status);
      if (elapsed == null || !task.estimatedHours) continue;

      const percent = (elapsed / task.estimatedHours) * 100;
      const ctx = this.taskContext(task);

      if (percent >= 100 && (force || cfg.etaOver)) {
        if (!force && (await this.wasAlertSent(task.id, 'eta_over'))) continue;
        const email = renderEtaAlertEmail(ctx, 'over', elapsed);
        await this.sendToUsers(recipients, email.subject, email.html);
        await this.markAlertSent(task.id, 'eta_over');
      } else if (
        percent >= cfg.etaNearingPercent &&
        percent < 100 &&
        (force || cfg.etaNearing)
      ) {
        if (!force && (await this.wasAlertSent(task.id, 'eta_nearing'))) continue;
        const email = renderEtaAlertEmail(ctx, 'nearing', elapsed);
        await this.sendToUsers(recipients, email.subject, email.html);
        await this.markAlertSent(task.id, 'eta_nearing');
      }
    }
  }

  private async checkDueDateAlerts(
    organizationId: string,
    cfg: EmailAutomationConfig,
    force: boolean,
  ) {
    const tasks = await prisma.task.findMany({
      where: {
        deletedAt: null,
        dueDate: { not: null },
        status: { notIn: ['CLOSED', 'ARCHIVED'] },
        project: { organizationId },
      },
    });

    const recipients = await getUsersByRoles(organizationId, ['MANAGER', 'TEAM_LEAD']);
    if (!recipients.length) return;

    for (const task of tasks) {
      const flag = this.dueDateFlag(task.dueDate, cfg.dueNearingDays);
      const ctx = this.taskContext(task);

      if (flag === 'overdue' && (force || cfg.dueOverdue)) {
        if (!force && (await this.wasAlertSent(task.id, 'due_overdue'))) continue;
        const email = renderDueDateAlertEmail(ctx, 'overdue');
        await this.sendToUsers(recipients, email.subject, email.html);
        await this.markAlertSent(task.id, 'due_overdue');
      } else if (flag === 'nearing' && (force || cfg.dueNearing)) {
        if (!force && (await this.wasAlertSent(task.id, 'due_nearing'))) continue;
        const email = renderDueDateAlertEmail(ctx, 'nearing');
        await this.sendToUsers(recipients, email.subject, email.html);
        await this.markAlertSent(task.id, 'due_nearing');
      }
    }
  }

  private dueDateFlag(dueDate: Date | null, nearingDays: number): 'nearing' | 'overdue' | null {
    if (!dueDate) return null;
    const now = new Date();
    const due = new Date(dueDate);
    due.setHours(23, 59, 59, 999);

    if (now > due) return 'overdue';

    const nearing = new Date();
    nearing.setDate(nearing.getDate() + nearingDays);
    if (due <= nearing) return 'nearing';

    return null;
  }

  private computeElapsedHours(
    histories: Array<{ toStatus: string | null; createdAt: Date }>,
    currentStatus: string,
  ): number | null {
    let inProgressAt: Date | null = null;

    for (const entry of histories) {
      if (entry.toStatus === 'IN_PROGRESS') {
        inProgressAt = entry.createdAt;
      }
      if (entry.toStatus === 'DEVELOPMENT_COMPLETE' && inProgressAt) {
        return (entry.createdAt.getTime() - inProgressAt.getTime()) / 3_600_000;
      }
    }

    if ((currentStatus === 'IN_PROGRESS' || currentStatus === 'BLOCKED') && inProgressAt) {
      return (Date.now() - inProgressAt.getTime()) / 3_600_000;
    }

    return null;
  }

  private async wasAlertSent(taskId: string, alertKey: string): Promise<boolean> {
    const task = await prisma.task.findUnique({ where: { id: taskId }, select: { metadata: true } });
    const meta = (task?.metadata ?? {}) as Record<string, unknown>;
    const alerts = (meta.emailAlerts ?? {}) as Record<string, string>;
    const today = new Date().toISOString().slice(0, 10);
    return alerts[alertKey] === today;
  }

  private async markAlertSent(taskId: string, alertKey: string) {
    const task = await prisma.task.findUnique({ where: { id: taskId }, select: { metadata: true } });
    const meta = (task?.metadata ?? {}) as Record<string, unknown>;
    const alerts = { ...((meta.emailAlerts ?? {}) as Record<string, string>) };
    alerts[alertKey] = new Date().toISOString().slice(0, 10);

    await prisma.task.update({
      where: { id: taskId },
      data: { metadata: { ...meta, emailAlerts: alerts } },
    });
  }
}

function statusIndex(status: string): number {
  const idx = TASK_STATUSES.indexOf(status as (typeof TASK_STATUSES)[number]);
  return idx >= 0 ? idx : 0;
}

export const emailNotificationService = new EmailNotificationService();
