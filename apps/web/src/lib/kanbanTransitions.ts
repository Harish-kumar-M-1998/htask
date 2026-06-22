import { KANBAN_COLUMNS } from '@/lib/kanbanColumns';

export type TransitionOption = { toState: string };

const columnOrder = new Map(KANBAN_COLUMNS.map((c, i) => [c.id, i]));

export function getColumnIndex(columnId: string): number {
  return columnOrder.get(columnId) ?? -1;
}

export function getColumnIdForStatus(status: string): string {
  return KANBAN_COLUMNS.find((c) => c.statuses.includes(status))?.id ?? 'backlog';
}

export function isBackwardColumnDrop(fromStatus: string, toColumnId: string): boolean {
  const fromColumnId = getColumnIdForStatus(fromStatus);
  const from = getColumnIndex(fromColumnId);
  const to = getColumnIndex(toColumnId);
  return from >= 0 && to >= 0 && to < from;
}

export function hasDirectTransitionToColumn(
  immediateTransitions: string[],
  targetStatuses: string[],
): boolean {
  return immediateTransitions.some((toState) => targetStatuses.includes(toState));
}
