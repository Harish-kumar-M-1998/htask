type ProjectBreakdownRow = {
  projectId: string;
  projectKey: string;
  projectName: string;
  assignedTasks: number;
  completedTasks: number;
  beforeEta: number;
  onEta: number;
  overEta: number;
  noEtaData: number;
  avgVarianceHours: number | null;
};

export function MemberProjectBreakdownTable({ rows }: { rows: ProjectBreakdownRow[] }) {
  if (!rows.length) {
    return <p className="text-sm text-muted-foreground">No project contribution data available.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-border text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <th className="px-2 py-2 text-left">Project</th>
            <th className="px-2 py-2 text-right">Assigned</th>
            <th className="px-2 py-2 text-right">Completed</th>
            <th className="px-2 py-2 text-right">Before</th>
            <th className="px-2 py-2 text-right">On</th>
            <th className="px-2 py-2 text-right">Over</th>
            <th className="px-2 py-2 text-right">No data</th>
            <th className="px-2 py-2 text-right">Avg var (h)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.projectId} className="border-b border-border/60">
              <td className="px-2 py-3">
                <p className="font-medium">{row.projectName}</p>
                <p className="text-xs text-muted-foreground">{row.projectKey}</p>
              </td>
              <td className="px-2 py-3 text-right tabular-nums">{row.assignedTasks}</td>
              <td className="px-2 py-3 text-right tabular-nums">{row.completedTasks}</td>
              <td className="px-2 py-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">
                {row.beforeEta}
              </td>
              <td className="px-2 py-3 text-right tabular-nums text-blue-600 dark:text-blue-400">
                {row.onEta}
              </td>
              <td className="px-2 py-3 text-right tabular-nums text-amber-600 dark:text-amber-400">
                {row.overEta}
              </td>
              <td className="px-2 py-3 text-right tabular-nums text-muted-foreground">
                {row.noEtaData}
              </td>
              <td className="px-2 py-3 text-right tabular-nums">
                {row.avgVarianceHours == null ? '—' : row.avgVarianceHours}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
