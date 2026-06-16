import { useMemo } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from '@tanstack/react-table';
import { Badge } from '@/shared/ui/badge';
import { PRIORITY_COLORS } from '@/lib/utils';
import { formatTaskStatus, formatTaskType } from '@htask/shared';

const columnHelper = createColumnHelper<Record<string, unknown>>();

interface TaskTableProps {
  tasks: Record<string, unknown>[];
  onRowClick?: (id: string) => void;
  showProject?: boolean;
  showModule?: boolean;
}

export function TaskTable({
  tasks,
  onRowClick,
  showProject = true,
  showModule = false,
}: TaskTableProps) {
  const columns = useMemo(
    () => [
      columnHelper.accessor('key', { header: 'Key', cell: (info) => (
        <span className="font-mono text-xs">{info.getValue() as string}</span>
      )}),
      columnHelper.accessor('title', {
        header: 'Title',
        cell: (info) => <span className="truncate block">{info.getValue() as string}</span>,
      }),
      ...(showProject
        ? [
            columnHelper.display({
              id: 'project',
              header: 'Project',
              cell: ({ row }) => {
                const project = row.original.project as { name?: string; key?: string } | undefined;
                return project ? (
                  <span className="text-sm">
                    {project.name}
                    <span className="text-muted-foreground ml-1 font-mono text-xs">({project.key})</span>
                  </span>
                ) : '—';
              },
            }),
          ]
        : []),
      ...(showModule
        ? [
            columnHelper.display({
              id: 'module',
              header: 'Module',
              cell: ({ row }) => {
                const module = row.original.module as { name?: string } | undefined;
                return <span className="text-sm truncate block">{module?.name ?? '—'}</span>;
              },
            }),
          ]
        : []),
      columnHelper.accessor('status', { header: 'Status', cell: (info) => (
        <Badge variant="status" status={info.getValue() as string}>
          {formatTaskStatus(info.getValue() as string)}
        </Badge>
      )}),
      columnHelper.accessor('priority', { header: 'Priority', cell: (info) => (
        <span className={`text-sm font-medium ${PRIORITY_COLORS[info.getValue() as string]}`}>
          {info.getValue() as string}
        </span>
      )}),
      columnHelper.accessor('type', { header: 'Type', cell: (info) => (
        <span className="text-sm">{formatTaskType(info.getValue() as string)}</span>
      )}),
    ],
    [showProject, showModule],
  );

  const table = useReactTable({
    data: tasks,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full text-sm table-fixed min-w-[720px]">
        <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id} className="border-b border-border bg-muted/50">
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
            <tr
              key={row.id}
              className="border-b border-border hover:bg-accent/30 transition-colors cursor-pointer"
              onClick={() => onRowClick?.(row.original.id as string)}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        </table>
      </div>
    </div>
  );
}
