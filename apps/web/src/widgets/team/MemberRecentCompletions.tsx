import { CheckCircle2 } from 'lucide-react';

type CompletionRow = {
  taskId: string;
  taskKey: string;
  taskTitle: string;
  projectId: string;
  projectKey: string;
  projectName: string;
  completedAt: string;
  estimatedHours: number | null;
  actualHours: number | null;
  varianceHours: number | null;
  etaBucket: 'before_eta' | 'on_eta' | 'over_eta' | 'no_eta_data';
};

const ETA_LABEL: Record<CompletionRow['etaBucket'], string> = {
  before_eta: 'Before ETA',
  on_eta: 'On ETA',
  over_eta: 'Over ETA',
  no_eta_data: 'No ETA data',
};

const ETA_CLASS: Record<CompletionRow['etaBucket'], string> = {
  before_eta: 'text-emerald-600 dark:text-emerald-400',
  on_eta: 'text-blue-600 dark:text-blue-400',
  over_eta: 'text-amber-600 dark:text-amber-400',
  no_eta_data: 'text-muted-foreground',
};

export function MemberRecentCompletions({
  rows,
  memberFirstName,
}: {
  rows: CompletionRow[];
  memberFirstName: string;
}) {
  if (!rows.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-muted">
          <CheckCircle2 className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="font-semibold">No completed tasks yet</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Once {memberFirstName} completes a task, it&apos;ll appear here with its ETA outcome and
          time variance.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-sm">
        <thead>
          <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <th className="px-2 py-2 text-left">Task</th>
            <th className="px-2 py-2 text-left">Project</th>
            <th className="px-2 py-2 text-left">Completed at</th>
            <th className="px-2 py-2 text-right">Estimated (h)</th>
            <th className="px-2 py-2 text-right">Actual (h)</th>
            <th className="px-2 py-2 text-right">Variance (h)</th>
            <th className="px-2 py-2 text-left">ETA outcome</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.taskId} className="border-b border-border/60">
              <td className="px-2 py-3">
                <p className="font-medium">{row.taskTitle}</p>
                <p className="text-xs text-muted-foreground">{row.taskKey}</p>
              </td>
              <td className="px-2 py-3">
                <p>{row.projectName}</p>
                <p className="text-xs text-muted-foreground">{row.projectKey}</p>
              </td>
              <td className="px-2 py-3">{new Date(row.completedAt).toLocaleDateString()}</td>
              <td className="px-2 py-3 text-right tabular-nums">{row.estimatedHours ?? '—'}</td>
              <td className="px-2 py-3 text-right tabular-nums">{row.actualHours ?? '—'}</td>
              <td className="px-2 py-3 text-right tabular-nums">{row.varianceHours ?? '—'}</td>
              <td className={`px-2 py-3 ${ETA_CLASS[row.etaBucket]}`}>{ETA_LABEL[row.etaBucket]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
