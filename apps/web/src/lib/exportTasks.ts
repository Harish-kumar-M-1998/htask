import * as XLSX from 'xlsx';
import { formatTaskStatus, formatTaskType } from '@htask/shared';
import { formatDate } from './utils';

export interface ExportableTask {
  key?: string;
  title?: string;
  description?: string | null;
  status?: string;
  priority?: string;
  type?: string;
  dueDate?: string | null;
  createdAt?: string;
  project?: { name?: string; key?: string };
  assignees?: Array<{ user: { firstName: string; lastName: string } }>;
}

function taskRows(tasks: ExportableTask[]) {
  return tasks.map((task) => ({
    Key: task.key ?? '',
    Title: task.title ?? '',
    Description: task.description ?? '',
    Status: task.status ? formatTaskStatus(task.status) : '',
    Priority: task.priority ?? '',
    Type: task.type ? formatTaskType(task.type) : '',
    Project: task.project?.name ?? '',
    'Project Key': task.project?.key ?? '',
    Assignees: (task.assignees ?? [])
      .map((a) => `${a.user.firstName} ${a.user.lastName}`)
      .join(', '),
    'Due Date': task.dueDate ? formatDate(task.dueDate) : '',
    Created: task.createdAt ? formatDate(task.createdAt) : '',
  }));
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportTasksToCsv(tasks: ExportableTask[], filename = 'tasks.csv') {
  const rows = taskRows(tasks);
  const headers = Object.keys(rows[0] ?? {
    Key: '', Title: '', Description: '', Status: '', Priority: '', Type: '',
    Project: '', 'Project Key': '', Assignees: '', 'Due Date': '', Created: '',
  });

  const escape = (value: string) => {
    const text = String(value ?? '');
    if (/[",\n]/.test(text)) {
      return `"${text.replace(/"/g, '""')}"`;
    }
    return text;
  };

  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escape(String(row[h as keyof typeof row] ?? ''))).join(',')),
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, filename);
}

export function exportTasksToXlsx(tasks: ExportableTask[], filename = 'tasks.xlsx') {
  const rows = taskRows(tasks);
  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');
  XLSX.writeFile(workbook, filename);
}
