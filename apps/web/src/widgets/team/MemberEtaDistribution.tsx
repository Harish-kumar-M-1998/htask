import { Clock } from 'lucide-react';

type EtaBucket = 'before_eta' | 'on_eta' | 'over_eta' | 'no_eta_data';

type EtaRow = {
  bucket: EtaBucket;
  count: number;
};

const LEGEND: Array<{ bucket: EtaBucket; label: string; color: string }> = [
  { bucket: 'before_eta', label: 'Before ETA', color: 'bg-emerald-500' },
  { bucket: 'on_eta', label: 'On ETA', color: 'bg-blue-500' },
  { bucket: 'over_eta', label: 'Over ETA', color: 'bg-amber-500' },
  { bucket: 'no_eta_data', label: 'No ETA data', color: 'bg-slate-300 dark:bg-slate-600' },
];

function EtaDonut({ total }: { total: number }) {
  const size = 132;
  const stroke = 10;
  const radius = (size - stroke) / 2;

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
          strokeDasharray="4 6"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <p className="text-2xl font-bold tabular-nums">{total}</p>
        <p className="text-xs text-muted-foreground">completed</p>
      </div>
    </div>
  );
}

export function MemberEtaDistribution({ rows }: { rows: EtaRow[] }) {
  const countMap = new Map(rows.map((row) => [row.bucket, row.count]));
  const completedTotal =
    (countMap.get('before_eta') ?? 0) +
    (countMap.get('on_eta') ?? 0) +
    (countMap.get('over_eta') ?? 0) +
    (countMap.get('no_eta_data') ?? 0);

  return (
    <div className="dashboard-card p-5 h-full">
      <h3 className="text-base font-semibold">ETA outcome distribution</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Completion quality relative to estimated hours.
      </p>

      <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:items-start">
        <EtaDonut total={completedTotal} />
        <div className="w-full flex-1 space-y-3">
          {LEGEND.map((item) => (
            <div key={item.bucket} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className={`h-2.5 w-2.5 rounded-sm ${item.color}`} />
                {item.label}
              </span>
              <span className="font-semibold tabular-nums">{countMap.get(item.bucket) ?? 0}</span>
            </div>
          ))}
        </div>
      </div>

      {completedTotal === 0 && (
        <p className="mt-5 flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          No completed tasks yet to measure.
        </p>
      )}
    </div>
  );
}
