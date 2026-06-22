import { TASK_STATUSES, formatTaskStatus } from '@htask/shared';

export type KanbanColumn = {
  id: string;
  title: string;
  statuses: string[];
  accent: string;
};

export const KANBAN_COLUMNS: KanbanColumn[] = [
  {
    id: 'backlog',
    title: 'Backlog',
    statuses: ['DRAFT', 'OPEN'],
    accent: 'border-t-slate-400',
  },
  {
    id: 'todo',
    title: 'To Do',
    statuses: ['ASSIGNED'],
    accent: 'border-t-indigo-400',
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    statuses: ['IN_PROGRESS', 'BLOCKED'],
    accent: 'border-t-sky-400',
  },
  {
    id: 'dev',
    title: 'Dev & MR',
    statuses: ['DEVELOPMENT_COMPLETE', 'MR_RAISED', 'MR_APPROVED'],
    accent: 'border-t-violet-400',
  },
  {
    id: 'staging',
    title: 'Staging',
    statuses: ['MOVED_TO_STAGE', 'STAGE_VERIFIED'],
    accent: 'border-t-cyan-400',
  },
  {
    id: 'qa',
    title: 'QA',
    statuses: ['MOVED_TO_QA', 'QA_TESTING', 'QA_FAILED', 'QA_PASSED'],
    accent: 'border-t-amber-400',
  },
  {
    id: 'release',
    title: 'Release',
    statuses: ['READY_FOR_PRODUCTION', 'DEPLOYED'],
    accent: 'border-t-teal-400',
  },
  {
    id: 'done',
    title: 'Done',
    statuses: ['CLOSED', 'ARCHIVED'],
    accent: 'border-t-emerald-400',
  },
];

const statusToColumn = new Map<string, KanbanColumn>();
for (const column of KANBAN_COLUMNS) {
  for (const status of column.statuses) {
    statusToColumn.set(status, column);
  }
}

export function getKanbanColumnForStatus(status: string): KanbanColumn {
  return statusToColumn.get(status) ?? KANBAN_COLUMNS[0];
}

export function groupTasksByKanbanColumn<T extends { status: string }>(
  tasks: T[],
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  for (const column of KANBAN_COLUMNS) {
    grouped.set(column.id, []);
  }
  for (const task of tasks) {
    const column = getKanbanColumnForStatus(task.status);
    grouped.get(column.id)!.push(task);
  }
  return grouped;
}

export function isKnownKanbanStatus(status: string): boolean {
  return (TASK_STATUSES as readonly string[]).includes(status);
}

export function formatKanbanColumnTitle(status: string): string {
  return getKanbanColumnForStatus(status).title;
}

export function formatTransitionActivityMessage(fromStatus: string, toStatus: string): string {
  const fromColumn = getKanbanColumnForStatus(fromStatus);
  const toColumn = getKanbanColumnForStatus(toStatus);

  if (fromColumn.id === toColumn.id) {
    return `Changed status from ${formatTaskStatus(fromStatus)} to ${formatTaskStatus(toStatus)}`;
  }

  return `Moved from ${fromColumn.title} to ${toColumn.title}`;
}
