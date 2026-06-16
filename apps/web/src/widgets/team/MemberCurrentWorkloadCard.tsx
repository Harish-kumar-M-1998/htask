function formatStatusLabel(status: string): string {
  return status
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

interface MemberCurrentWorkloadCardProps {
  activeTasks: number;
  currentProjectsCount: number;
  workedProjectsCount: number;
  activeByStatus: Array<{ status: string; count: number }>;
}

export function MemberCurrentWorkloadCard({
  activeTasks,
  currentProjectsCount,
  workedProjectsCount,
  activeByStatus,
}: MemberCurrentWorkloadCardProps) {
  const rows = [
    { label: 'Active tasks', value: activeTasks },
    { label: 'Current projects', value: currentProjectsCount },
    { label: 'Worked projects (all-time)', value: workedProjectsCount },
  ];

  return (
    <div className="dashboard-card p-5 h-full">
      <h3 className="text-base font-semibold">Current workload</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Active tasks and project participation snapshot.
      </p>

      <div className="mt-4 divide-y divide-border">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between py-3 text-sm">
            <span className="text-muted-foreground">{row.label}</span>
            <span className="font-semibold tabular-nums">{row.value}</span>
          </div>
        ))}
      </div>

      {activeByStatus.length > 0 && (
        <div className="mt-4 space-y-2">
          {activeByStatus.map((item) => (
            <div
              key={item.status}
              className="flex items-center justify-between rounded-lg pill-brand px-3 py-2 text-sm"
            >
              <span>{formatStatusLabel(item.status)}</span>
              <span className="font-semibold tabular-nums">{item.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
