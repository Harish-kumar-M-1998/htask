import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { formatDate, formatRelativeTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

export interface AuditLogRow {
  id: string;
  action: string;
  entityType: string;
  entityTypeLabel?: string;
  entityLabel?: string;
  details?: string | null;
  entityId: string;
  ipAddress?: string | null;
  browser?: string | null;
  createdAt: string;
  user?: { firstName: string; lastName: string; email: string } | null;
}

const columnHelper = createColumnHelper<AuditLogRow>();

const ACTION_COLORS: Record<string, string> = {
  TASK_TRANSITIONED: 'bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300',
  TASK_CREATED: 'pill-brand',
  TASK_UPDATED: 'bg-muted text-muted-foreground',
  TASK_DELETED: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
  PROJECT_CREATED: 'pill-brand',
  PROJECT_UPDATED: 'bg-muted text-muted-foreground',
  PROJECT_DELETED: 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300',
  USER_LOGIN: 'bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-300',
};

function actionBadgeClass(action: string) {
  return ACTION_COLORS[action] ?? 'bg-muted text-muted-foreground';
}

interface AuditTableProps {
  logs: AuditLogRow[];
  className?: string;
}

export function AuditTable({ logs, className }: AuditTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor('createdAt', {
        header: 'Time',
        cell: (info) => {
          const value = info.getValue();
          return (
            <div>
              <p className="text-sm whitespace-nowrap">{formatRelativeTime(value)}</p>
              <p className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(value)}</p>
            </div>
          );
        },
      }),
      columnHelper.accessor('action', {
        header: 'Action',
        cell: (info) => {
          const action = info.getValue();
          return (
            <span className={`inline-flex rounded-md px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${actionBadgeClass(action)}`}>
              {action.replace(/_/g, ' ')}
            </span>
          );
        },
      }),
      columnHelper.display({
        id: 'entity',
        header: 'Entity',
        cell: ({ row }) => (
          <div className="max-w-[200px]">
            <p className="text-sm font-medium truncate">{row.original.entityTypeLabel ?? row.original.entityType}</p>
            <p className="text-xs text-muted-foreground truncate">
              {row.original.entityLabel && row.original.entityLabel !== '—'
                ? row.original.entityLabel
                : 'No longer available'}
            </p>
          </div>
        ),
      }),
      columnHelper.accessor('details', {
        header: 'Details',
        cell: (info) => (
          <span className="text-sm text-muted-foreground line-clamp-2 max-w-[180px]">
            {info.getValue() ?? '—'}
          </span>
        ),
      }),
      columnHelper.display({
        id: 'user',
        header: 'User',
        cell: ({ row }) => {
          const user = row.original.user;
          if (!user) return <span className="text-sm text-muted-foreground">System</span>;
          return (
            <div className="max-w-[160px]">
              <p className="text-sm font-medium truncate">{user.firstName} {user.lastName}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'source',
        header: 'Source',
        cell: ({ row }) => (
          <div className="text-xs text-muted-foreground max-w-[120px]">
            <p className="truncate">{row.original.browser ?? '—'}</p>
            <p className="truncate">{row.original.ipAddress ?? '—'}</p>
          </div>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: logs,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (logs.length === 0) {
    return (
      <div className={cn('flex flex-1 items-center justify-center min-h-[200px]', className)}>
        <p className="text-sm text-muted-foreground">No audit records found</p>
      </div>
    );
  }

  return (
    <div className={cn('flex-1 min-h-0 min-w-0 overflow-auto', className)}>
      <table className="w-full text-sm table-fixed min-w-[720px]">
        <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b border-border">
              {hg.headers.map((header) => (
                <th key={header.id} className="px-4 py-3 text-left font-medium text-muted-foreground">
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="border-b border-border last:border-0 hover:bg-accent/30 transition-colors">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3 align-top">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
