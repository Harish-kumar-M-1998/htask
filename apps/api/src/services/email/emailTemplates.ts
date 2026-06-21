import { config } from '../../config/index.js';
import { formatTaskStatus } from '@htask/shared';
import { escapeHtml } from '../../utils/helpers.js';

interface TaskEmailContext {
  key: string;
  title: string;
  id: string;
  status?: string;
  priority?: string;
  dueDate?: string | Date | null;
  estimatedHours?: number | null;
}

interface UserEmailContext {
  firstName: string;
  lastName?: string;
}

function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${title}</title></head>
<body style="font-family:Inter,Arial,sans-serif;line-height:1.6;color:#111;max-width:560px;margin:0 auto;padding:24px">
  <div style="border-bottom:2px solid #111;padding-bottom:12px;margin-bottom:20px">
    <strong style="font-size:18px">Htask</strong>
  </div>
  ${body}
  <p style="margin-top:32px;font-size:12px;color:#666">Sent from Htask · ${config.SMTP_FROM}</p>
</body></html>`;
}

function taskLink(taskId: string): string {
  return `${config.APP_URL}/tasks/${taskId}`;
}

function taskBlock(task: TaskEmailContext): string {
  const due = task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '—';
  const eta = task.estimatedHours != null ? `${task.estimatedHours}h` : '—';
  const status = task.status ? formatTaskStatus(task.status) : '';
  return `<div style="background:#f4f4f5;border-radius:8px;padding:16px;margin:16px 0">
    <p style="margin:0 0 4px;font-family:monospace;color:#555">${escapeHtml(task.key)}</p>
    <p style="margin:0 0 4px;font-size:16px;font-weight:600">${escapeHtml(task.title)}</p>
    ${status ? `<p style="margin:0 0 4px;font-size:13px">Status: ${escapeHtml(status)}</p>` : ''}
    ${task.priority ? `<p style="margin:0 0 4px;font-size:13px">Priority: ${escapeHtml(task.priority)}</p>` : ''}
    <p style="margin:0 0 4px;font-size:13px">Due: ${due} · ETA: ${eta}</p>
    <a href="${taskLink(task.id)}" style="color:#2563eb;font-size:13px">View task →</a>
  </div>`;
}

export function renderTaskCreatedEmail(task: TaskEmailContext, actorName: string) {
  return {
    subject: `[Htask] New task ${task.key} created`,
    html: layout(
      'Task created',
      `<p>A new task was created by <strong>${escapeHtml(actorName)}</strong>.</p>${taskBlock(task)}`,
    ),
  };
}

export function renderTaskCompletedEmail(task: TaskEmailContext, actorName: string) {
  return {
    subject: `[Htask] Task ${task.key} completed`,
    html: layout(
      'Task completed',
      `<p>Task marked complete by <strong>${escapeHtml(actorName)}</strong>.</p>${taskBlock(task)}`,
    ),
  };
}

export function renderTaskUpdatedEmail(task: TaskEmailContext, actorName: string) {
  return {
    subject: `[Htask] Task ${task.key} updated`,
    html: layout(
      'Task updated',
      `<p>Task was updated by <strong>${escapeHtml(actorName)}</strong>.</p>${taskBlock(task)}`,
    ),
  };
}

export function renderTaskDeletedEmail(task: TaskEmailContext, actorName: string) {
  return {
    subject: `[Htask] Task ${task.key} deleted`,
    html: layout(
      'Task deleted',
      `<p>Task was deleted by <strong>${escapeHtml(actorName)}</strong>.</p>
       <p><strong>${escapeHtml(task.key)}</strong> — ${escapeHtml(task.title)}</p>`,
    ),
  };
}

export function renderEtaAlertEmail(
  task: TaskEmailContext,
  kind: 'nearing' | 'over',
  elapsedHours: number,
) {
  const label = kind === 'over' ? 'over ETA' : 'nearing ETA';
  return {
    subject: `[Htask] Task ${task.key} ${label}`,
    html: layout(
      `Task ${label}`,
      `<p>Development time is ${kind === 'over' ? 'past' : 'approaching'} the estimated hours.</p>
       <p>Elapsed: <strong>${elapsedHours.toFixed(1)}h</strong> · ETA: <strong>${task.estimatedHours ?? '—'}h</strong></p>
       ${taskBlock(task)}`,
    ),
  };
}

export function renderDueDateAlertEmail(
  task: TaskEmailContext,
  kind: 'nearing' | 'overdue',
) {
  const label = kind === 'overdue' ? 'past due date' : 'due date approaching';
  return {
    subject: `[Htask] Task ${task.key} ${label}`,
    html: layout(
      `Task ${label}`,
      `<p>This task is ${label}.</p>${taskBlock(task)}`,
    ),
  };
}

export function renderDailyTeamReminderEmail(user: UserEmailContext, tasks: TaskEmailContext[]) {
  const items = tasks
    .map(
      (t) =>
        `<li style="margin-bottom:8px"><a href="${taskLink(t.id)}" style="color:#2563eb">${escapeHtml(t.key)}</a> — ${escapeHtml(t.title)}</li>`,
    )
    .join('');

  return {
    subject: `[Htask] Your daily task reminder (${tasks.length})`,
    html: layout(
      'Daily reminder',
      `<p>Hi ${escapeHtml(user.firstName)},</p>
       <p>You have <strong>${tasks.length}</strong> active task(s) today:</p>
       <ul style="padding-left:20px">${items}</ul>`,
    ),
  };
}

export function renderDailyManagerDigestEmail(
  summary: {
    totalActive: number;
    overdue: number;
    etaOver: number;
    dueSoon: number;
    completedToday: number;
  },
  tasks: TaskEmailContext[],
) {
  const items = tasks
    .slice(0, 15)
    .map(
      (t) =>
        `<li style="margin-bottom:6px"><a href="${taskLink(t.id)}" style="color:#2563eb">${escapeHtml(t.key)}</a> — ${escapeHtml(t.title)}</li>`,
    )
    .join('');

  return {
    subject: `[Htask] Daily team digest`,
    html: layout(
      'Daily digest',
      `<p>Team summary for today:</p>
       <ul>
         <li>Active tasks: <strong>${summary.totalActive}</strong></li>
         <li>Overdue: <strong>${summary.overdue}</strong></li>
         <li>Over ETA: <strong>${summary.etaOver}</strong></li>
         <li>Due soon: <strong>${summary.dueSoon}</strong></li>
         <li>Completed today: <strong>${summary.completedToday}</strong></li>
       </ul>
       ${tasks.length ? `<p>Attention needed:</p><ul style="padding-left:20px">${items}</ul>` : ''}`,
    ),
  };
}

export function renderTestEmail() {
  return {
    subject: '[Htask] Test email',
    html: layout('Test email', '<p>Your Htask email configuration is working.</p>'),
  };
}

export function renderWelcomeEmail(
  user: UserEmailContext,
  password: string,
  loginUrl: string,
) {
  const name = user.firstName || 'there';
  return {
    subject: '[Htask] Welcome — your account is ready',
    html: layout(
      'Welcome to Htask',
      `<p>Hi <strong>${escapeHtml(name)}</strong>,</p>
       <p>Your Htask team member account has been created. Use the credentials below to sign in:</p>
       <div style="background:#f4f4f5;border-radius:8px;padding:16px;margin:16px 0;font-size:14px">
         <p style="margin:0 0 8px"><strong>Email:</strong> use the address you registered with</p>
         <p style="margin:0"><strong>Temporary password:</strong> <code style="background:#e4e4e7;padding:2px 8px;border-radius:4px;font-size:15px">${escapeHtml(password)}</code></p>
       </div>
       <p>We recommend changing your password after your first login.</p>
       <p><a href="${loginUrl}" style="display:inline-block;background:#ff9a3d;color:#1a1206;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Sign in to Htask</a></p>`,
    ),
    text: `Hi ${name},\n\nYour Htask account is ready.\n\nTemporary password: ${password}\n\nSign in: ${loginUrl}`,
  };
}
