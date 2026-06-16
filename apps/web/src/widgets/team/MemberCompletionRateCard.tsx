function ProgressRing({ percent }: { percent: number }) {
  const size = 132;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(percent, 100) / 100) * circumference;

  return (
    <div className="relative flex h-[132px] w-[132px] items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-muted/40"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          className="text-foreground"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-2xl font-bold tabular-nums">{percent}%</p>
        <p className="text-xs text-muted-foreground">complete</p>
      </div>
    </div>
  );
}

interface MemberCompletionRateCardProps {
  completedTasks: number;
  totalAssignedTasks: number;
  totalProductiveHours: number;
  completionRate: number;
}

export function MemberCompletionRateCard({
  completedTasks,
  totalAssignedTasks,
  totalProductiveHours,
  completionRate,
}: MemberCompletionRateCardProps) {
  const rows = [
    { label: 'Completed', value: completedTasks },
    { label: 'Assigned', value: totalAssignedTasks },
    { label: 'Productive hours', value: totalProductiveHours },
  ];

  return (
    <div className="dashboard-card p-5">
      <h3 className="text-base font-semibold">Completion rate</h3>
      <p className="mt-1 text-sm text-muted-foreground">Tasks completed out of assigned.</p>

      <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:items-center">
        <ProgressRing percent={completionRate} />
        <div className="w-full flex-1 divide-y divide-border">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between py-3 text-sm">
              <span className="text-muted-foreground">{row.label}</span>
              <span className="font-semibold tabular-nums">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
