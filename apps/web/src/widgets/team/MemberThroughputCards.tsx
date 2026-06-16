interface MemberKpis {
  totalAssignedTasks: number;
  completedTasks: number;
  completionRate: number;
  completedBeforeEta: number;
  completedOnEta: number;
  completedOverEta: number;
  totalProductiveHours: number;
}

export function MemberThroughputCards({ kpis }: { kpis: MemberKpis }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <div className="dashboard-card p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Throughput
        </p>
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Assigned tasks', value: kpis.totalAssignedTasks },
            { label: 'Completed tasks', value: kpis.completedTasks },
            { label: 'Completion rate', value: `${kpis.completionRate}%` },
            { label: 'Productive hours', value: kpis.totalProductiveHours },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-2xl font-bold tracking-tight tabular-nums">{item.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-card p-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          ETA quality
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          {[
            { label: 'Before ETA', value: kpis.completedBeforeEta, dot: 'bg-emerald-500' },
            { label: 'On ETA', value: kpis.completedOnEta, dot: 'bg-blue-500' },
            { label: 'Over ETA', value: kpis.completedOverEta, dot: 'bg-amber-500' },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <p className="text-2xl font-bold tracking-tight tabular-nums">{item.value}</p>
              <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
                <span className={`h-2 w-2 rounded-full ${item.dot}`} />
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
