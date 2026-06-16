import fs from 'fs';
import path from 'path';
import dayjs from 'dayjs';
import { stringify } from 'csv-stringify/sync';
import ExcelJS from 'exceljs';
import type { ReportFormat, ReportType } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { config } from '../../config/index.js';

interface GenerateReportInput {
  type: ReportType;
  format: ReportFormat;
  projectId?: string;
  dateRange: { from: string; to: string };
  sections: string[];
}

interface ReportData {
  generatedAt: string;
  type: ReportType;
  dateRange: { from: string; to: string };
  taskSummary: Array<Record<string, unknown>>;
  teamUtilization: Array<Record<string, unknown>>;
  bugTrends: Array<Record<string, unknown>>;
}

function resolveDateRange(type: ReportType, dateRange: { from: string; to: string }) {
  const now = dayjs();
  switch (type) {
    case 'DAILY':
      return {
        from: now.subtract(1, 'day').startOf('day'),
        to: now.subtract(1, 'day').endOf('day'),
      };
    case 'WEEKLY':
      return { from: now.subtract(7, 'day').startOf('day'), to: now.endOf('day') };
    case 'MONTHLY':
      return { from: now.subtract(30, 'day').startOf('day'), to: now.endOf('day') };
    case 'QUARTERLY':
      return { from: now.subtract(90, 'day').startOf('day'), to: now.endOf('day') };
    case 'YEARLY':
      return { from: now.subtract(365, 'day').startOf('day'), to: now.endOf('day') };
    case 'CUSTOM':
    default:
      return {
        from: dayjs(dateRange.from).startOf('day'),
        to: dayjs(dateRange.to).endOf('day'),
      };
  }
}

async function fetchReportData(
  organizationId: string,
  input: GenerateReportInput,
): Promise<ReportData> {
  const range = resolveDateRange(input.type, input.dateRange);
  const from = range.from.toDate();
  const to = range.to.toDate();

  const taskWhere = {
    deletedAt: null,
    project: { organizationId, deletedAt: null },
    ...(input.projectId && { projectId: input.projectId }),
    updatedAt: { gte: from, lte: to },
  };

  const [tasks, worklogs] = await Promise.all([
    prisma.task.findMany({
      where: taskWhere,
      include: {
        project: { select: { key: true, name: true } },
        assignees: { include: { user: { select: { firstName: true, lastName: true } } } },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.worklog.findMany({
      where: {
        startedAt: { gte: from, lte: to },
        user: { organizationId },
        ...(input.projectId && { task: { projectId: input.projectId } }),
      },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        task: { select: { key: true, title: true } },
      },
    }),
  ]);

  const taskSummary = tasks.map((task) => ({
    key: task.key,
    title: task.title,
    project: task.project.key,
    status: task.status,
    priority: task.priority,
    type: task.type,
    assignees: task.assignees.map((a) => `${a.user.firstName} ${a.user.lastName}`).join(', '),
    dueDate: task.dueDate?.toISOString().slice(0, 10) ?? '',
    updatedAt: task.updatedAt.toISOString(),
  }));

  const utilizationMap = new Map<string, { user: string; email: string; hours: number; entries: number }>();
  for (const log of worklogs) {
    const name = `${log.user.firstName} ${log.user.lastName}`;
    const hours = (log.productiveMinutes ?? 0) / 60;
    const existing = utilizationMap.get(log.userId) ?? {
      user: name,
      email: log.user.email,
      hours: 0,
      entries: 0,
    };
    existing.hours += hours;
    existing.entries += 1;
    utilizationMap.set(log.userId, existing);
  }

  const teamUtilization = [...utilizationMap.values()].map((row) => ({
    ...row,
    hours: Math.round(row.hours * 100) / 100,
  }));

  const bugTrends = tasks
    .filter((task) => task.type === 'BUG_FIX')
    .map((task) => ({
      key: task.key,
      title: task.title,
      status: task.status,
      priority: task.priority,
      project: task.project.key,
    }));

  return {
    generatedAt: new Date().toISOString(),
    type: input.type,
    dateRange: { from: range.from.toISOString(), to: range.to.toISOString() },
    taskSummary,
    teamUtilization,
    bugTrends,
  };
}

function reportsDir() {
  const dir = path.resolve(config.STORAGE_LOCAL_PATH, 'reports');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

async function writeCsvReport(reportId: string, data: ReportData, sections: string[]) {
  const chunks: string[] = [];
  if (sections.includes('task_summary')) {
    chunks.push('Task Summary');
    chunks.push(stringify(data.taskSummary, { header: true }));
    chunks.push('');
  }
  if (sections.includes('team_utilization')) {
    chunks.push('Team Utilization');
    chunks.push(stringify(data.teamUtilization, { header: true }));
    chunks.push('');
  }
  if (sections.includes('bug_trends')) {
    chunks.push('Bug Trends');
    chunks.push(stringify(data.bugTrends, { header: true }));
  }
  const content = chunks.join('\n');
  const storageKey = `reports/${reportId}.csv`;
  await fs.promises.writeFile(path.join(reportsDir(), `${reportId}.csv`), content, 'utf8');
  return { storageKey, fileSize: Buffer.byteLength(content, 'utf8'), mimeType: 'text/csv' };
}

async function writeJsonReport(reportId: string, data: ReportData, sections: string[]) {
  const payload: Record<string, unknown> = {
    generatedAt: data.generatedAt,
    type: data.type,
    dateRange: data.dateRange,
  };
  if (sections.includes('task_summary')) payload.taskSummary = data.taskSummary;
  if (sections.includes('team_utilization')) payload.teamUtilization = data.teamUtilization;
  if (sections.includes('bug_trends')) payload.bugTrends = data.bugTrends;

  const content = JSON.stringify(payload, null, 2);
  const storageKey = `reports/${reportId}.json`;
  await fs.promises.writeFile(path.join(reportsDir(), `${reportId}.json`), content, 'utf8');
  return { storageKey, fileSize: Buffer.byteLength(content, 'utf8'), mimeType: 'application/json' };
}

async function writeExcelReport(reportId: string, data: ReportData, sections: string[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Htask';
  workbook.created = new Date();

  if (sections.includes('task_summary')) {
    const sheet = workbook.addWorksheet('Task Summary');
    sheet.columns = [
      { header: 'Key', key: 'key', width: 14 },
      { header: 'Title', key: 'title', width: 36 },
      { header: 'Project', key: 'project', width: 12 },
      { header: 'Status', key: 'status', width: 18 },
      { header: 'Priority', key: 'priority', width: 12 },
      { header: 'Type', key: 'type', width: 14 },
      { header: 'Assignees', key: 'assignees', width: 24 },
      { header: 'Due', key: 'dueDate', width: 12 },
    ];
    sheet.addRows(data.taskSummary);
  }

  if (sections.includes('team_utilization')) {
    const sheet = workbook.addWorksheet('Team Utilization');
    sheet.columns = [
      { header: 'User', key: 'user', width: 24 },
      { header: 'Email', key: 'email', width: 28 },
      { header: 'Hours', key: 'hours', width: 10 },
      { header: 'Entries', key: 'entries', width: 10 },
    ];
    sheet.addRows(data.teamUtilization);
  }

  if (sections.includes('bug_trends')) {
    const sheet = workbook.addWorksheet('Bug Trends');
    sheet.columns = [
      { header: 'Key', key: 'key', width: 14 },
      { header: 'Title', key: 'title', width: 36 },
      { header: 'Status', key: 'status', width: 18 },
      { header: 'Priority', key: 'priority', width: 12 },
      { header: 'Project', key: 'project', width: 12 },
    ];
    sheet.addRows(data.bugTrends);
  }

  const storageKey = `reports/${reportId}.xlsx`;
  const filePath = path.join(reportsDir(), `${reportId}.xlsx`);
  await workbook.xlsx.writeFile(filePath);
  const stat = await fs.promises.stat(filePath);
  return {
    storageKey,
    fileSize: stat.size,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
}

async function writeHtmlReport(reportId: string, data: ReportData, sections: string[]) {
  const sectionHtml = sections
    .map((section) => {
      const rows =
        section === 'task_summary'
          ? data.taskSummary
          : section === 'team_utilization'
            ? data.teamUtilization
            : data.bugTrends;
      const title = section.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
      if (!rows.length) return `<h2>${title}</h2><p>No data for this period.</p>`;

      const headers = Object.keys(rows[0]);
      const head = headers.map((h) => `<th>${h}</th>`).join('');
      const body = rows
        .map((row) => `<tr>${headers.map((h) => `<td>${row[h] ?? ''}</td>`).join('')}</tr>`)
        .join('');

      return `<h2>${title}</h2><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
    })
    .join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Htask Report</title>
<style>body{font-family:Inter,sans-serif;padding:32px;color:#111}h1{margin-bottom:4px}p{color:#666}
table{border-collapse:collapse;width:100%;margin:16px 0 32px}th,td{border:1px solid #ddd;padding:8px;text-align:left;font-size:13px}
th{background:#f4f4f5}</style></head><body>
<h1>Htask Report</h1><p>Generated ${data.generatedAt} · ${data.type}</p>${sectionHtml}</body></html>`;

  const storageKey = `reports/${reportId}.html`;
  await fs.promises.writeFile(path.join(reportsDir(), `${reportId}.html`), html, 'utf8');
  return { storageKey, fileSize: Buffer.byteLength(html, 'utf8'), mimeType: 'text/html' };
}

export async function buildAndStoreReport(
  reportId: string,
  organizationId: string,
  input: GenerateReportInput,
) {
  const data = await fetchReportData(organizationId, input);

  switch (input.format) {
    case 'CSV':
      return writeCsvReport(reportId, data, input.sections);
    case 'JSON':
      return writeJsonReport(reportId, data, input.sections);
    case 'EXCEL':
      return writeExcelReport(reportId, data, input.sections);
    case 'PDF':
      return writeHtmlReport(reportId, data, input.sections);
    default:
      return writeCsvReport(reportId, data, input.sections);
  }
}

export function getReportFilePath(storageKey: string) {
  const fileName = path.basename(storageKey);
  return path.join(reportsDir(), fileName);
}

export function getReportMimeType(format: ReportFormat, storageKey?: string | null) {
  if (storageKey?.endsWith('.json')) return 'application/json';
  if (storageKey?.endsWith('.xlsx')) {
    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  }
  if (storageKey?.endsWith('.html')) return 'text/html';
  return 'text/csv';
}
